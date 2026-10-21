import React from 'react'
import { Menu, Sun, Moon, RefreshCw } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function Topbar({ title, subtitle, onToggleSidebar, onRefresh, extra }) {
  const { theme, toggleTheme } = useTheme()
  return (
    <header className="topbar">
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        onClick={onToggleSidebar}
        aria-label="Toggle navigation menu"
        title="Toggle navigation"
      >
        <Menu size={17} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-sub">{subtitle}</div>}
      </div>
      {extra}
      {onRefresh && (
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={onRefresh}
          title="Refresh data"
          aria-label="Refresh data"
        >
          <RefreshCw size={15} />
        </button>
      )}
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        onClick={toggleTheme}
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        aria-label="Toggle color theme"
      >
        {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
      </button>
    </header>
  )
}
