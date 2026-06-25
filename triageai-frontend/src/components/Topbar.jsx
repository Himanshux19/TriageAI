import React from 'react'
import { Menu, Sun, Moon, RefreshCw } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function Topbar({ title, subtitle, onToggleSidebar, onRefresh, extra }) {
  const { theme, toggleTheme } = useTheme()
  return (
    <div className="topbar">
      <button className="btn btn-ghost btn-icon" onClick={onToggleSidebar}><Menu size={17} /></button>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt1)', lineHeight: 1 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {extra}
      {onRefresh && <button className="btn btn-ghost btn-icon" onClick={onRefresh} title="Refresh"><RefreshCw size={15} /></button>}
      <button className="btn btn-ghost btn-icon" onClick={toggleTheme}>{theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}</button>
    </div>
  )
}
