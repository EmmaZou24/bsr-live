import { isSanityConfigured, sanityClient } from './client'
import { mapShowToCard, mapShowToDetail } from './mapShow'
import { SHOW_BY_SLUG_QUERY, SHOWS_LIST_QUERY } from './queries'
import type { SanityShowDetail, SanityShowListItem, ShowCard, ShowDetail } from './types'

export async function fetchShows(): Promise<ShowCard[]> {
  if (!isSanityConfigured()) {
    throw new Error('Sanity is not configured. Set VITE_SANITY_PROJECT_ID in .env.')
  }

  const shows = await sanityClient.fetch<SanityShowListItem[]>(SHOWS_LIST_QUERY)
  return shows.map(mapShowToCard)
}

export async function fetchShowBySlug(slug: string): Promise<ShowDetail | null> {
  if (!isSanityConfigured()) {
    throw new Error('Sanity is not configured. Set VITE_SANITY_PROJECT_ID in .env.')
  }

  const show = await sanityClient.fetch<SanityShowDetail | null>(SHOW_BY_SLUG_QUERY, { slug })
  if (!show) return null

  return mapShowToDetail(show)
}
