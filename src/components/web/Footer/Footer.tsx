import { Link } from 'react-router-dom'
import './footer.css'

export function Footer() {
    return (
        <footer className="site-footer">
            <button type="button" className="site-footer__support">
                support
            </button>
            <Link to="/faq" className="site-footer__faq">
                FAQs
            </Link>
        </footer>
    )
}