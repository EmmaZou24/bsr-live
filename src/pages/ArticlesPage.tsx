import { useMemo, useState } from 'react'
import {
  BlogPost,
  PageSearch,
  type PageSearchFilterCategory,
  type PageSearchSelection,
} from '../components/web'
import blogCover from '../assets/web/blog-cover.jpg'
import { NavPage } from './NavPage'
import './nav-page.css'

type MockArticle = {
  id: string
  title: string
  author: string
  date: string
  coarseTag: string
  granularTag?: string
  imageAlt: string
}

const mockArticles: MockArticle[] = [
  {
    id: 'ri-music-scene',
    title: 'Where Did The Rhode Island Music Scene Go?',
    author: 'millie cheng',
    date: 'July 12th, 2026',
    coarseTag: 'BLOG',
    granularTag: 'COMMUNITY',
    imageAlt: 'Chicken coop at a Rhode Island farm',
  },
  {
    id: 'campus-radio-history',
    title: 'Where Did The Rhode Island Music Scene Go?',
    author: 'millie cheng',
    date: 'July 12th, 2026',
    coarseTag: 'NEWS',
    imageAlt: 'Chicken coop at a Rhode Island farm',
  },
  {
    id: 'dj-spotlight',
    title: 'Where Did The Rhode Island Music Scene Go?',
    author: 'millie cheng',
    date: 'July 12th, 2026',
    coarseTag: 'INTERVIEWS',
    imageAlt: 'Chicken coop at a Rhode Island farm',
  },
  {
    id: 'freeform-manifesto',
    title: 'Why Freeform Radio Still Matters in 2026',
    author: 'seigbhlem',
    date: 'June 28th, 2026',
    coarseTag: 'BLOG',
    granularTag: 'COMMUNITY',
    imageAlt: 'Microphone in the BSR studio',
  },
  {
    id: 'summer-playlist',
    title: 'A Providence Summer Listening Guide',
    author: 'kosher music',
    date: 'June 19th, 2026',
    coarseTag: 'BLOG',
    granularTag: 'LISTENING GUIDE',
    imageAlt: 'Stack of vinyl records',
  },
  {
    id: 'local-label-review',
    title: 'Review: New Releases from Foxy Records',
    author: 'millie cheng',
    date: 'June 3rd, 2026',
    coarseTag: 'BLOG',
    granularTag: 'REVIEW',
    imageAlt: 'Album artwork on a turntable',
  },
  {
    id: 'warehouse-show-recap',
    title: 'Last Night at the Warehouse: Scene Report',
    author: 'hauntology of the phlegm',
    date: 'May 22nd, 2026',
    coarseTag: 'NEWS',
    granularTag: 'COMMUNITY',
    imageAlt: 'Crowd at a local show',
  },
]

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

function getArticleTags(article: MockArticle): string[] {
  return [article.coarseTag, article.granularTag].filter((tag): tag is string => Boolean(tag))
}

function articleMatchesFilters(article: MockArticle, filterLabels: string[]): boolean {
  if (filterLabels.length === 0) return true

  const tagSet = new Set(getArticleTags(article))
  return filterLabels.every((label) => tagSet.has(label))
}

export function ArticlesPage() {
  const [selectedFilters, setSelectedFilters] = useState<PageSearchSelection>({})
  const [, setSearchQuery] = useState('')

  const handleFilterChange = (categoryId: string, selectedIds: string[]) => {
    setSelectedFilters((current) => ({ ...current, [categoryId]: selectedIds }))
  }

  const visibleArticles = useMemo(() => {
    const filterLabels = getSelectedFilterLabels(articleFilterCategories, selectedFilters)
    return mockArticles.filter((article) => articleMatchesFilters(article, filterLabels))
  }, [selectedFilters])

  return (
    <NavPage
      title="articles"
      className="nav-page--articles"
      search={
        <PageSearch
          filterCategories={articleFilterCategories}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onSearchChange={setSearchQuery}
        />
      }
    >
      <div className="articles-page__grid">
        {visibleArticles.map((article) => (
          <BlogPost
            key={article.id}
            title={article.title}
            author={article.author}
            date={article.date}
            imageSrc={blogCover}
            imageAlt={article.imageAlt}
            coarseTag={article.coarseTag}
            granularTag={article.granularTag}
          />
        ))}
      </div>
    </NavPage>
  )
}
