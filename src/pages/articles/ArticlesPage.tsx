import { useEffect, useMemo, useState } from 'react'
import {
  BlogPost,
  PageSearch,
  Pagination,
  type PageSearchFilterCategory,
  type PageSearchSelection,
} from '../../components/web'
import { fetchArticles } from '../../lib/sanity/articles'
import { getArticleTags } from '../../lib/sanity/mapArticle'
import type { ArticleCard } from '../../lib/sanity/types'
import { NavPage } from '../NavPage'
import '../nav-page.css'

const ARTICLES_PER_PAGE = 15

const articleFilterCategories: PageSearchFilterCategory[] = [
  {
    id: 'coarse-types',
    multiSelect: true,
    filters: [
      { id: 'blog', label: 'BLOG' },
      { id: 'news', label: 'NEWS' },
      { id: 'interviews', label: 'INTERVIEWS' },
    ],
  },
  {
    id: 'granular-types',
    multiSelect: true,
    filters: [
      { id: 'community', label: 'COMMUNITY' },
      { id: 'new-music', label: 'NEW MUSIC' },
      { id: 'listening-guide', label: 'LISTENING GUIDE' },
      { id: 'review', label: 'REVIEW' },
      { id: 'electronic', label: 'ELECTRONIC' },
      { id: 'indie', label: 'INDIE' },
    ],
  },
]

function getSelectedFilterLabels(
  categories: PageSearchFilterCategory[],
  selection: PageSearchSelection,
): string[] {
  return categories.flatMap((category) => {
    const selectedIds = selection[category.id] ?? []

    return selectedIds.flatMap((filterId) => {
      const filter = category.filters.find((item) => item.id === filterId)
      return filter ? [filter.label] : []
    })
  })
}

function articleMatchesFilters(article: ArticleCard, filterLabels: string[]): boolean {
  if (filterLabels.length === 0) return true

  const tagSet = new Set(getArticleTags(article))
  return filterLabels.every((label) => tagSet.has(label))
}

function articleMatchesSearch(article: ArticleCard, query: string): boolean {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true

  const haystack = [article.title, article.author, article.coarseTag, article.granularTag ?? '']
    .join(' ')
    .toLowerCase()

  return tokens.every((token) => haystack.includes(token))
}

export function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<PageSearchSelection>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setError(null)

    fetchArticles()
      .then((data) => {
        if (!cancelled) setArticles(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load articles')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleFilterChange = (categoryId: string, selectedIds: string[]) => {
    setSelectedFilters((current) => ({ ...current, [categoryId]: selectedIds }))
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const visibleArticles = useMemo(() => {
    const filterLabels = getSelectedFilterLabels(articleFilterCategories, selectedFilters)

    return articles.filter(
      (article) =>
        articleMatchesFilters(article, filterLabels) && articleMatchesSearch(article, searchQuery),
    )
  }, [articles, selectedFilters, searchQuery])

  const totalPages = Math.ceil(visibleArticles.length / ARTICLES_PER_PAGE)
  const paginatedArticles = visibleArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE,
  )

  return (
    <NavPage
      title="articles"
      isLoading={isLoading}
      className="nav-page--articles"
      search={
        <PageSearch
          filterCategories={articleFilterCategories}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
        />
      }
    >
      {error ? <p className="articles-page__status articles-page__status--error">{error}</p> : null}
      {!isLoading && !error && visibleArticles.length === 0 ? (
        <p className="articles-page__status">No articles found.</p>
      ) : null}
      <div className="articles-page__grid">
        {paginatedArticles.map((article) => (
          <BlogPost
            key={article.id}
            title={article.title}
            author={article.author}
            date={article.date}
            imageSrc={article.imageSrc}
            imageAlt={article.imageAlt}
            coarseTag={article.coarseTag}
            granularTag={article.granularTag}
            href={article.href}
          />
        ))}
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </NavPage>
  )
}
