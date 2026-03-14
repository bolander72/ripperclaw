interface LoadingSpriteProps {
  size?: number // px, default 48
  className?: string
}

export default function LoadingSprite({ size = 48, className = '' }: LoadingSpriteProps) {
  return (
    <img
      src="/logo-loading.gif"
      alt="Loading..."
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
