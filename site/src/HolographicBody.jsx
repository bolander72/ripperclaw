import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Preload the model
useGLTF.preload('./models/rpm-human.glb')

// ── Hologram Shader ──────────
const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float time;
  uniform vec3 color;
  uniform float opacity;
  uniform float highlight;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - abs(dot(viewDir, vNormal));
    fresnel = pow(fresnel, 2.0);

    // Scan lines
    float scanLine = sin(vWorldPosition.y * 80.0 + time * 2.0) * 0.5 + 0.5;
    scanLine = smoothstep(0.3, 0.7, scanLine);

    // Fine scan
    float fineScan = sin(vWorldPosition.y * 250.0) * 0.5 + 0.5;
    fineScan = smoothstep(0.4, 0.6, fineScan) * 0.12;

    // Moving beam
    float beamY = mod(time * 0.4, 4.0) - 1.5;
    float beam = smoothstep(0.0, 0.06, beamY - vWorldPosition.y + 1.0);
    beam *= 1.0 - smoothstep(0.06, 0.2, beamY - vWorldPosition.y + 1.0);

    // Flicker
    float flicker = 0.96 + 0.04 * sin(time * 12.0 + vWorldPosition.y * 3.0);

    float alpha = (fresnel * 0.6 + 0.15) * (0.55 + scanLine * 0.45) * opacity * flicker;
    alpha += beam * 0.5;
    alpha += fineScan;
    alpha += highlight * 0.3;
    alpha = clamp(alpha, 0.0, 1.0);

    vec3 finalColor = color * (1.0 + fresnel * 0.8 + beam * 3.5 + highlight * 0.5);
    gl_FragColor = vec4(finalColor, alpha);
  }
`

// ── Slot definitions with Y ranges for body part detection ──────────
// Y ranges are in normalized model space (0 = feet, 1 = top of head)
const SLOT_REGIONS = {
  brain:    { yMin: 0.85, yMax: 1.0,  color: '#00f0ff' },
  soul:     { yMin: 0.85, yMax: 1.0,  color: '#ff00aa' },  // same as brain, aura
  eyes:     { yMin: 0.88, yMax: 0.95, color: '#ff00aa' },
  ears:     { yMin: 0.86, yMax: 0.93, color: '#00f0ff' },
  mouth:    { yMin: 0.82, yMax: 0.88, color: '#00ff88' },
  heart:    { yMin: 0.55, yMax: 0.80, color: '#ff3366' },
  os:       { yMin: 0.45, yMax: 0.55, color: '#ffcc00' },
  nervous:  { yMin: 0.35, yMax: 0.50, color: '#00ff88' },
  skeleton: { yMin: 0.0,  yMax: 0.40, color: '#8888a0' },
}

// Map a click Y position to a slot
function getSlotFromY(yNorm) {
  // Priority order matters for overlapping regions
  const order = ['eyes', 'ears', 'mouth', 'brain', 'heart', 'os', 'nervous', 'skeleton']
  for (const slot of order) {
    const r = SLOT_REGIONS[slot]
    if (yNorm >= r.yMin && yNorm <= r.yMax) return slot
  }
  return null
}

// ── The Human Model ──────────
function HumanModel({ activeSlot, onSelect }) {
  const gltf = useGLTF('./models/rpm-human.glb')
  const groupRef = useRef()
  const meshesRef = useRef([])
  const modelBounds = useRef({ min: 0, max: 1 })

  // Time uniform shared across materials
  const timeRef = useRef({ value: 0 })

  // Clone scene and apply holographic materials
  const clonedScene = useMemo(() => {
    const clone = gltf.scene.clone(true)
    return clone
  }, [gltf.scene])

  // Setup materials and compute bounds
  useEffect(() => {
    const meshes = []

    // Get model bounds first
    const box = new THREE.Box3().setFromObject(clonedScene)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    modelBounds.current = { min: box.min.y, max: box.max.y, height: size.y }

    // Scale and center
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 2.0 / maxDim
    clonedScene.scale.setScalar(scale)
    clonedScene.position.set(
      -center.x * scale,
      -box.min.y * scale - 1.0,
      -center.z * scale
    )

    // Apply holographic material to all meshes
    clonedScene.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        const mat = new THREE.ShaderMaterial({
          uniforms: {
            time: timeRef.current,
            color: { value: new THREE.Color('#00f0ff') },
            opacity: { value: 0.85 },
            highlight: { value: 0 },
          },
          vertexShader,
          fragmentShader,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
        child.material = mat
        meshes.push({ mesh: child, material: mat })
      }
    })
    meshesRef.current = meshes
  }, [clonedScene])

  // Update time and active slot highlighting
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    timeRef.current.value = t

    // Gentle idle sway
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.2
    }
  })

  // Handle clicks on the model
  const handleClick = useCallback((e) => {
    e.stopPropagation()
    const point = e.point
    // Convert world Y to normalized 0-1 range
    // The model is positioned so feet are at y=-1.0 and scales to ~2.0 height
    const yNorm = (point.y + 1.0) / 2.0
    const slot = getSlotFromY(yNorm)
    if (slot && onSelect) {
      onSelect(slot)
    }
  }, [onSelect])

  const handlePointerMove = useCallback((e) => {
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
  }, [])

  const handlePointerLeave = useCallback(() => {
    document.body.style.cursor = 'default'
  }, [])

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <primitive object={clonedScene} />
    </group>
  )
}

// ── Floating particles ──────────
function Particles() {
  const ref = useRef()
  const count = 50

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 2
      arr[i * 3 + 1] = (Math.random() - 0.5) * 2.5 - 0.1
      arr[i * 3 + 2] = (Math.random() - 0.5) * 2
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime()
      const pos = ref.current.geometry.attributes.position
      for (let i = 0; i < count; i++) {
        pos.array[i * 3 + 1] += Math.sin(t * 0.3 + i * 0.5) * 0.0003
      }
      pos.needsUpdate = true
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#00f0ff" size={0.005} transparent opacity={0.25} sizeAttenuation />
    </points>
  )
}

// ── Ground Elements ──────────
function Ground() {
  return (
    <group>
      {/* Platform rings */}
      <mesh position={[0, -1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.44, 64]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.62, 64]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.04} side={THREE.DoubleSide} />
      </mesh>
      {/* Grid */}
      <gridHelper
        args={[3, 20, '#00f0ff', '#00f0ff']}
        position={[0, -1.0, 0]}
        material-opacity={0.04}
        material-transparent={true}
      />
    </group>
  )
}

// ── Main Canvas Export ──────────
export default function HolographicBodyCanvas({ activeSlot, onSelect }) {
  return (
    <Canvas
      camera={{ position: [0, 0.2, 3.0], fov: 35 }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => gl.setClearColor('#00000000', 0)}
      dpr={[1, 2]}
    >
      <HumanModel activeSlot={activeSlot} onSelect={onSelect} />
      <Particles />
      <Ground />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.7}
        rotateSpeed={0.4}
        target={[0, -0.1, 0]}
      />
    </Canvas>
  )
}
