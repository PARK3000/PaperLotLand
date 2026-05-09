/**
 * Google Places API integration for live reviews.
 *
 * Fetches reviews, rating, and review count from the Google Places API (New).
 * Results are cached via Next.js `fetch` revalidation (default 24 hours).
 *
 * Requires GOOGLE_PLACES_API_KEY environment variable.
 */

import { cache } from 'react'
import { GOOGLE_REVIEWS } from './constants'

export interface GoogleReview {
  name: string
  date: string
  text: string
  rating: number
  profilePhotoUrl?: string
}

export interface GoogleReviewsData {
  rating: string
  count: number
  reviews: GoogleReview[]
  live: boolean // true if data came from API, false if fallback
}

const PLACE_ID = GOOGLE_REVIEWS.placeId
const REVALIDATE_SECONDS = 86400 // 24 hours

/**
 * Fetches live Google Reviews data from the Places API (New).
 * Falls back to hardcoded data if the API key is missing or the request fails.
 * Wrapped with React.cache() so it runs at most once per server request.
 */
export const getGoogleReviews = cache(async (): Promise<GoogleReviewsData> => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    return getFallbackReviews()
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${PLACE_ID}?fields=rating,userRatingCount,reviews&languageCode=en`

    const response = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews.rating,reviews.text.text,reviews.authorAttribution.displayName,reviews.authorAttribution.photoUri,reviews.relativePublishTimeDescription,reviews.publishTime',
      },
      next: { revalidate: REVALIDATE_SECONDS },
    })

    if (!response.ok) {
      console.error(`Google Places API error: ${response.status} ${response.statusText}`)
      return getFallbackReviews()
    }

    const data = await response.json()

    const reviews: GoogleReview[] = (data.reviews || []).map((review: {
      authorAttribution?: { displayName?: string; photoUri?: string }
      relativePublishTimeDescription?: string
      publishTime?: string
      text?: { text?: string }
      rating?: number
    }) => ({
      name: review.authorAttribution?.displayName || 'Anonymous',
      date: formatPublishTime(review.relativePublishTimeDescription, review.publishTime),
      text: review.text?.text || '',
      rating: review.rating || 5,
      profilePhotoUrl: review.authorAttribution?.photoUri,
    }))

    return {
      rating: data.rating?.toFixed(1) || GOOGLE_REVIEWS.rating,
      count: data.userRatingCount || GOOGLE_REVIEWS.count,
      reviews,
      live: true,
    }
  } catch (error) {
    console.error('Failed to fetch Google Reviews:', error)
    return getFallbackReviews()
  }
})

function formatPublishTime(relative?: string, publishTime?: string): string {
  if (relative) return relative

  if (publishTime) {
    const date = new Date(publishTime)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return ''
}

/** Static fallback reviews used when the API is unavailable. */
function getFallbackReviews(): GoogleReviewsData {
  return {
    rating: GOOGLE_REVIEWS.rating,
    count: GOOGLE_REVIEWS.count,
    reviews: [],
    live: false,
  }
}
