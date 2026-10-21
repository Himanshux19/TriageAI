import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  BarChart3,
  QrCode,
  Settings,
  UserCheck,
  LogOut,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ShieldAlert,
  Copy,
  Clock,
  AlertCircle,
  Activity,
  Download,
  ChevronRight,
  ExternalLink,
  MapPin,
} from 'lucide-react'
import api from '../utils/api'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import SeverityBadge from '../components/SeverityBadge'
import ScoreRing from '../components/ScoreRing'
import IcdCards from '../components/IcdCards'

const NAV = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'queue', label: 'Patient Queue', icon: Users },
  { id: 'doctors', label: 'Doctors', icon: UserCheck },
  { id: 'history', label: 'Appointments', icon: Clock },
  { id: 'qr', label: 'QR Check-In', icon: QrCode },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function ClinicDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [slim, setSlim] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [queue, setQueue] = useState([])
  const [queueSel, setQueueSel] = useState(null)
  const [qSearch, setQSearch] = useState('')
  const [qSevFilter, setQSevFilter] = useState('ALL')

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  // Doctor registration form
  const [dName, setDName] = useState('')
  const [dSpec, setDSpec] = useState('')
  const [dExp, setDExp] = useState('')
  const [dEmail, setDEmail] = useState('')

  // Doctor edit & delete confirmation state
  const [editId, setEditId] = useState(null)
  const [eN, setEN] = useState('')
  const [eSp, setESp] = useState('')
  const [eEx, setEEx] = useState('')
  const [eEm, setEEm] = useState('')
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState(null)

  // Settings form
  const [sName, setSName] = useState('')
  const [sEmail, setSEmail] = useState('')
  const [sPhone, setSPhone] = useState('')
  const [sLat, setSLat] = useState('')
  const [sLng, setSLng] = useState('')
  const [sGeo, setSGeo] = useState(500)
  const [sPwd, setSPwd] = useState('')
  const [locating, setLocating] = useState(false)

  // Appointments / History states
  const [history, setHistory] = useState([])
  const [histSel, setHistSel] = useState(null)
  const [histSearch, setHistSearch] = useState('')
  const [histSevFilter, setHistSevFilter] = useState('ALL')
  const [histStatusFilter, setHistStatusFilter] = useState('ALL')

  // Per-Doctor History drawer state
  const [selectedDocHistory, setSelectedDocHistory] = useState(null)
  const [docHistoryData, setDocHistoryData] = useState([])

  const logout = () => {
    ;['triageai_token', 'triageai_role', 'triageai_id'].forEach(k => localStorage.removeItem(k))
    navigate('/')
  }

  const flash = (msg, isErr = false) => {
    if (isErr) {
      setErr(msg)
      setTimeout(() => setErr(''), 4500)
    } else {
      setOk(msg)
      setTimeout(() => setOk(''), 4000)
    }
  }

  const loadDocHistory = async doc => {
    setSelectedDocHistory(doc)
    try {
      const r = await api.get(`/api/clinic/doctor/${doc.doctorId}/history`)
      setDocHistoryData(r.data || [])
    } catch {
      flash('Unable to load consultation history for this doctor.', true)
    }
  }

  const load = useCallback(async () => {
    try {
      const [p, s, d] = await Promise.all([
        api.get('/api/clinic/profile'),
        api.get('/api/clinic/statistics'),
        api.get('/api/doctor/doctors'),
      ])
      setProfile(p.data)
      setStats(s.data)
      setDoctors(d.data || [])
      setSName(p.data.clinicName || '')
      setSEmail(p.data.email || '')
      setSPhone(p.data.phone || '')
      setSLat(p.data.latitude ?? '')
      setSLng(p.data.longitude ?? '')
      setSGeo(p.data.thresholdDistance || 500)
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }, [])

  const loadQueue = useCallback(async () => {
    try {
      const r = await api.get('/api/clinic/queue')
      const list = r.data || []
      setQueue(list)
      setQueueSel(prev => (prev ? list.find(x => x.appointmentId === prev.appointmentId) || prev : null))
    } catch {}
  }, [])

  const loadHistory = useCallback(async () => {
    try {
      const r = await api.get('/api/clinic/history')
      setHistory(r.data || [])
    } catch {}
  }, [])

  useEffect(() => {
    load()
    loadQueue()
    loadHistory()
  }, [load, loadQueue, loadHistory])

  useEffect(() => {
    if (tab === 'queue' || tab === 'overview') {
      const t = setInterval(() => {
        loadQueue()
        api.get('/api/clinic/statistics').then(r => setStats(r.data)).catch(() => {})
      }, 10000)
      return () => clearInterval(t)
    }
    if (tab === 'history') {
      loadHistory()
    }
  }, [tab, loadQueue, loadHistory])

  const addDoctor = async e => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/api/doctor/register', {
        name: dName.trim(),
        specialization: dSpec.trim(),
        experienceYears: parseInt(dExp, 10) || 0,
        email: dEmail.trim(),
        clinicId: profile?.clinicId,
      })
      flash(`Doctor ${dName.trim()} registered. Login credentials sent to ${dEmail.trim()}.`)
      setDName('')
      setDSpec('')
      setDExp('')
      setDEmail('')
      const r = await api.get('/api/doctor/doctors')
      setDoctors(r.data || [])
    } catch (ex) {
      flash(ex.response?.data?.message || 'Failed to register doctor.', true)
    } finally {
      setBusy(false)
    }
  }

  const saveEdit = async id => {
    try {
      await api.put(`/api/doctor/${id}/edit`, {
        name: eN.trim(),
        specialization: eSp.trim(),
        experienceYears: parseInt(eEx, 10) || 0,
        email: eEm.trim(),
        clinicId: profile?.clinicId,
      })
      setEditId(null)
      flash('Doctor record updated.')
      const r = await api.get('/api/doctor/doctors')
      setDoctors(r.data || [])
    } catch {
      flash('Failed to update doctor record.', true)
    }
  }

  const toggleDoc = async doc => {
    const next = !(doc.active != null ? doc.active : true)
    try {
      await api.put(`/api/doctor/${doc.doctorId}/active`, null, { params: { active: next } })
      setDoctors(ds => ds.map(d => (d.doctorId === doc.doctorId ? { ...d, active: next } : d)))
      flash(`${doc.name} account ${next ? 'enabled' : 'disabled'}.`)
    } catch {
      flash('Failed to update doctor status.', true)
    }
  }

  const confirmAndDeleteDoc = async () => {
    if (!confirmDeleteDoc) return
    setBusy(true)
    try {
      await api.delete(`/api/doctor/${confirmDeleteDoc.doctorId}`)
      setDoctors(ds => ds.filter(d => d.doctorId !== confirmDeleteDoc.doctorId))
      flash(`Removed ${confirmDeleteDoc.name} from clinic roster.`)
      setConfirmDeleteDoc(null)
    } catch {
      flash('Unable to remove doctor. They may have linked records.', true)
    } finally {
      setBusy(false)
    }
  }

  const fetchClinicLocation = () => {
    if (!navigator.geolocation) {
      flash('Geolocation is not supported by your browser.', true)
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const latVal = Number(pos.coords.latitude.toFixed(6))
        const lngVal = Number(pos.coords.longitude.toFixed(6))
        setSLat(latVal)
        setSLng(lngVal)
        setLocating(false)
        flash(`Coordinates fetched (${latVal}, ${lngVal}). Click "Save Clinic Settings" to apply.`)
      },
      errObj => {
        setLocating(false)
        flash(
          errObj?.code === 1
            ? 'Location permission denied. Please allow location access in your browser.'
            : 'Unable to fetch current GPS coordinates. Please enter them manually.',
          true
        )
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const saveSettings = async e => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.put('/api/clinic/profile', {
        clinicName: sName.trim(),
        email: sEmail.trim(),
        phone: sPhone.trim(),
        latitude: sLat !== '' ? parseFloat(sLat) : null,
        longitude: sLng !== '' ? parseFloat(sLng) : null,
        thresholdDistance: parseInt(sGeo, 10) || 500,
        password: sPwd || null,
      })
      flash('Clinic configuration saved.')
      setSPwd('')
      const r = await api.get('/api/clinic/profile')
      setProfile(r.data)
    } catch {
      flash('Failed to save clinic settings.', true)
    } finally {
      setBusy(false)
    }
  }

  const genQR = async () => {
    try {
      const r = await api.post('/api/clinic/generate-qr')
      setProfile(p => ({ ...p, qrCodeUrl: r.data }))
      flash('Patient check-in QR code regenerated.')
    } catch {
      flash('QR code generation failed.', true)
    }
  }

  const exportCSV = () => {
    const token = localStorage.getItem('triageai_token')
    window.open(`/api/clinic/export-patients?token=${token}`, '_blank')
  }

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileNav(m => !m)
    } else {
      setSlim(s => !s)
    }
  }

  const sevStatus = s =>
    ({
      ARRIVED: 'b-low',
      IN_CONSULTATION: 'b-info',
      OUTSIDE_RADIUS: 'b-high',
      ABSENT: 'b-critical',
      WAITING: 'b-neutral',
      COMPLETED: 'b-low',
    }[s] || 'b-neutral')

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <RefreshCw size={22} color="var(--accent)" className="spin" />
          <div style={{ fontSize: 13, color: 'var(--txt3)' }}>Loading clinic operations…</div>
        </div>
      </div>
    )
  }

  const waitingCount = queue.filter(q => q.status === 'WAITING').length
  const navItems = NAV.map(n => (n.id === 'queue' ? { ...n, badge: waitingCount } : n))

  const filteredQueue = queue.filter(p => {
    const matchesSev = qSevFilter === 'ALL' || p.severityLevel === qSevFilter
    if (!qSearch) return matchesSev
    const q = qSearch.toLowerCase()
    const matchesSearch =
      p.patientName?.toLowerCase().includes(q) ||
      p.tokenNumber?.toLowerCase().includes(q) ||
      p.doctorName?.toLowerCase().includes(q) ||
      p.aiDiagnosis?.toLowerCase().includes(q)
    return matchesSev && matchesSearch
  })

  const filteredHistory = history.filter(p => {
    const q = histSearch.toLowerCase()
    const matchesSearch =
      !histSearch ||
      p.patientName?.toLowerCase().includes(q) ||
      p.tokenNumber?.toLowerCase().includes(q) ||
      p.doctorName?.toLowerCase().includes(q) ||
      p.aiDiagnosis?.toLowerCase().includes(q)
    const matchesSev = histSevFilter === 'ALL' || p.severityLevel === histSevFilter
    const matchesStatus = histStatusFilter === 'ALL' || p.status === histStatusFilter
    return matchesSearch && matchesSev && matchesStatus
  })

  return (
    <div className="shell">
      <Sidebar
        roleLabel="Clinic Administration"
        items={navItems}
        active={tab}
        onSelect={setTab}
        collapsed={slim}
        setCollapsed={setSlim}
        mobileOpen={mobileNav}
        onCloseMobile={() => setMobileNav(false)}
        profileSlot={
          profile && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--sidebar-txt)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 2,
                }}
              >
                Active Facility
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#FFFFFF',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {profile.clinicName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--sidebar-txt)', marginTop: 2 }}>
                ID: {profile.clinicId}
              </div>
            </div>
          )
        }
        bottomItems={[{ id: 'logout', label: 'Sign Out', icon: LogOut, color: '#F87171', onClick: logout }]}
      />

      <div className={`main${slim ? ' slim' : ''}`}>
        <Topbar
          title={NAV.find(n => n.id === tab)?.label}
          subtitle={profile ? `${profile.clinicName} (${profile.clinicId})` : undefined}
          onToggleSidebar={handleToggleSidebar}
          onRefresh={() => {
            load()
            loadQueue()
            loadHistory()
          }}
          extra={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={exportCSV}>
                <Download size={14} />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setTab('qr')}
              >
                <QrCode size={14} />
                <span>Check-In QR</span>
              </button>
            </div>
          }
        />

        <div className="page-body">
          {err && <Msg type="error" msg={err} onClose={() => setErr('')} />}
          {ok && <Msg type="ok" msg={ok} onClose={() => setOk('')} />}

          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Primary Operational Stats */}
              {stats && (
                <div className="grid-4">
                  <Stat
                    icon={<Users size={18} />}
                    bg="var(--accent-bg)"
                    col="var(--accent)"
                    label="Today's Patient Volume"
                    val={stats.totalPatientsToday ?? 0}
                    sub={`${stats.waitingCount ?? waitingCount} waiting · ${stats.inConsultationCount ?? 0} in consultation`}
                  />
                  <Stat
                    icon={<AlertCircle size={18} />}
                    bg="var(--red-bg)"
                    col="var(--red)"
                    label="Critical & High Priority"
                    val={(stats.criticalCasesCount ?? 0) + (stats.highCount ?? 0)}
                    sub={`${stats.criticalCasesCount ?? 0} Critical · ${stats.highCount ?? 0} High`}
                  />
                  <Stat
                    icon={<Check size={18} />}
                    bg="var(--green-bg)"
                    col="var(--green)"
                    label="Completed Consultations"
                    val={stats.completedConsultations ?? 0}
                    sub={`Avg wait ~${stats.averageWaitTime ?? 8} min`}
                  />
                  <Stat
                    icon={<UserCheck size={18} />}
                    bg="var(--blue-bg)"
                    col="var(--blue)"
                    label="Active Clinicians"
                    val={stats.activeDoctors ?? doctors.filter(d => d.active !== false).length}
                    sub={`${doctors.filter(d => d.availabilityStatus === 'AVAILABLE').length} currently available`}
                  />
                </div>
              )}

              {/* Severity Distribution & Doctor Workload */}
              <div className="grid-2">
                {/* Severity Breakdown Card */}
                {stats && (
                  <div className="card card-p">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--txt1)' }}>
                          Today&apos;s Triage Severity Distribution
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>
                          Breakdown of intake urgency across {stats.totalPatientsToday || 0} patients today
                        </div>
                      </div>
                      {stats.averageRiskScore > 0 && (
                        <span className="badge b-neutral">Avg Risk: {stats.averageRiskScore.toFixed(1)}</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        { label: 'Critical Priority', val: stats.criticalCasesCount ?? 0, col: 'var(--red)' },
                        { label: 'High Priority', val: stats.highCount ?? 0, col: 'var(--orange)' },
                        { label: 'Moderate Priority', val: stats.mediumCount ?? 0, col: 'var(--yellow)' },
                        { label: 'Low Priority', val: stats.lowCount ?? 0, col: 'var(--green)' },
                      ].map(row => {
                        const pct = stats.totalPatientsToday
                          ? Math.round((row.val / stats.totalPatientsToday) * 100)
                          : 0
                        return (
                          <div key={row.label}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 12.5,
                                marginBottom: 5,
                              }}
                            >
                              <span style={{ fontWeight: 600, color: 'var(--txt1)' }}>{row.label}</span>
                              <span style={{ color: 'var(--txt2)', fontWeight: 600 }}>
                                {row.val} ({pct}%)
                              </span>
                            </div>
                            <div className="prog-bar">
                              <div
                                className="prog-fill"
                                style={{ width: `${pct}%`, background: row.col }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Clinician Roster & Availability Summary */}
                <div className="card">
                  <div
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--txt1)' }}>
                        Clinician Availability &amp; Queue Load
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>
                        Active medical staff assigned to {profile?.clinicName}
                      </div>
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab('doctors')}>
                      <span>Manage Doctors</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>

                  {doctors.length === 0 ? (
                    <div className="empty" style={{ padding: '28px 16px' }}>
                      <div style={{ fontWeight: 600 }}>No doctors registered</div>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => setTab('doctors')}>
                        Add First Doctor
                      </button>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>Doctor</th>
                            <th>Specialization</th>
                            <th>Status</th>
                            <th>Assigned Queue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {doctors.map(d => {
                            const docQueueCount = queue.filter(
                              q => q.doctorId === d.doctorId && q.status !== 'COMPLETED'
                            ).length
                            return (
                              <tr key={d.doctorId}>
                                <td>
                                  <div style={{ fontWeight: 600 }}>{d.name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{d.doctorId}</div>
                                </td>
                                <td style={{ fontSize: 12.5, color: 'var(--txt2)' }}>{d.specialization}</td>
                                <td>
                                  <span
                                    className={`badge ${
                                      !d.active
                                        ? 'b-neutral'
                                        : d.availabilityStatus === 'AVAILABLE'
                                        ? 'b-low'
                                        : 'b-high'
                                    }`}
                                  >
                                    {!d.active
                                      ? 'Disabled'
                                      : d.availabilityStatus === 'AVAILABLE'
                                      ? 'Available'
                                      : 'Unavailable'}
                                  </span>
                                </td>
                                <td style={{ fontWeight: 700 }}>{docQueueCount} active</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Queue Snapshot */}
              <div className="card">
                <div
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--txt1)' }}>
                      Active Clinic Queue ({queue.length})
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>
                      Real-time priority order across all clinicians
                    </div>
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab('queue')}>
                    <span>Open Full Queue View</span>
                    <ChevronRight size={13} />
                  </button>
                </div>

                {queue.length === 0 ? (
                  <div className="empty">
                    <div className="empty-icon">
                      <Users size={20} />
                    </div>
                    <div style={{ fontWeight: 600 }}>No active patients in queue</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Pos</th>
                          <th>Token</th>
                          <th>Patient</th>
                          <th>Assigned Doctor</th>
                          <th>Triage Priority</th>
                          <th>Preliminary Assessment</th>
                          <th>Workflow Status</th>
                          <th>Est. Wait</th>
                        </tr>
                      </thead>
                      <tbody>
                        {queue.slice(0, 6).map(p => (
                          <tr
                            key={p.appointmentId}
                            className={p.severityLevel === 'CRITICAL' ? 'row-critical' : ''}
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setQueueSel(p)
                              setTab('queue')
                            }}
                          >
                            <td style={{ fontWeight: 700 }}>#{p.queuePosition}</td>
                            <td>
                              <span
                                style={{
                                  fontFamily: 'monospace',
                                  fontWeight: 800,
                                  fontSize: 14,
                                  color: 'var(--accent)',
                                }}
                              >
                                {p.tokenNumber}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{p.patientName}</div>
                              <div style={{ fontSize: 11.5, color: 'var(--txt3)' }}>
                                {p.age}y · {p.gender}
                              </div>
                            </td>
                            <td style={{ fontSize: 12.5, color: 'var(--txt2)' }}>{p.doctorName || '—'}</td>
                            <td>
                              <SeverityBadge level={p.severityLevel} />
                            </td>
                            <td style={{ fontSize: 12.5, color: 'var(--txt2)', maxWidth: 200 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.aiDiagnosis || '—'}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${sevStatus(p.status)}`}>{p.status}</span>
                            </td>
                            <td style={{ fontSize: 12.5, color: 'var(--txt2)' }}>{p.estimatedWaitTime}m</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── LIVE QUEUE TAB ── */}
          {tab === 'queue' && (
            <div className="split-view">
              <div className="split-main">
                <div className="card">
                  <div
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      gap: 10,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    <input
                      className="inp"
                      style={{ flex: 1, minWidth: 180 }}
                      placeholder="Search patient, token, or assigned doctor…"
                      value={qSearch}
                      onChange={e => setQSearch(e.target.value)}
                      aria-label="Search clinic queue"
                    />
                    <select
                      className="inp"
                      style={{ width: 165 }}
                      value={qSevFilter}
                      onChange={e => setQSevFilter(e.target.value)}
                      aria-label="Filter queue by priority"
                    >
                      <option value="ALL">All Priority Levels</option>
                      <option value="CRITICAL">Critical Priority</option>
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Moderate Priority</option>
                      <option value="LOW">Low Priority</option>
                    </select>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={loadQueue}>
                      <RefreshCw size={13} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {filteredQueue.length === 0 ? (
                    <div className="empty">
                      <div className="empty-icon">
                        <Users size={22} />
                      </div>
                      <div style={{ fontWeight: 600 }}>No active queue entries</div>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>Pos</th>
                            <th>Token</th>
                            <th>Patient</th>
                            <th>Doctor</th>
                            <th>Triage Priority</th>
                            <th>Risk Score</th>
                            <th>Preliminary Assessment</th>
                            <th>Status</th>
                            <th>Wait</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredQueue.map(p => {
                            const isSelected = queueSel?.appointmentId === p.appointmentId
                            return (
                              <tr
                                key={p.appointmentId}
                                onClick={() => setQueueSel(isSelected ? null : p)}
                                className={`${isSelected ? 'row-selected' : ''} ${
                                  p.severityLevel === 'CRITICAL' ? 'row-critical' : ''
                                }`}
                                style={{ cursor: 'pointer' }}
                              >
                                <td style={{ fontWeight: 700 }}>#{p.queuePosition}</td>
                                <td>
                                  <span
                                    style={{
                                      fontWeight: 800,
                                      fontFamily: 'monospace',
                                      fontSize: 14,
                                      color: 'var(--accent)',
                                    }}
                                  >
                                    {p.tokenNumber}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 600 }}>{p.patientName}</div>
                                  <div style={{ fontSize: 11.5, color: 'var(--txt3)' }}>
                                    {p.age}y · {p.gender}
                                  </div>
                                </td>
                                <td style={{ fontSize: 12.5, color: 'var(--txt2)' }}>{p.doctorName || '—'}</td>
                                <td>
                                  <SeverityBadge level={p.severityLevel} />
                                </td>
                                <td>
                                  <span style={{ fontWeight: 700 }}>{Math.round(p.riskScore || 0)}</span>
                                  <span style={{ fontSize: 11, color: 'var(--txt3)' }}>/100</span>
                                </td>
                                <td style={{ fontSize: 12, color: 'var(--txt2)', maxWidth: 160 }}>
                                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {p.aiDiagnosis || '—'}
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${sevStatus(p.status)}`}>{p.status}</span>
                                </td>
                                <td style={{ color: 'var(--txt2)', fontSize: 12.5 }}>{p.estimatedWaitTime}m</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {queueSel && (
                <div className="split-side">
                  <AdminPatientDetailDrawer record={queueSel} onClose={() => setQueueSel(null)} />
                </div>
              )}
            </div>
          )}

          {/* ── DOCTORS MANAGEMENT TAB ── */}
          {tab === 'doctors' && (
            <div className="split-view">
              <div className="split-main" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Register Doctor Card */}
                <div className="card card-p">
                  <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--txt1)', marginBottom: 4 }}>
                    Register New Clinician
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--txt3)', marginBottom: 16 }}>
                    A unique Doctor ID (e.g. DOC1006) and temporary password will be generated and emailed to the clinician.
                  </div>
                  <form onSubmit={addDoctor} className="grid-2" style={{ gap: 12 }}>
                    <div>
                      <label className="lbl">
                        Doctor Full Name <span className="lbl-req">*</span>
                      </label>
                      <input
                        className="inp"
                        required
                        value={dName}
                        onChange={e => setDName(e.target.value)}
                        placeholder="e.g. Dr. Sarah Jenkins"
                      />
                    </div>
                    <div>
                      <label className="lbl">
                        Clinical Specialization <span className="lbl-req">*</span>
                      </label>
                      <input
                        className="inp"
                        required
                        value={dSpec}
                        onChange={e => setDSpec(e.target.value)}
                        placeholder="e.g. Internal Medicine"
                      />
                    </div>
                    <div>
                      <label className="lbl">
                        Experience (Years) <span className="lbl-req">*</span>
                      </label>
                      <input
                        className="inp"
                        type="number"
                        required
                        min={0}
                        max={60}
                        value={dExp}
                        onChange={e => setDExp(e.target.value)}
                        placeholder="e.g. 8"
                      />
                    </div>
                    <div>
                      <label className="lbl">
                        Clinician Email <span className="lbl-req">*</span>
                      </label>
                      <input
                        className="inp"
                        type="email"
                        required
                        value={dEmail}
                        onChange={e => setDEmail(e.target.value)}
                        placeholder="doctor@clinic.org"
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" disabled={busy} className="btn btn-primary">
                        <Plus size={15} />
                        <span>{busy ? 'Registering…' : 'Register Clinician'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Doctors Roster Table */}
                <div className="card">
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--txt1)' }}>
                      Clinic Medical Staff Roster{' '}
                      <span style={{ fontSize: 12.5, color: 'var(--txt3)', fontWeight: 500 }}>
                        ({doctors.length})
                      </span>
                    </div>
                  </div>
                  {doctors.length === 0 ? (
                    <div className="empty">
                      <div className="empty-icon">
                        <UserCheck size={22} />
                      </div>
                      <div style={{ fontWeight: 600 }}>No clinicians registered yet</div>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>Clinician</th>
                            <th>Specialization</th>
                            <th>Experience</th>
                            <th>Email</th>
                            <th>Availability</th>
                            <th>Account Active</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {doctors.map(doc => (
                            <tr key={doc.doctorId}>
                              {editId === doc.doctorId ? (
                                <>
                                  <td>
                                    <input
                                      className="inp"
                                      value={eN}
                                      onChange={e => setEN(e.target.value)}
                                      style={{ minWidth: 140 }}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      className="inp"
                                      value={eSp}
                                      onChange={e => setESp(e.target.value)}
                                      style={{ minWidth: 130 }}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      className="inp"
                                      type="number"
                                      value={eEx}
                                      onChange={e => setEEx(e.target.value)}
                                      style={{ width: 70 }}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      className="inp"
                                      type="email"
                                      value={eEm}
                                      onChange={e => setEEm(e.target.value)}
                                      style={{ minWidth: 160 }}
                                    />
                                  </td>
                                  <td colSpan={2} />
                                  <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={() => saveEdit(doc.doctorId)}
                                      >
                                        <Check size={13} />
                                        <span>Save</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setEditId(null)}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <div className="avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
                                        {doc.name?.charAt(0) || 'D'}
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{doc.name}</div>
                                        <div style={{ fontSize: 11.5, color: 'var(--txt3)', fontFamily: 'monospace' }}>
                                          {doc.doctorId}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ fontSize: 13, color: 'var(--txt2)' }}>{doc.specialization}</td>
                                  <td style={{ fontSize: 13, color: 'var(--txt2)' }}>{doc.experienceYears} yrs</td>
                                  <td style={{ fontSize: 12.5, color: 'var(--txt3)' }}>{doc.email}</td>
                                  <td>
                                    <span
                                      className={`badge ${
                                        doc.availabilityStatus === 'AVAILABLE' ? 'b-low' : 'b-neutral'
                                      }`}
                                    >
                                      {doc.availabilityStatus || 'AVAILABLE'}
                                    </span>
                                  </td>
                                  <td>
                                    <label className="toggle" title="Enable or disable clinician account">
                                      <input
                                        type="checkbox"
                                        checked={doc.active !== false}
                                        onChange={() => toggleDoc(doc)}
                                      />
                                      <span className="tslider" />
                                    </label>
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                      <button
                                        type="button"
                                        className="btn btn-ghost btn-sm btn-icon"
                                        title="View Consultation History"
                                        onClick={() => loadDocHistory(doc)}
                                      >
                                        <Clock size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-ghost btn-sm btn-icon"
                                        title="Edit Clinician"
                                        onClick={() => {
                                          setEditId(doc.doctorId)
                                          setEN(doc.name || '')
                                          setESp(doc.specialization || '')
                                          setEEx(doc.experienceYears ?? '')
                                          setEEm(doc.email || '')
                                        }}
                                      >
                                        <Edit3 size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-danger btn-sm btn-icon"
                                        title="Remove Clinician"
                                        onClick={() => setConfirmDeleteDoc(doc)}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {selectedDocHistory && (
                <div className="split-side">
                  <div
                    className="card card-p fade-up"
                    style={{ position: 'sticky', top: 72, maxHeight: 'calc(100vh - 96px)', overflowY: 'auto' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt1)' }}>
                          {selectedDocHistory.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--txt3)' }}>
                          Consultation History ({docHistoryData.length})
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => {
                          setSelectedDocHistory(null)
                          setDocHistoryData([])
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {docHistoryData.length === 0 ? (
                      <div className="empty" style={{ padding: '24px 0' }}>
                        <div className="empty-icon">
                          <Clock size={20} />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>No consultations recorded</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {docHistoryData.map(p => (
                          <div key={p.appointmentId} className="clinical-sec">
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 6,
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 800,
                                  fontFamily: 'monospace',
                                  fontSize: 13,
                                  color: 'var(--accent)',
                                }}
                              >
                                {p.tokenNumber}
                              </span>
                              <span className={`badge ${sevStatus(p.status)}`}>{p.status}</span>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--txt1)' }}>
                              {p.patientName} ({p.age}y · {p.gender})
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginTop: 6,
                                marginBottom: 6,
                              }}
                            >
                              <SeverityBadge level={p.severityLevel} />
                              <span style={{ fontSize: 12, color: 'var(--txt2)' }}>
                                Risk: <strong>{Math.round(p.riskScore || 0)}</strong>
                              </span>
                            </div>
                            {p.aiDiagnosis && (
                              <div style={{ fontSize: 12.5, color: 'var(--txt2)', marginTop: 4 }}>
                                {p.aiDiagnosis}
                              </div>
                            )}
                            <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 6 }}>
                              {p.bookingTime ? new Date(p.bookingTime).toLocaleString() : '—'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── APPOINTMENTS & HISTORY TAB ── */}
          {tab === 'history' && (
            <div className="split-view">
              <div className="split-main">
                <div className="card">
                  <div
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      gap: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <input
                      className="inp"
                      style={{ flex: 1, minWidth: 180 }}
                      placeholder="Search patient, token, or clinician…"
                      value={histSearch}
                      onChange={e => setHistSearch(e.target.value)}
                      aria-label="Search clinic appointment history"
                    />
                    <select
                      className="inp"
                      style={{ width: 155 }}
                      value={histSevFilter}
                      onChange={e => setHistSevFilter(e.target.value)}
                      aria-label="Filter appointments by priority"
                    >
                      <option value="ALL">All Priority Levels</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Moderate</option>
                      <option value="LOW">Low</option>
                    </select>
                    <select
                      className="inp"
                      style={{ width: 155 }}
                      value={histStatusFilter}
                      onChange={e => setHistStatusFilter(e.target.value)}
                      aria-label="Filter appointments by status"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="WAITING">Waiting</option>
                      <option value="IN_CONSULTATION">In Consultation</option>
                      <option value="ABSENT">Absent</option>
                    </select>
                  </div>

                  {filteredHistory.length === 0 ? (
                    <div className="empty">
                      <div className="empty-icon">
                        <Users size={22} />
                      </div>
                      <div style={{ fontWeight: 600 }}>No appointment records found</div>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>Token</th>
                            <th>Patient</th>
                            <th>Assigned Doctor</th>
                            <th>Priority</th>
                            <th>Risk Score</th>
                            <th>Preliminary Assessment</th>
                            <th>Status</th>
                            <th>Check-In Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHistory.map(p => {
                            const isSelected = histSel?.appointmentId === p.appointmentId
                            return (
                              <tr
                                key={p.appointmentId}
                                onClick={() => setHistSel(isSelected ? null : p)}
                                className={isSelected ? 'row-selected' : ''}
                                style={{ cursor: 'pointer' }}
                              >
                                <td>
                                  <span
                                    style={{
                                      fontWeight: 800,
                                      fontFamily: 'monospace',
                                      fontSize: 13.5,
                                      color: 'var(--accent)',
                                    }}
                                  >
                                    {p.tokenNumber}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 600 }}>{p.patientName}</div>
                                  <div style={{ fontSize: 11.5, color: 'var(--txt3)' }}>
                                    {p.age}y · {p.gender}
                                  </div>
                                </td>
                                <td style={{ fontSize: 12.5, color: 'var(--txt2)' }}>{p.doctorName || '—'}</td>
                                <td>
                                  <SeverityBadge level={p.severityLevel} />
                                </td>
                                <td>
                                  <span style={{ fontWeight: 700 }}>{Math.round(p.riskScore || 0)}</span>
                                  <span style={{ fontSize: 11, color: 'var(--txt3)' }}>/100</span>
                                </td>
                                <td style={{ fontSize: 12.5, color: 'var(--txt2)', maxWidth: 170 }}>
                                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {p.aiDiagnosis || '—'}
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${sevStatus(p.status)}`}>{p.status}</span>
                                </td>
                                <td style={{ fontSize: 12, color: 'var(--txt3)' }}>
                                  {p.bookingTime ? new Date(p.bookingTime).toLocaleString() : '—'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {histSel && (
                <div className="split-side">
                  <AdminPatientDetailDrawer record={histSel} onClose={() => setHistSel(null)} />
                </div>
              )}
            </div>
          )}

          {/* ── QR CHECK-IN TAB ── */}
          {tab === 'qr' && (
            <div style={{ maxWidth: 520 }}>
              <div className="card card-p">
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--txt1)', marginBottom: 4 }}>
                  Patient Self Check-In QR Code
                </div>
                <div style={{ fontSize: 13, color: 'var(--txt3)', marginBottom: 20 }}>
                  Display this QR code at reception so arriving patients can scan it with their smartphone to complete symptom intake and receive a queue token.
                </div>

                {profile?.qrCodeUrl ? (
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        padding: 16,
                        background: '#FFFFFF',
                        border: '2px solid var(--border)',
                        borderRadius: 10,
                        marginBottom: 16,
                      }}
                    >
                      <img
                        src={profile.qrCodeUrl}
                        alt={`Check-In QR Code for ${profile.clinicName}`}
                        style={{ width: 210, height: 210, display: 'block' }}
                        onError={e => (e.target.style.display = 'none')}
                      />
                    </div>

                    <div
                      className="clinical-sec"
                      style={{
                        textAlign: 'left',
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase' }}>
                          Direct Patient Check-In Link
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: 'var(--accent)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {`${window.location.origin}/patient/book/${profile.clinicId}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/patient/book/${profile.clinicId}`)
                          flash('Patient booking URL copied to clipboard.')
                        }}
                      >
                        <Copy size={13} />
                        <span>Copy URL</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => window.open(`/patient/book/${profile.clinicId}`, '_blank')}
                      >
                        <ExternalLink size={14} />
                        <span>Preview Patient Intake Form</span>
                      </button>
                      <button type="button" className="btn btn-primary" onClick={genQR}>
                        <RefreshCw size={14} />
                        <span>Regenerate QR Code</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div className="empty" style={{ paddingBottom: 20 }}>
                      <div className="empty-icon">
                        <QrCode size={24} />
                      </div>
                      <div style={{ fontWeight: 600 }}>No QR Code Generated Yet</div>
                      <div style={{ fontSize: 12.5 }}>
                        Generate a clinic QR code to enable mobile patient intake.
                      </div>
                    </div>
                    <button type="button" className="btn btn-primary" onClick={genQR}>
                      <QrCode size={15} />
                      <span>Generate Clinic QR Code</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {tab === 'settings' && (
            <div style={{ maxWidth: 620 }}>
              <form
                onSubmit={saveSettings}
                className="card card-p"
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--txt1)' }}>
                    Clinic Configuration &amp; Geofencing
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--txt3)', marginTop: 2 }}>
                    Update facility contact details, arrival perimeter radius, and administrator credentials.
                  </div>
                </div>

                <div className="grid-2">
                  <div>
                    <label className="lbl">Facility Name</label>
                    <input
                      className="inp"
                      value={sName}
                      onChange={e => setSName(e.target.value)}
                      placeholder="Clinic Name"
                    />
                  </div>
                  <div>
                    <label className="lbl">Administrator Email</label>
                    <input
                      className="inp"
                      type="email"
                      value={sEmail}
                      onChange={e => setSEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="lbl">Contact Phone</label>
                    <input className="inp" value={sPhone} onChange={e => setSPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="lbl">Geofence Arrival Radius (meters)</label>
                    <input
                      className="inp"
                      type="number"
                      min={50}
                      max={5000}
                      value={sGeo}
                      onChange={e => setSGeo(e.target.value)}
                    />
                  </div>
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      padding: '12px 14px',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--txt1)' }}>
                          Clinic GPS Coordinates
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>
                          Used to verify when patients arrive within your clinic&apos;s geofence radius.
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={fetchClinicLocation}
                        disabled={locating}
                      >
                        <MapPin size={14} />
                        <span>{locating ? 'Fetching GPS…' : 'Fetch Current Lat & Long'}</span>
                      </button>
                    </div>

                    <div className="grid-2">
                      <div>
                        <label className="lbl">Clinic Latitude</label>
                        <input
                          className="inp"
                          type="number"
                          step="any"
                          value={sLat}
                          onChange={e => setSLat(e.target.value)}
                          placeholder="e.g. 28.6139"
                        />
                      </div>
                      <div>
                        <label className="lbl">Clinic Longitude</label>
                        <input
                          className="inp"
                          type="number"
                          step="any"
                          value={sLng}
                          onChange={e => setSLng(e.target.value)}
                          placeholder="e.g. 77.2090"
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="lbl">New Administrator Password (Optional)</label>
                    <input
                      className="inp"
                      type="password"
                      value={sPwd}
                      onChange={e => setSPwd(e.target.value)}
                      placeholder="Leave blank to retain current password"
                    />
                  </div>
                </div>

                {profile && (
                  <div
                    className="clinical-sec"
                    style={{
                      display: 'flex',
                      gap: 24,
                      flexWrap: 'wrap',
                      fontSize: 12.5,
                      color: 'var(--txt2)',
                    }}
                  >
                    <span>
                      <strong>Clinic ID:</strong> {profile.clinicId}
                    </span>
                    <span>
                      <strong>Registered Doctors:</strong> {doctors.length}
                    </span>
                    <span>
                      <strong>Geofence Radius:</strong> {profile.thresholdDistance || 500}m
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" disabled={busy} className="btn btn-primary">
                    {busy ? 'Saving configuration…' : 'Save Clinic Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Accessible Confirmation Modal for Removing a Doctor */}
      {confirmDeleteDoc && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="del-doc-title">
          <div className="modal-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <AlertCircle size={20} color="var(--red)" />
              <div id="del-doc-title" style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--txt1)' }}>
                Remove Clinician from Roster
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.5, margin: '0 0 18px' }}>
              Are you sure you want to remove <strong>{confirmDeleteDoc.name}</strong> ({confirmDeleteDoc.doctorId}) from your clinic? If you only want to pause patient assignments temporarily, disable their account toggle instead.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setConfirmDeleteDoc(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={busy}
                onClick={confirmAndDeleteDoc}
              >
                Remove Doctor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminPatientDetailDrawer({ record, onClose }) {
  return (
    <div
      className="card card-p fade-up"
      style={{
        position: 'sticky',
        top: 72,
        maxHeight: 'calc(100vh - 96px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: 15,
                color: 'var(--accent)',
              }}
            >
              {record.tokenNumber}
            </span>
            <SeverityBadge level={record.severityLevel} verbose />
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--txt1)', marginTop: 6 }}>
            {record.patientName}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--txt3)', marginTop: 2 }}>
            {record.age} years · {record.gender} · Assigned: <strong>{record.doctorName || 'Unassigned'}</strong>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          onClick={onClose}
          aria-label="Close detail panel"
        >
          <X size={14} />
        </button>
      </div>

      <div className="clinical-sec">
        <div className="clinical-sec-header">
          <span>Patient-Reported Symptoms</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--txt1)', lineHeight: 1.55 }}>
          {record.symptoms || 'No symptom statement recorded.'}
        </div>
      </div>

      <div className="clinical-sec ai-support">
        <div className="clinical-sec-header">
          <span>Triage Decision Support</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
          <ScoreRing score={record.riskScore} size={46} label="Risk" />
          <ScoreRing score={record.priorityScore || 0} size={46} label="Priority" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--txt3)', fontWeight: 600 }}>Preliminary Assessment</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--txt1)', marginTop: 2 }}>
              {record.aiDiagnosis || '—'}
            </div>
          </div>
        </div>

        {record.icdCodes && record.icdCodes.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt3)', marginBottom: 4 }}>
              ICD-10 Reference Codes:
            </div>
            <IcdCards icdCodes={record.icdCodes} />
          </div>
        )}

        {record.clinicalNotes && (
          <div style={{ fontSize: 12.5, color: 'var(--txt2)', lineHeight: 1.5 }}>
            <strong>Notes:</strong> {record.clinicalNotes}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '7px 10px',
            background: 'var(--surface2)',
            borderRadius: 6,
            fontSize: 12.5,
          }}
        >
          <span style={{ color: 'var(--txt3)' }}>Workflow Status</span>
          <strong>{record.status}</strong>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '7px 10px',
            background: 'var(--surface2)',
            borderRadius: 6,
            fontSize: 12.5,
          }}
        >
          <span style={{ color: 'var(--txt3)' }}>Geofence Status</span>
          <strong>{record.geofenceStatus || '—'}</strong>
        </div>
        {record.bookingTime && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '7px 10px',
              background: 'var(--surface2)',
              borderRadius: 6,
              fontSize: 12.5,
            }}
          >
            <span style={{ color: 'var(--txt3)' }}>Check-In Time</span>
            <strong>{new Date(record.bookingTime).toLocaleString()}</strong>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ icon, bg, col, label, val, sub }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span className="stat-lbl">{label}</span>
        <div className="stat-icon" style={{ background: bg, color: col }}>
          {icon}
        </div>
      </div>
      <div className="stat-val">{val}</div>
      {sub && <div className="stat-delta">{sub}</div>}
    </div>
  )
}

function Msg({ type, msg, onClose }) {
  return (
    <div className={`alert ${type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 16 }}>
      {type === 'error' ? (
        <ShieldAlert size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      ) : (
        <Check size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      )}
      <span style={{ flex: 1 }}>{msg}</span>
      <button
        type="button"
        onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex' }}
        aria-label="Close message"
      >
        <X size={14} />
      </button>
    </div>
  )
}
