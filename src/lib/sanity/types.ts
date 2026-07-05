import type {PortableTextBlock} from '@portabletext/react'

export type SanitySlug = {
  current: string
}

export type SanityCoverImage = {
  alt?: string
  asset?: {
    _ref: string
    _type: 'reference'
  }
}

export type SanityArticleListItem = {
  _id: string
  title: string
  author: string
  publishedAt: string
  coarseTag: string
  granularTag?: string
  slug: SanitySlug
  coverImage?: SanityCoverImage
}

export type SanityArticleDetail = SanityArticleListItem & {
  body?: PortableTextBlock[]
}

export type ArticleCard = {
  id: string
  title: string
  author: string
  date: string
  coarseTag: string
  granularTag?: string
  slug: string
  imageSrc?: string
  imageAlt: string
  href: string
}

export type ArticleDetail = ArticleCard & {
  body: PortableTextBlock[]
}

export type SanityShowListItem = {
  _id: string
  title: string
  hosts: string
  schedule: string
  tags: string[]
  slug: SanitySlug
  coverImage?: SanityCoverImage
}

export type SanityShowDetail = SanityShowListItem & {
  body?: PortableTextBlock[]
}

export type ShowCard = {
  id: string
  showTitle: string
  hosts: string
  schedule: string
  tags: string[]
  slug: string
  imageSrc?: string
  imageAlt: string
  href: string
}

export type ShowDetail = ShowCard & {
  body: PortableTextBlock[]
}
