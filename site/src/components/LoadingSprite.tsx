interface LoadingSpriteProps {
  size?: number // px, default 48
  className?: string
}

export default function LoadingSprite({ size = 48, className = '' }: LoadingSpriteProps) {
  return (
    <div
      className={`loading-sprite ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      aria-label="Loading..."
    />
  )
}
