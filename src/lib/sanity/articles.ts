import { isSanityConfigured, sanityClient } from './client'
import { mapArticleToCard, mapArticleToDetail } from './mapArticle'
import { ARTICLE_BY_SLUG_QUERY, ARTICLES_LIST_QUERY } from './queries'
import type { ArticleCard, ArticleDetail, SanityArticleDetail, SanityArticleListItem } from './types'

export async function fetchArticles(): Promise<ArticleCard[]> {
  if (!isSanityConfigured()) {
    throw new Error('Sanity is not configured. Set SANITY_PROJECT_ID in .env.')
  }

  const articles = await sanityClient.fetch<SanityArticleListItem[]>(ARTICLES_LIST_QUERY)
  return articles.map(mapArticleToCard)
}

export async function fetchArticleBySlug(slug: string): Promise<ArticleDetail | null> {
  if (!isSanityConfigured()) {
    throw new Error('Sanity is not configured. Set SANITY_PROJECT_ID in .env.')
  }

  const article = await sanityClient.fetch<SanityArticleDetail | null>(ARTICLE_BY_SLUG_QUERY, { slug })
  if (!article) return null

  return mapArticleToDetail(article)
}
