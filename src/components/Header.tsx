import { Link, NavLink } from 'react-router-dom'
import { FriendsIcon, GearIcon, ProfileIcon } from './Icons'
import { useSettings } from '../settings'

export default function Header() {
  const { setOpen } = useSettings()
  return (
    <header className="app-header">
      <Link to="/" className="logo-card" aria-label="Amity home">
        <img src="/brand/Amity_wordmark.svg" alt="Amity" />
      </Link>
      <div className="tagline">
        Amity<span className="divider">|</span>
        <span className="muted">Online Annotation Platform</span>
      </div>
      <nav className="header-actions">
        <NavLink to="/friends" end className="icon-btn" title="Friends" aria-label="Friends">
          <FriendsIcon />
        </NavLink>
        <NavLink to="/profile" className="icon-btn" title="Your profile" aria-label="Your profile">
          <ProfileIcon />
        </NavLink>
        <button className="icon-btn" title="Settings" aria-label="Settings" onClick={() => setOpen(true)}>
          <GearIcon />
        </button>
      </nav>
    </header>
  )
}
