import React from 'react'

export default function IcdCards({ icdCodes = [] }) {
  if (!icdCodes || icdCodes.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {icdCodes.map((c, i) => (
        <div key={i} className="icd-pill">
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>{c.code}</span>
          <span style={{ color: 'var(--txt3)' }}>—</span>
          <span style={{ fontWeight: 500, color: 'var(--txt2)' }}>{c.description}</span>
        </div>
      ))}
    </div>
  )
}
