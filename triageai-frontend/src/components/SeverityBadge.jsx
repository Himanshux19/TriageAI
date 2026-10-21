import React from 'react'
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react'

const CONFIG = {
  CRITICAL: { cls: 'b-critical', label: 'Critical Priority', shortLabel: 'Critical', Icon: AlertTriangle },
  HIGH:     { cls: 'b-high',     label: 'High Priority',     shortLabel: 'High',     Icon: AlertCircle },
  MEDIUM:   { cls: 'b-medium',   label: 'Moderate Priority', shortLabel: 'Moderate', Icon: Info },
  MODERATE: { cls: 'b-medium',   label: 'Moderate Priority', shortLabel: 'Moderate', Icon: Info },
  LOW:      { cls: 'b-low',      label: 'Low Priority',      shortLabel: 'Low',      Icon: CheckCircle2 },
}

export default function SeverityBadge({ level, verbose = false }) {
  const key = (level || '').toUpperCase()
  const cfg = CONFIG[key]
  if (!cfg) {
    return <span className="badge b-neutral">{level || 'Unassigned'}</span>
  }
  const { cls, label, shortLabel, Icon } = cfg
  return (
    <span className={`badge ${cls}`} title={`Triage Priority: ${label}`}>
      <Icon size={12} style={{ flexShrink: 0 }} aria-hidden="true" />
      <span>{verbose ? label : shortLabel}</span>
    </span>
  )
}
