import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LiveStreamProvider } from './context/LiveStreamContext'
import { AppLayout } from './pages/AppLayout'
import { ArticleDetailPage } from './pages/ArticleDetailPage'
import { ArticlesPage } from './pages/ArticlesPage'
import { HomePage } from './pages/HomePage'
import { SchedulePage } from './pages/SchedulePage'
import { ShowDetailPage } from './pages/ShowDetailPage'
import { ShowsPage } from './pages/ShowsPage'

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
            <Route path="shows" element={<ShowsPage />} />
            <Route path="shows/:slug" element={<ShowDetailPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LiveStreamProvider>
  )
}
