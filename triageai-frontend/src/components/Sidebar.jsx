import React from 'react'
import { Plus } from 'lucide-react'

export default function Sidebar({ items, active, onSelect, collapsed, setCollapsed, bottomItems, profile, profileSlot }) {
  return (
    <aside className={`sidebar${collapsed ? ' slim' : ''}`}>
      <div className="s-logo">
        <div className="s-logo-icon"><Plus size={18} color="white" strokeWidth={3.5} /></div>
        {!collapsed && <div><div className="s-logo-text">TriageAI</div><div className="s-logo-sub">Clinical Platform</div></div>}
      </div>
      {!collapsed && profileSlot && <div className="s-chip">{profileSlot}</div>}
      <nav className="s-nav">
        {items.map(it => {
          const Icon = it.icon
          return (
            <button key={it.id} onClick={() => onSelect(it.id)} className={`s-item${active === it.id ? ' on' : ''}`}>
              <Icon size={17} style={{ flexShrink: 0 }} />
              <span className="lbl">{it.label}</span>
              {it.badge > 0 && <span className="s-badge">{it.badge}</span>}
            </button>
          )
        })}
      </nav>
      {bottomItems && (
        <div className="s-foot">
          {bottomItems.map(it => {
            const Icon = it.icon
            return (
              <button key={it.id} onClick={it.onClick} className="s-item" style={{ color: it.color || undefined }}>
                <Icon size={17} style={{ flexShrink: 0 }} />
                <span className="lbl">{it.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </aside>
  )
}
