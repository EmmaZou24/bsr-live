import defaultCover from '../../assets/web/dj-cover.jpg'
import { showRoute } from '../../pages/routes'
import { urlForImage } from './client'
import type { SanityShowDetail, SanityShowListItem, ShowCard, ShowDetail } from './types'

const GENRE_TAG_LABELS: Record<string, string> = {
  soul: 'SOUL',
  reggae: 'REGGAE',
  indie: 'INDIE',
  talk: 'TALK',
  'hip-hop': 'HIP HOP',
  comedy: 'COMEDY',
  rave: 'RAVE',
  electronic: 'ELECTRONIC',
}

export function genreTagLabel(value: string): string {
  return GENRE_TAG_LABELS[value] ?? value.toUpperCase()
}

export function genreTagLabels(values: string[] | undefined): string[] {
  return (values ?? []).map(genreTagLabel)
}

function coverImageUrl(show: SanityShowListItem): string | undefined {
  if (!show.coverImage?.asset) return undefined

  return urlForImage(show.coverImage).width(800).height(800).fit('crop').url()
}

export function mapShowToCard(show: SanityShowListItem): ShowCard {
  const slug = show.slug.current

  return {
    id: show._id,
    showTitle: show.title,
    hosts: show.hosts,
    schedule: show.schedule,
    tags: genreTagLabels(show.tags),
    slug,
    imageSrc: coverImageUrl(show) ?? defaultCover,
    imageAlt: show.coverImage?.alt ?? show.title,
    href: showRoute(slug),
  }
}

export function mapShowToDetail(show: SanityShowDetail): ShowDetail {
  const card = mapShowToCard(show)

  return {
    ...card,
    body: show.body ?? [],
  }
}
