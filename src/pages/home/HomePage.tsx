import { AudioreactiveIcon } from '../../components/AudioreactiveIcon'
import { Footer } from '../../components/web'
import './home-page.css'

export function HomePage() {
  return (
    <div className="home-page">
      <div className="home-page__visualizer">
        <AudioreactiveIcon />
      </div>
      <Footer />
    </div>
  )
}
