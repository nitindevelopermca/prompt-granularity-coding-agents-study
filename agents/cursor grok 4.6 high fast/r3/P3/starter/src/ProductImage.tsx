import { useEffect, useState } from 'react'

type ProductImageProps = {
  src?: string
  alt: string
  className?: string
  decorative?: boolean
}

export function ProductImage({ src, alt, className, decorative = false }: ProductImageProps) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) {
    return (
      <div
        className={`image-fallback ${className ?? ''}`.trim()}
        role={decorative ? undefined : 'img'}
        aria-hidden={decorative ? true : undefined}
        aria-label={decorative ? undefined : alt}
      >
        {decorative ? '' : 'No image available'}
      </div>
    )
  }

  return <img className={className} src={src} alt={decorative ? '' : alt} onError={() => setFailed(true)} />
}
