import React from 'react'

const MAP = {
  CRITICAL: 'b-critical',
  HIGH:     'b-high',
  MEDIUM:   'b-medium',
  LOW:      'b-low',
}

export default function SeverityBadge({ level }) {
  const cls = MAP[(level || '').toUpperCase()] || 'b-neutral'
  return <span className={`badge ${cls}`}>{level || '—'}</span>
}
