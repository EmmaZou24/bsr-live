import { Outlet, useLocation } from 'react-router-dom'
import { PageShell } from './PageShell'
import { ROUTES } from './routes'

export function AppLayout() {
  const { pathname } = useLocation()
  const mode = pathname === ROUTES.home ? 'push' : 'overlay'

  return (
    <PageShell mode={mode}>
      <Outlet />
    </PageShell>
  )
}
