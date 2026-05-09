'use client'

import { useState } from 'react'
import Image from 'next/image'

interface BlogCardImageProps {
  src: string
  alt: string
}

export function BlogCardImage({ src, alt }: BlogCardImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="flex h-full items-center justify-center">
        <svg className="h-12 w-12 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={225}
      className="h-full w-full object-cover"
      sizes="(max-width: 768px) 100vw, 33vw"
      onError={() => setFailed(true)}
    />
  )
}
