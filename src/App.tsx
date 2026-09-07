import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LiveStreamProvider } from './context/LiveStreamContext'
import { AppLayout } from './pages/AppLayout'
import { ArticleDetailPage } from './pages/articles/ArticleDetailPage'
import { ArticlesPage } from './pages/articles/ArticlesPage'
import { FaqPage } from './pages/faq/FaqPage'
import { HomePage } from './pages/home/HomePage'
import { SchedulePage } from './pages/schedule/SchedulePage'
import { ShowDetailPage } from './pages/shows/ShowDetailPage'
import { ShowsPage } from './pages/shows/ShowsPage'

export function App() {
  return (
    <LiveStreamProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </LiveStreamProvider>
  )
}
