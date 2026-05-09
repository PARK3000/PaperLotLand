'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface VideoSectionProps {
  className?: string
  title?: string
  subtitle?: string
  videoId?: string
}

export function VideoSection({
  className,
  title = 'Watch This Video For How Our Process Works',
  subtitle = 'See how easy it is to sell your Las Vegas home for cash',
  videoId = 'H0otvinTuPQ'
}: VideoSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  // Use hqdefault.jpg (480x360) as the default — it's always available for any
  // YouTube video, while maxresdefault.jpg only exists for ~720p+ uploads and
  // 404s for older / lower-resolution videos. (Was causing Ahrefs to flag
  // "broken images" on /, /how-it-works/, and /vs-realtor/ in 2026-05.)
  const [thumbSrc, setThumbSrc] = useState(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`)

  return (
    <section className={cn('bg-white py-16 lg:py-20', className)}>
      <div className="container-custom">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-3xl font-bold text-primary sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-gray-600">
              {subtitle}
            </p>
          )}

          {/* Video — facade pattern: thumbnail until clicked, saves 722 KiB */}
          <div className="mt-8 aspect-video w-full overflow-hidden rounded-xl shadow-2xl">
            {isPlaying ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=1`}
                title="How Our Process Works"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            ) : (
              <button
                type="button"
                className="group relative h-full w-full cursor-pointer"
                onClick={() => setIsPlaying(true)}
                aria-label="Play video: How Our Process Works"
              >
                <Image
                  src={thumbSrc}
                  alt="How Our Process Works video thumbnail"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 512px"
                  loading="lazy"
                  onError={() => setThumbSrc(`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`)}
                />
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg transition-transform group-hover:scale-110 sm:h-20 sm:w-20">
                    <svg className="ml-1 h-8 w-8 text-white sm:h-10 sm:w-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
