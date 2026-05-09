'use client'

import { useEffect, useRef, useState } from 'react'

interface MapFacadeProps {
  src: string
  title?: string
}

export function MapFacade({ src, title = 'Our Location' }: MapFacadeProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el || isLoaded) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoaded(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [isLoaded])

  return (
    <div ref={containerRef} className="h-[450px] w-full">
      {isLoaded ? (
        <iframe
          src={src}
          width="100%"
          height="450"
          style={{ border: 0 }}
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          title={title}
          className="w-full"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-100">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary" />
        </div>
      )}
    </div>
  )
}
