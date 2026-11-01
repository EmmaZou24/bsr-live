import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
const ARTICLES_SCROLL_POSITION_KEY = 'bsr-articles-scroll-position'

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

function getFiltersFromSearchParams(searchParams: URLSearchParams): PageSearchSelection {
  return Object.fromEntries(
    articleFilterCategories.flatMap((category) => {
      const selectedIds = searchParams.get(`filter-${category.id}`)?.split(',').filter(Boolean) ?? []
      return selectedIds.length > 0 ? [[category.id, selectedIds]] : []
    }),
  )
}

function setFilterSearchParams(
  searchParams: URLSearchParams,
  selectedFilters: PageSearchSelection,
): URLSearchParams {
  const nextSearchParams = new URLSearchParams(searchParams)

  for (const category of articleFilterCategories) {
    const key = `filter-${category.id}`
    const selectedIds = selectedFilters[category.id] ?? []
    if (selectedIds.length > 0) nextSearchParams.set(key, selectedIds.join(','))
    else nextSearchParams.delete(key)
  }

  return nextSearchParams
}

function articleDetailHref(
  href: string,
  currentPage: number,
  selectedFilters: PageSearchSelection,
): string {
  const params = new URLSearchParams({ fromPage: String(currentPage) })

  for (const category of articleFilterCategories) {
    const selectedIds = selectedFilters[category.id] ?? []
    if (selectedIds.length > 0) params.set(`filter-${category.id}`, selectedIds.join(','))
  }

  return `${href}?${params.toString()}`
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
  const [searchParams, setSearchParams] = useSearchParams()
  const [articles, setArticles] = useState<ArticleCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<PageSearchSelection>(() =>
    getFiltersFromSearchParams(searchParams),
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(() => {
    const page = Number(searchParams.get('page'))
    return Number.isInteger(page) && page > 0 ? page : 1
  })
  const bodyRef = useRef<HTMLDivElement>(null)
  const previousPageRef = useRef<number | null>(null)

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

  useEffect(() => {
    const nextSearchParams = setFilterSearchParams(searchParams, selectedFilters)
    if (currentPage === 1) nextSearchParams.delete('page')
    else nextSearchParams.set('page', String(currentPage))

    if (nextSearchParams.toString() !== searchParams.toString()) {
      setSearchParams(nextSearchParams, { replace: true })
    }
  }, [currentPage, searchParams, selectedFilters, setSearchParams])

  useEffect(() => {
    return () => {
      const body = bodyRef.current
      if (body) sessionStorage.setItem(ARTICLES_SCROLL_POSITION_KEY, String(body.scrollTop))
    }
  }, [])

  useEffect(() => {
    if (isLoading) return

    const savedPosition = sessionStorage.getItem(ARTICLES_SCROLL_POSITION_KEY)
    if (savedPosition === null) return

    const frame = requestAnimationFrame(() => {
      const body = bodyRef.current
      if (body) body.scrollTop = Number(savedPosition)
    })

    return () => cancelAnimationFrame(frame)
  }, [isLoading])

  useEffect(() => {
    if (previousPageRef.current === null) {
      previousPageRef.current = currentPage
      return
    }

    if (previousPageRef.current === currentPage) return
    previousPageRef.current = currentPage

    const body = bodyRef.current
    if (!body) return

    const frame = requestAnimationFrame(() => {
      body.scrollTop = body.scrollHeight
    })

    return () => cancelAnimationFrame(frame)
  }, [currentPage])

  const handleFilterChange = (categoryId: string, selectedIds: string[]) => {
    const nextFilters = { ...selectedFilters, [categoryId]: selectedIds }
    const nextSearchParams = setFilterSearchParams(searchParams, nextFilters)
    nextSearchParams.delete('page')

    setSelectedFilters(nextFilters)
    setCurrentPage(1)
    setSearchParams(nextSearchParams, { replace: true })
  }

  const handleSearchChange = (value: string) => {
    const nextSearchParams = setFilterSearchParams(searchParams, selectedFilters)
    nextSearchParams.delete('page')

    setSearchQuery(value)
    setCurrentPage(1)
    setSearchParams(nextSearchParams, { replace: true })
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
      bodyRef={bodyRef}
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
            href={articleDetailHref(article.href, currentPage, selectedFilters)}
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
