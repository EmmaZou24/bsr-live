import './footer.css'

const contacts = [
    ['station managers', 'mailto:bsrlive2018+stationmangers@gmail.com'],
    ['music programming', 'mailto:bsrlive2018+musicprogramming@gmail.com'],
    ['features programming', 'mailto:bsrlive2018+features@gmail.com'],
    ['live sessions', 'mailto:bsrlive2018+livesessions@gmail.com'],
    ['news', 'mailto:bsrlive2018+news@gmail.com'],
    ['blog', 'mailto:bsrlive2018+blog@gmail.com'],
    ['branding', 'mailto:bsrlive2018+branding@gmail.com'],
    ['events', 'mailto:bsrlive2018+events@gmail.com'],
    ['social media', 'mailto:bsrlive2018+socialmedia@gmail.com'],
] as const

const socialLinks = [
    ['Instagram', 'https://www.instagram.com/bsrlive/', 'instagram'],
    ['YouTube', 'https://www.youtube.com/channel/UCLtIFzxZ3_Yjvizxr1vCyOg', 'youtube'],
    ['Email', 'mailto:bsrlive2018@gmail.com', 'email'],
    ['Spotify', 'https://open.spotify.com/user/ndis7o6g0u1oq2xvgww7itbvt?si=f3fd671303eb431d', 'spotify'],
] as const

function SocialIcon({ type }: { type: (typeof socialLinks)[number][2] }) {
    if (type === 'instagram') {
        return (
            <svg viewBox="0 0 22 22" aria-hidden="true">
                <rect x="1" y="1" width="20" height="20" rx="5" fill="currentColor" />
                <circle cx="11" cy="11" r="4.25" fill="var(--bsr-pink)" />
                <circle cx="16.5" cy="5.5" r="1.25" fill="var(--bsr-pink)" />
            </svg>
        )
    }

    if (type === 'youtube') {
        return (
            <svg viewBox="0 0 22 22" aria-hidden="true">
                <rect x="1" y="3.5" width="20" height="15" rx="4" fill="currentColor" />
                <path d="M9 7.5 15 11l-6 3.5v-7Z" fill="var(--bsr-pink)" />
            </svg>
        )
    }

    if (type === 'email') {
        return (
            <svg viewBox="0 0 22 22" aria-hidden="true">
                <rect x="1" y="3" width="20" height="16" rx="2" fill="currentColor" />
                <path d="m2 5 9 7 9-7" fill="none" stroke="var(--bsr-pink)" strokeWidth="2" />
            </svg>
        )
    }

    return (
        <svg viewBox="0 0 22 22" aria-hidden="true">
            <circle cx="11" cy="11" r="10" fill="currentColor" />
            <path d="M5 8.5c4.2-1.3 8.3-.9 12 1.1M6.5 12c3.2-.8 6.4-.5 9.2.9M8.2 15.1c2.1-.4 4.1-.1 5.8.7" fill="none" stroke="var(--bsr-pink)" strokeLinecap="round" strokeWidth="1.6" />
        </svg>
    )
}

export function Footer() {
    return (
        <footer className="site-footer">
            <div className="site-footer__column site-footer__about">
                <strong>Brown Student and<br />Community Radio</strong>
                <p>
                    radio for the curious listener. Our programming is 100% freeform,
                    led by Brown students and Providence community members.
                </p>
                <a href="https://bsrlive.com/" target="_blank" rel="noreferrer">
                    donate to bsr!
                </a>
            </div>

            <div className="site-footer__column">
                <strong>contacts</strong>
                <div className="site-footer__links">
                    {contacts.map(([label, href]) => (
                        <a key={label} href={href}>
                            {label}
                        </a>
                    ))}
                </div>
            </div>

            <div className="site-footer__column">
                <strong>follow us</strong>
                <div className="site-footer__social-links">
                    {socialLinks.map(([label, href, type]) => (
                        <a
                            key={label}
                            href={href}
                            target={href.startsWith('http') ? '_blank' : undefined}
                            rel={href.startsWith('http') ? 'noreferrer' : undefined}
                            aria-label={`BSR on ${label}`}
                        >
                            <SocialIcon type={type} />
                        </a>
                    ))}
                </div>
            </div>

            <div className="site-footer__column site-footer__legal">
                <strong>© 2026</strong>
                <p>
                    The content of UCS recognized student organization websites is
                    generated independently from Brown University. The statements,
                    views, opinions, and information contained on the site are
                    personal to those of the authors and student organization and do
                    not necessarily reflect those of Brown University. The content on
                    the site is not reviewed, approved, or endorsed by Brown
                    University or its faculty or staff.
                </p>
            </div>
        </footer>
    )
}