import defaultCover from '../../assets/web/blog-cover.jpg'
import { articleRoute } from '../../pages/routes'
import { urlForImage } from './client'
import type {
  ArticleCard,
  ArticleDetail,
  ArticleImage,
  ArticleKind,
  SanityArticleDetail,
  SanityArticleListItem,
  SanityImage,
} from './types'

const COARSE_TAG_BY_KIND: Record<ArticleKind, string> = {
  blog: 'BLOG',
  news: 'NEWS',
  interview: 'INTERVIEWS',
}

const GRANULAR_TAG_LABELS: Record<string, string> = {
  community: 'COMMUNITY',
  'new-music': 'NEW MUSIC',
  'listening-guide': 'LISTENING GUIDE',
  review: 'REVIEW',
  electronic: 'ELECTRONIC',
  indie: 'INDIE',
}

function ordinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th'

  switch (day % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

export function formatArticleDate(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate

  const month = date.toLocaleString('en-US', {month: 'long'})
  const day = date.getDate()
  const year = date.getFullYear()

  return `${month} ${day}${ordinalSuffix(day)}, ${year}`
}

export function coarseTagFromKind(kind: ArticleKind): string {
  return COARSE_TAG_BY_KIND[kind]
}

export function granularTagLabel(value: string | undefined): string | undefined {
  if (!value) return undefined
  return GRANULAR_TAG_LABELS[value] ?? value.toUpperCase()
}

function imageUrl(image: SanityImage | undefined): string | undefined {
  if (!image?.asset) return undefined

  return urlForImage(image).width(800).height(800).fit('crop').url()
}

function mapArticleImages(article: SanityArticleDetail, card: ArticleCard): ArticleImage[] {
  return (article.articleImages ?? []).flatMap((image) => {
    const src = imageUrl(image)
    if (!src) return []

    return [{src, alt: image.alt ?? card.title}]
  })
}

export function mapArticleToCard(article: SanityArticleListItem): ArticleCard {
  const slug = article.slug.current
  const coarseTag = coarseTagFromKind(article._type)
  const granularTag = granularTagLabel(article.granularTag)

  return {
    id: article._id,
    kind: article._type,
    title: article.title,
    author: article.author,
    date: formatArticleDate(article.publishedAt),
    coarseTag,
    granularTag,
    slug,
    imageSrc: imageUrl(article.coverImage) ?? defaultCover,
    imageAlt: article.coverImage?.alt ?? article.title,
    href: articleRoute(slug),
  }
}

export function mapArticleToDetail(article: SanityArticleDetail): ArticleDetail {
  const card = mapArticleToCard(article)

  return {
    ...card,
    articleImages: mapArticleImages(article, card),
    body: article.body ?? [],
    description: article.description ?? [],
    transcript: article.transcript ?? [],
    interviewLink: article.interviewLink,
    audioFileUrl: article.audioFile?.asset?.url,
  }
}

export function getArticleTags(article: Pick<ArticleCard, 'coarseTag' | 'granularTag'>): string[] {
  return [article.coarseTag, article.granularTag].filter((tag): tag is string => Boolean(tag))
}
