import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LiveStreamProvider } from './context/LiveStreamContext'
import { AppLayout } from './pages/AppLayout'
import { HomePage } from './pages/home/HomePage'

const ArticleDetailPage = lazy(() =>
  import('./pages/articles/ArticleDetailPage').then((module) => ({ default: module.ArticleDetailPage })),
)
const ArticlesPage = lazy(() =>
  import('./pages/articles/ArticlesPage').then((module) => ({ default: module.ArticlesPage })),
)
const FaqPage = lazy(() =>
  import('./pages/faq/FaqPage').then((module) => ({ default: module.FaqPage })),
)
const SchedulePage = lazy(() =>
  import('./pages/schedule/SchedulePage').then((module) => ({ default: module.SchedulePage })),
)
const ShowDetailPage = lazy(() =>
  import('./pages/shows/ShowDetailPage').then((module) => ({ default: module.ShowDetailPage })),
)
const ShowsPage = lazy(() =>
  import('./pages/shows/ShowsPage').then((module) => ({ default: module.ShowsPage })),
)

export function App() {
  return (
    <LiveStreamProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="articles" element={<ArticlesPage />} />
              <Route path="articles/:slug" element={<ArticleDetailPage />} />
              <Route path="faq" element={<FaqPage />} />
              <Route path="shows" element={<ShowsPage />} />
              <Route path="shows/:slug" element={<ShowDetailPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LiveStreamProvider>
  )
}
