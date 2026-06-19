import { BlogPost, TitleSearch } from '../components/web'
import './nav-page.css'

export function ArticlesPage() {
  return (
    <div className="nav-page nav-page--articles">
      <TitleSearch />
      <BlogPost />
    </div>
  )
}
