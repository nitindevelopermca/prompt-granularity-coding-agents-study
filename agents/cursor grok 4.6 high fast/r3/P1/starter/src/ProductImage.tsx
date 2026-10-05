import { useState } from 'react'

type ProductImageProps = {
  src: string
  alt: string
  className?: string
}

export function ProductImage({ src, alt, className }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState('')
  const showFallback = !src || failedSrc === src

  return (
    <div className={`image-frame ${className ?? ''}`.trim()}>
      {showFallback ? (
        <div className="image-fallback" role="img" aria-label={`${alt} unavailable`}>
          Image unavailable
        </div>
      ) : (
        <img src={src} alt={alt} onError={() => setFailedSrc(src)} />
      )}
    </div>
  )
}
