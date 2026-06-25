import React from 'react'

const COLOR = score =>
  score >= 80 ? '#DC2626' : score >= 55 ? '#D97706' : score >= 25 ? '#CA8A04' : '#059669'

export default function ScoreRing({ score = 0, size = 52, label = '' }) {
  const r = (size / 2) - 5
  const circ = 2 * Math.PI * r
  const pct = Math.min(Math.max(score, 0), 100)
  const dash = (pct / 100) * circ
  const color = COLOR(pct)
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={4} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size > 48 ? 12 : 10, fontWeight: 800, color }}>
          {Math.round(pct)}
        </div>
      </div>
      {label && <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 600 }}>{label}</div>}
    </div>
  )
}
