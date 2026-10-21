import React from 'react'

const COLOR = score =>
  score >= 80 ? 'var(--red)' : score >= 55 ? 'var(--orange)' : score >= 25 ? 'var(--yellow)' : 'var(--green)'

export default function ScoreRing({ score = 0, size = 50, label = '' }) {
  const r = (size / 2) - 4.5
  const circ = 2 * Math.PI * r
  const pct = Math.min(Math.max(Number(score) || 0, 0), 100)
  const dash = (pct / 100) * circ
  const color = COLOR(pct)

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3 }} title={label ? `${label}: ${Math.round(pct)}/100` : `${Math.round(pct)}/100`}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={3.5} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={3.5}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size > 44 ? 12 : 10.5,
            fontWeight: 700,
            color: 'var(--txt1)',
          }}
        >
          {Math.round(pct)}
        </div>
      </div>
      {label && <div style={{ fontSize: 10.5, color: 'var(--txt3)', fontWeight: 600 }}>{label}</div>}
    </div>
  )
}
