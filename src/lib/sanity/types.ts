import type {PortableTextBlock} from '@portabletext/react'

export type ArticleKind = 'blog' | 'news' | 'interview'

export type SanitySlug = {
  current: string
}

export type SanityImage = {
  alt?: string
  asset?: {
    _ref: string
    _type: 'reference'
  }
}

export type SanityArticleListItem = {
  _id: string
  _type: ArticleKind
  title: string
  author: string
  publishedAt: string
  granularTag?: string
  slug: SanitySlug
  coverImage?: SanityImage
}

export type SanityArticleDetail = SanityArticleListItem & {
  articleImages?: SanityImage[]
  body?: PortableTextBlock[]
  description?: PortableTextBlock[]
  transcript?: PortableTextBlock[]
  interviewLink?: string
  audioFile?: {
    asset?: {
      url?: string
    }
  }
}

export type ArticleCard = {
  id: string
  kind: ArticleKind
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

export type ArticleImage = {
  src: string
  alt: string
}

export type ArticleDetail = ArticleCard & {
  articleImages: ArticleImage[]
  body: PortableTextBlock[]
  description: PortableTextBlock[]
  transcript: PortableTextBlock[]
  interviewLink?: string
  audioFileUrl?: string
}

export type SanityShowListItem = {
  _id: string
  title: string
  hosts: string
  schedule: string
  tags: string[]
  slug: SanitySlug
  coverImage?: SanityImage
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
