import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { theme } = useTheme()

  const links = [
    { to: '/stamina', label: '體力規劃' },
    { to: '/gacha', label: '抽卡規劃' },
    { to: '/teams', label: '三隊情況' },
    { to: '/todo', label: 'To-Do List' },
    { to: '/scratchpad', label: '草稿紙' },
    { to: '/records', label: '通關記錄' },
    { to: '/settings', label: '⚙️' },
  ]

  return (
    <nav className={`navbar navbar-${theme}`}>
      <div className="navbar-brand">🚀 HSR Planner</div>
      <div className="navbar-links">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
        {user?.is_admin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            🛡️ 管理
          </NavLink>
        )}
      </div>
      <div className="navbar-user">
        <span className="username">{user?.username}</span>
        <button onClick={logout} className="btn-logout">登出</button>
      </div>
    </nav>
  )
}