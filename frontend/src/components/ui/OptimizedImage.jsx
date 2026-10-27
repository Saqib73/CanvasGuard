import { useEffect, useRef, useState } from "react";
import { getOptimizedUrl, getSrcSet } from "../../lib/cloudinary";

/**
 * Responsive Cloudinary image with a blurred LQIP placeholder.
 *
 * - Requests f_auto,q_auto and a srcset of widths so the browser picks the right size.
 * - Passes width/height to the <img> so the browser reserves space (no layout shift).
 * - Shows the tiny blurDataUrl underneath until the real image has loaded.
 *
 * `className` styles the <img>; `wrapperClassName` styles the outer container.
 */
export default function OptimizedImage({
  src,
  alt = "",
  width,
  height,
  blurDataUrl,
  sizes = "(max-width: 640px) 100vw, 600px",
  priority = false,
  className = "",
  wrapperClassName = "",
  ...rest
}) {
  const imgRef = useRef(null);
  const [loadedSrc, setLoadedSrc] = useState(null);
  const loaded = loadedSrc === src;

  // Cached images can finish loading before React attaches onLoad
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoadedSrc(src);
    }
  }, [src]);

  if (!src) return null;

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {blurDataUrl && !loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 scale-110 bg-cover bg-center blur-xl"
          style={{ backgroundImage: `url(${blurDataUrl})` }}
        />
      )}
      <img
        ref={imgRef}
        src={getOptimizedUrl(src, { width: width ? Math.min(width, 1280) : 1280 })}
        srcSet={getSrcSet(src, width)}
        sizes={sizes}
        width={width || undefined}
        height={height || undefined}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        onLoad={() => setLoadedSrc(src)}
        className={`relative block transition-opacity duration-500 ${
          loaded || !blurDataUrl ? "opacity-100" : "opacity-0"
        } ${className}`}
        {...rest}
      />
    </div>
  );
}
