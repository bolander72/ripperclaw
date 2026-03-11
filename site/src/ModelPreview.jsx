import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float time;
  uniform vec3 color;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - abs(dot(viewDir, vNormal));
    fresnel = pow(fresnel, 2.0);
    float scanLine = sin(vWorldPosition.y * 80.0 + time * 2.0) * 0.5 + 0.5;
    scanLine = smoothstep(0.3, 0.7, scanLine);
    float beamY = mod(time * 0.5, 3.5) - 1.2;
    float beam = smoothstep(0.0, 0.08, beamY - vWorldPosition.y + 1.0);
    beam *= 1.0 - smoothstep(0.08, 0.25, beamY - vWorldPosition.y + 1.0);
    float alpha = (fresnel * 0.65 + 0.12) * (0.6 + scanLine * 0.4);
    alpha += beam * 0.5;
    alpha = clamp(alpha, 0.0, 1.0);
    vec3 finalColor = color * (1.0 + fresnel * 1.0 + beam * 4.0);
    gl_FragColor = vec4(finalColor, alpha);
  }
`

const MODELS = [
  { url: './models/rpm-human.glb', label: 'RPM Female (417KB)' },
  { url: './rpm-male.glb', label: 'RPM Male (733KB)' },
  { url: './models/xbot.glb', label: 'Xbot (2.8MB)' },
]

// Preload all
MODELS.forEach(m => useGLTF.preload(m.url))

function HologramModel({ url }) {
  const gltf = useGLTF(url)
  const groupRef = useRef()
  const clonedScene = useMemo(() => {
    const clone = gltf.scene.clone(true)
    return clone
  }, [gltf.scene])

  const timeUniform = useRef({ value: 0 })

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.material = new THREE.MeshBasicMaterial({
          color: new THREE.Color('#00f0ff'),
          wireframe: true,
          transparent: true,
          opacity: 0.6,
        })
      }
    })

    // Auto-center and scale
    const box = new THREE.Box3().setFromObject(clonedScene)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    // Scale based on height (Y), not max dim, so T-pose arms don't shrink the body
    const scale = 1.8 / size.y
    clonedScene.scale.setScalar(scale)
    clonedScene.position.set(-center.x * scale, -box.min.y * scale - 0.9, -center.z * scale)
  }, [clonedScene])

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.4
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  )
}

function Scene({ modelIndex }) {
  return (
    <>
      <HologramModel url={MODELS[modelIndex].url} />
      <OrbitControls enablePan={false} rotateSpeed={0.5} />
      <gridHelper args={[2, 20, '#00f0ff', '#00f0ff']} position={[0, -0.9, 0]} material-opacity={0.06} material-transparent={true} />
    </>
  )
}

export default function ModelPreview() {
  const [idx, setIdx] = useState(0)

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0f', position: 'relative' }}>
      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: 20, alignItems: 'center' }}>
        {MODELS.map((m, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            style={{
              background: i === idx ? '#00f0ff' : 'transparent',
              color: i === idx ? '#0a0a0f' : '#00f0ff',
              border: '1px solid #00f0ff',
              padding: '8px 16px',
              fontFamily: 'monospace',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <Canvas
        camera={{ position: [0, 0.2, 5.5], fov: 35 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => gl.setClearColor('#0a0a0f', 1)}
      >
        <Scene modelIndex={idx} />
      </Canvas>
    </div>
  )
}
