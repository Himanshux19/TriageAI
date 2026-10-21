import React from 'react'

export default function Sidebar({
  items,
  active,
  onSelect,
  collapsed,
  mobileOpen = false,
  onCloseMobile,
  bottomItems,
  profileSlot,
  roleLabel = 'Clinical Workspace',
}) {
  const handleSelect = id => {
    onSelect(id)
    if (onCloseMobile) onCloseMobile()
  }

  return (
    <>
      <div
        className={`sidebar-backdrop${mobileOpen ? ' mobile-open' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />
      <aside className={`sidebar${collapsed ? ' slim' : ''}${mobileOpen ? ' mobile-open' : ''}`} aria-label="Primary Navigation">
        <div className="s-logo">
          <div className="s-logo-icon">
            <img src="/logo.png" alt="TriageAI Logo" />
          </div>
          {!collapsed && (
            <div>
              <div className="s-logo-text">TriageAI</div>
              <div className="s-logo-sub">{roleLabel}</div>
            </div>
          )}
        </div>

        {!collapsed && profileSlot && <div className="s-chip">{profileSlot}</div>}

        <nav className="s-nav">
          {items.map(it => {
            const Icon = it.icon
            const isActive = active === it.id
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => handleSelect(it.id)}
                className={`s-item${isActive ? ' on' : ''}`}
                title={collapsed ? it.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={17} style={{ flexShrink: 0 }} aria-hidden="true" />
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
                <button
                  key={it.id}
                  type="button"
                  onClick={it.onClick}
                  className="s-item"
                  style={{ color: it.color || undefined }}
                  title={collapsed ? it.label : undefined}
                >
                  <Icon size={17} style={{ flexShrink: 0 }} aria-hidden="true" />
                  <span className="lbl">{it.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </aside>
    </>
  )
}
