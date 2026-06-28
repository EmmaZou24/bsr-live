import { useState } from 'react'
import { PageSearch } from '../components/web'
import { NavPage } from './NavPage'
import './nav-page.css'

export function ShowsPage() {
  const [, setSearchQuery] = useState('')

  return (
    <NavPage
      title="shows"
      className="nav-page--shows"
      search={<PageSearch filters={[]} onSearchChange={setSearchQuery} />}
    >
      {/* Shows content */}
    </NavPage>
  )
}
