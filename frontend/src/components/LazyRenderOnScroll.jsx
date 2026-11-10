import React, { useState, useEffect, useRef } from 'react';

/**
 * LazyRenderOnScroll
 * Defers mounting and DOM rendering of below-the-fold content until
 * it approaches the viewport (default 250px margin).
 * Disconnects observer immediately once visible and preserves DOM thereafter.
 */
export default function LazyRenderOnScroll({
  children,
  minHeight = 120,
  rootMargin = '250px',
  fallback = null
}) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [rootMargin]);

  if (isVisible) {
    return children;
  }

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
      }}
    >
      {fallback}
    </div>
  );
}
