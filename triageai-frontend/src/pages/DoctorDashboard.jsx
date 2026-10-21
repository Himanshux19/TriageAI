import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Users,
  User,
  LogOut,
  RefreshCw,
  CheckCircle2,
  X,
  ArrowRight,
  Stethoscope,
  AlertCircle,
  Clock,
  ShieldAlert,
  Check,
  Camera,
  ChevronRight,
  Info,
  FileText,
  MapPin,
} from 'lucide-react'
import api from '../utils/api'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import SeverityBadge from '../components/SeverityBadge'
import ScoreRing from '../components/ScoreRing'
import IcdCards from '../components/IcdCards'

const NAV = [
  { id: 'overview', label: 'Dashboard', icon: Activity },
  { id: 'queue', label: 'Patient Queue', icon: Users },
  { id: 'history', label: 'Consultation History', icon: Clock },
  { id: 'profile', label: 'Profile', icon: User },
]

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [slim, setSlim] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  const [queue, setQueue] = useState([])
  const [sel, setSel] = useState(null)
  const [doc, setDoc] = useState(null)
  const [avail, setAvail] = useState('AVAILABLE')
  const [time, setTime] = useState(new Date())

  // Queue filters & sort
  const [search, setSearch] = useState('')
  const [sevF, setSevF] = useState('ALL')
  const [sortBy, setSortBy] = useState('position')

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmAbsentId, setConfirmAbsentId] = useState(null)

  // Profile form
  const [pName, setPName] = useState('')
  const [pSpec, setPSpec] = useState('')
  const [pExp, setPExp] = useState('')
  const [pPwd, setPPwd] = useState('')
  const [pPhoto, setPPhoto] = useState('')
  const fileRef = useRef()

  // Consultation History states
  const [history, setHistory] = useState([])
  const [histSel, setHistSel] = useState(null)
  const [histSearch, setHistSearch] = useState('')
  const [histSevFilter, setHistSevFilter] = useState('ALL')
  const [histStatusFilter, setHistStatusFilter] = useState('ALL')

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

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/api/doctor/profile')
      setDoc(data)
      setAvail(data.availabilityStatus || 'AVAILABLE')
      setPName(data.name || '')
      setPSpec(data.specialization || '')
      setPExp(data.experienceYears ?? '')
      setPPhoto(data.profilePhoto || '')
    } catch {
      logout()
    }
  }, [])

  const loadQueue = useCallback(async () => {
    try {
      const { data } = await api.get('/api/doctor/queue')
      const list = data || []
      setQueue(list)
      setSel(prev => (prev ? list.find(p => p.appointmentId === prev.appointmentId) || prev : null))
    } catch (e) {
      if (e.response?.status === 401) logout()
    } finally {
      setLoading(false)
    }
  }, [])

  const loadHistory = useCallback(async () => {
    try {
      const { data } = await api.get('/api/doctor/history')
      setHistory(data || [])
    } catch {}
  }, [])

  useEffect(() => {
    loadProfile()
    loadQueue()
    loadHistory()
  }, [loadProfile, loadQueue, loadHistory])

  useEffect(() => {
    if (tab === 'queue' || tab === 'overview') {
      const t = setInterval(loadQueue, 10000)
      return () => clearInterval(t)
    }
    if (tab === 'history') {
      loadHistory()
    }
  }, [tab, loadQueue, loadHistory])

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const toggleAvail = async () => {
    const next = avail === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE'
    try {
      await api.put('/api/doctor/availability', null, { params: { status: next } })
      setAvail(next)
      flash(`Availability updated to ${next === 'AVAILABLE' ? 'Available' : 'Unavailable'}.`)
    } catch {
      flash('Unable to update availability status.', true)
    }
  }

  const callNext = async () => {
    setBusy(true)
    try {
      const { data } = await api.post('/api/doctor/call-next')
      await loadQueue()
      if (data) setSel(data)
      flash('Next prioritized patient called to consultation.')
    } catch (ex) {
      flash(ex.response?.data?.message || 'No waiting patients available to call.', true)
    } finally {
      setBusy(false)
    }
  }

  const complete = async id => {
    setBusy(true)
    try {
      await api.put(`/api/doctor/complete/${id}`)
      setSel(null)
      await Promise.all([loadQueue(), loadHistory()])
      flash('Consultation marked complete.')
    } catch {
      flash('Unable to mark consultation complete.', true)
    } finally {
      setBusy(false)
    }
  }

  const markAbsent = async id => {
    setBusy(true)
    try {
      await api.put(`/api/doctor/mark-absent/${id}`)
      setConfirmAbsentId(null)
      setSel(null)
      await Promise.all([loadQueue(), loadHistory()])
      flash('Patient marked absent and removed from active queue.')
    } catch {
      flash('Unable to mark patient absent.', true)
    } finally {
      setBusy(false)
    }
  }

  const saveProfile = async e => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.put('/api/doctor/profile', {
        name: pName.trim(),
        specialization: pSpec.trim(),
        experienceYears: parseInt(pExp, 10) || 0,
        profilePhoto: pPhoto || null,
        password: pPwd || null,
      })
      setPPwd('')
      flash('Clinician profile saved.')
      await loadProfile()
    } catch {
      flash('Failed to update profile.', true)
    } finally {
      setBusy(false)
    }
  }

  const onPhoto = e => {
    const f = e.target.files[0]
    if (!f) return
    const r = new FileReader()
    r.onload = ev => setPPhoto(ev.target.result)
    r.readAsDataURL(f)
  }

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileNav(m => !m)
    } else {
      setSlim(s => !s)
    }
  }

  const active = queue.find(p => p.status === 'IN_CONSULTATION')
  const waiting = queue.filter(p => !['IN_CONSULTATION', 'COMPLETED', 'ABSENT', 'CANCELLED'].includes(p.status))
  const completedTodayCount = history.filter(h => {
    if (h.status !== 'COMPLETED' || !h.bookingTime) return false
    const d = new Date(h.bookingTime)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }).length

  const filteredQueue = waiting
    .filter(p => sevF === 'ALL' || p.severityLevel === sevF)
    .filter(p => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        p.patientName?.toLowerCase().includes(q) ||
        p.tokenNumber?.toLowerCase().includes(q) ||
        p.symptoms?.toLowerCase().includes(q) ||
        p.aiDiagnosis?.toLowerCase().includes(q)
      )
    })
    .slice()
    .sort((a, b) => {
      if (sortBy === 'priority') return (b.priorityScore || 0) - (a.priorityScore || 0)
      if (sortBy === 'wait') return (b.estimatedWaitTime || 0) - (a.estimatedWaitTime || 0)
      return (a.queuePosition || 999) - (b.queuePosition || 999)
    })

  const filteredHistory = history.filter(p => {
    const q = histSearch.toLowerCase()
    const matchesSearch =
      !histSearch ||
      p.patientName?.toLowerCase().includes(q) ||
      p.tokenNumber?.toLowerCase().includes(q) ||
      p.aiDiagnosis?.toLowerCase().includes(q)
    const matchesSev = histSevFilter === 'ALL' || p.severityLevel === histSevFilter
    const matchesStatus = histStatusFilter === 'ALL' || p.status === histStatusFilter
    return matchesSearch && matchesSev && matchesStatus
  })

  const navItems = NAV.map(n => (n.id === 'queue' ? { ...n, badge: waiting.length } : n))

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
          <div style={{ fontSize: 13, color: 'var(--txt3)' }}>Loading clinical workspace…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="shell">
      <Sidebar
        roleLabel="Doctor Portal"
        items={navItems}
        active={tab}
        onSelect={setTab}
        collapsed={slim}
        setCollapsed={setSlim}
        mobileOpen={mobileNav}
        onCloseMobile={() => setMobileNav(false)}
        profileSlot={
          doc && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {pPhoto ? (
                <img
                  src={pPhoto}
                  style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                  alt=""
                />
              ) : (
                <div className="avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
                  {doc.name?.charAt(0) || 'D'}
                </div>
              )}
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: 12.5,
                    color: '#FFFFFF',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {doc.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--sidebar-txt)' }}>
                  {doc.specialization} · {doc.doctorId}
                </div>
              </div>
            </div>
          )
        }
        bottomItems={[{ id: 'logout', label: 'Sign Out', icon: LogOut, color: '#F87171', onClick: logout }]}
      />

      <div className={`main${slim ? ' slim' : ''}`}>
        <Topbar
          title={NAV.find(n => n.id === tab)?.label}
          subtitle={`${doc?.name || 'Clinician'} · ${time.toLocaleDateString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}`}
          onToggleSidebar={handleToggleSidebar}
          onRefresh={() => {
            loadQueue()
            loadHistory()
            loadProfile()
          }}
          extra={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={toggleAvail}
                className={`btn btn-sm ${avail === 'AVAILABLE' ? 'btn-success' : 'btn-ghost'}`}
                title="Toggle clinician availability"
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: avail === 'AVAILABLE' ? 'currentColor' : 'var(--txt3)',
                    display: 'inline-block',
                  }}
                />
                <span>{avail === 'AVAILABLE' ? 'Available for Patients' : 'Paused / Unavailable'}</span>
              </button>
              {!active && waiting.length > 0 && (
                <button
                  type="button"
                  onClick={callNext}
                  disabled={busy}
                  className="btn btn-primary btn-sm"
                >
                  <Stethoscope size={14} />
                  <span>Call Next ({waiting[0]?.tokenNumber})</span>
                </button>
              )}
            </div>
          }
        />

        <div className="page-body">
          {err && (
            <div className="alert alert-error" style={{ marginBottom: 16 }} role="alert">
              <ShieldAlert size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ flex: 1 }}>{err}</span>
              <button
                type="button"
                onClick={() => setErr('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}
                aria-label="Dismiss error"
              >
                <X size={14} />
              </button>
            </div>
          )}
          {ok && (
            <div className="alert alert-success" style={{ marginBottom: 16 }} role="status">
              <Check size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ flex: 1 }}>{ok}</span>
              <button
                type="button"
                onClick={() => setOk('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ── DASHBOARD OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Workload Metrics */}
              <div className="grid-4">
                <div className="stat">
                  <div className="stat-top">
                    <span className="stat-lbl">Awaiting Assessment</span>
                    <div className="stat-icon" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                      <Users size={18} />
                    </div>
                  </div>
                  <div className="stat-val">{waiting.length}</div>
                  <div className="stat-delta">In your assigned queue</div>
                </div>

                <div className="stat">
                  <div className="stat-top">
                    <span className="stat-lbl">Critical Priority</span>
                    <div className="stat-icon" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>
                      <AlertCircle size={18} />
                    </div>
                  </div>
                  <div className="stat-val">
                    {queue.filter(p => p.severityLevel === 'CRITICAL' && p.status !== 'COMPLETED').length}
                  </div>
                  <div className="stat-delta">Immediate review required</div>
                </div>

                <div className="stat">
                  <div className="stat-top">
                    <span className="stat-lbl">Completed Today</span>
                    <div className="stat-icon" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
                      <CheckCircle2 size={18} />
                    </div>
                  </div>
                  <div className="stat-val">{completedTodayCount}</div>
                  <div className="stat-delta">Consultations finished</div>
                </div>

                <div className="stat">
                  <div className="stat-top">
                    <span className="stat-lbl">Estimated Queue Wait</span>
                    <div className="stat-icon" style={{ background: 'var(--orange-bg)', color: 'var(--orange)' }}>
                      <Clock size={18} />
                    </div>
                  </div>
                  <div className="stat-val">
                    {waiting.length > 0
                      ? `${Math.round(
                          waiting.reduce((s, p) => s + (p.estimatedWaitTime || 0), 0) / waiting.length
                        )}m`
                      : '0m'}
                  </div>
                  <div className="stat-delta">Average across waiting patients</div>
                </div>
              </div>

              {/* Active Consultation Clinical Workspace */}
              {active ? (
                <div className="card card-p" style={{ borderLeft: '4px solid var(--accent)' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10,
                      paddingBottom: 14,
                      marginBottom: 16,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="badge b-info">Active Consultation</span>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: 15,
                          color: 'var(--accent)',
                        }}
                      >
                        Token {active.tokenNumber}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--txt1)' }}>
                        {active.patientName}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--txt3)' }}>
                        ({active.age}y · {active.gender})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <SeverityBadge level={active.severityLevel} verbose />
                      {active.urgencyFlag && <span className="badge b-critical">Urgent Flag</span>}
                    </div>
                  </div>

                  <div className="grid-2" style={{ marginBottom: 16 }}>
                    {/* Left: Patient-Reported Information */}
                    <div className="clinical-sec">
                      <div className="clinical-sec-header">
                        <span>1. Patient-Reported Symptoms</span>
                        <span style={{ fontWeight: 500, textTransform: 'none' }}>Source: Patient Intake</span>
                      </div>
                      <div style={{ fontSize: 13.5, color: 'var(--txt1)', lineHeight: 1.6, marginBottom: 10 }}>
                        {active.symptoms || 'No symptom statement recorded.'}
                      </div>
                      {active.extractedSymptoms && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt3)', marginBottom: 5 }}>
                            Key Presenting Indicators:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {active.extractedSymptoms.split(',').map((s, i) => (
                              <span key={i} className="badge b-neutral">
                                {s.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: System Decision Support */}
                    <div className="clinical-sec ai-support">
                      <div className="clinical-sec-header">
                        <span>2. Triage Decision Support</span>
                        <span style={{ fontWeight: 500, textTransform: 'none' }}>Non-Diagnostic Aid</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                        <ScoreRing score={active.riskScore} size={48} label="Risk" />
                        <ScoreRing score={active.priorityScore || 0} size={48} label="Priority" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase' }}>
                            Preliminary Assessment
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt1)', marginTop: 2 }}>
                            {active.aiDiagnosis || 'Awaiting clinician evaluation'}
                          </div>
                          {active.recommendedAction && (
                            <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 3 }}>
                              <strong>Suggested Action:</strong> {active.recommendedAction.replace(/_/g, ' ')}
                            </div>
                          )}
                        </div>
                      </div>
                      {active.clinicalNotes && (
                        <div
                          style={{
                            fontSize: 12.5,
                            color: 'var(--txt2)',
                            background: 'var(--surface)',
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                            lineHeight: 1.5,
                          }}
                        >
                          <strong>Triage Rationale / Notes:</strong> {active.clinicalNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      paddingTop: 12,
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ fontSize: 12, color: 'var(--txt3)' }}>
                      Verify findings directly with the patient before concluding the consultation.
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => complete(active.appointmentId)}
                        disabled={busy}
                        className="btn btn-primary"
                      >
                        <CheckCircle2 size={15} />
                        <span>Complete Consultation</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmAbsentId(active.appointmentId)}
                        disabled={busy}
                        className="btn btn-danger"
                      >
                        <X size={15} />
                        <span>Mark Absent</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="card card-p"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        background: 'var(--accent-bg)',
                        border: '1px solid var(--accent-bd)',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent)',
                        flexShrink: 0,
                      }}
                    >
                      <Stethoscope size={22} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--txt1)' }}>
                        No Patient Currently in Consultation
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--txt3)', marginTop: 2 }}>
                        {waiting.length > 0
                          ? `There ${waiting.length === 1 ? 'is 1 patient' : `are ${waiting.length} patients`} waiting in your prioritized queue.`
                          : 'Your queue is currently clear.'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={callNext}
                    disabled={busy || waiting.length === 0}
                    className="btn btn-primary btn-lg"
                  >
                    <Stethoscope size={16} />
                    <span>{busy ? 'Calling patient…' : 'Call Next Patient'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {/* Upcoming Priority Queue Preview */}
              <div className="card">
                <div
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--txt1)' }}>
                      Patients Awaiting Assessment
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>
                      Ordered by clinical triage priority and arrival time
                    </div>
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab('queue')}>
                    <span>Open Full Queue</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {waiting.length === 0 ? (
                  <div className="empty">
                    <div className="empty-icon">
                      <Users size={20} />
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--txt2)' }}>No patients waiting</div>
                    <div style={{ fontSize: 12.5 }}>New check-ins assigned to you will appear here automatically.</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Pos</th>
                          <th>Token</th>
                          <th>Patient</th>
                          <th>Presenting Complaint</th>
                          <th>Triage Priority</th>
                          <th>Priority Score</th>
                          <th>Arrival</th>
                          <th>Est. Wait</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {waiting.slice(0, 6).map(p => (
                          <tr
                            key={p.appointmentId}
                            className={p.severityLevel === 'CRITICAL' ? 'row-critical' : ''}
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setSel(p)
                              setTab('queue')
                            }}
                          >
                            <td style={{ fontWeight: 700, color: 'var(--txt2)' }}>#{p.queuePosition}</td>
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
                            <td style={{ maxWidth: 260 }}>
                              <div
                                style={{
                                  fontSize: 13,
                                  color: 'var(--txt1)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {p.symptoms || p.aiDiagnosis || '—'}
                              </div>
                              {p.aiDiagnosis && (
                                <div
                                  style={{
                                    fontSize: 11.5,
                                    color: 'var(--txt3)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  Support: {p.aiDiagnosis}
                                </div>
                              )}
                            </td>
                            <td>
                              <SeverityBadge level={p.severityLevel} />
                            </td>
                            <td>
                              <span style={{ fontWeight: 700, fontSize: 13 }}>
                                {Math.round(p.priorityScore || p.riskScore || 0)}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--txt3)' }}>/100</span>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  p.geofenceStatus === 'ARRIVED'
                                    ? 'b-low'
                                    : p.geofenceStatus === 'OUTSIDE_RADIUS'
                                    ? 'b-high'
                                    : 'b-neutral'
                                }`}
                              >
                                {p.geofenceStatus === 'ARRIVED'
                                  ? 'On Site'
                                  : p.geofenceStatus === 'OUTSIDE_RADIUS'
                                  ? 'Away'
                                  : 'Pending'}
                              </span>
                            </td>
                            <td style={{ fontSize: 12.5, color: 'var(--txt2)' }}>{p.estimatedWaitTime}m</td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={e => {
                                  e.stopPropagation()
                                  setSel(p)
                                  setTab('queue')
                                }}
                              >
                                <span>Review</span>
                                <ChevronRight size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PATIENT QUEUE TAB ── */}
          {tab === 'queue' && (
            <div className="split-view">
              <div className="split-main">
                <div className="card">
                  {/* Search, Filter & Sort Bar */}
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
                      style={{ flex: 1, minWidth: 200 }}
                      placeholder="Search by patient name, token, or complaint…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      aria-label="Search patient queue"
                    />
                    <select
                      className="inp"
                      style={{ width: 165 }}
                      value={sevF}
                      onChange={e => setSevF(e.target.value)}
                      aria-label="Filter by triage priority"
                    >
                      <option value="ALL">All Priority Levels</option>
                      <option value="CRITICAL">Critical Priority</option>
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Moderate Priority</option>
                      <option value="LOW">Low Priority</option>
                    </select>
                    <select
                      className="inp"
                      style={{ width: 165 }}
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      aria-label="Sort queue by"
                    >
                      <option value="position">Sort: Queue Order</option>
                      <option value="priority">Sort: Priority Score</option>
                      <option value="wait">Sort: Wait Duration</option>
                    </select>
                  </div>

                  {filteredQueue.length === 0 ? (
                    <div className="empty">
                      <div className="empty-icon">
                        <Users size={22} />
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--txt2)' }}>No matching patients in queue</div>
                      <div style={{ fontSize: 12.5 }}>
                        {search || sevF !== 'ALL'
                          ? 'Try clearing your search or priority filter.'
                          : 'There are currently no patients waiting in your queue.'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>Pos</th>
                            <th>Token</th>
                            <th>Patient</th>
                            <th>Presenting Complaint</th>
                            <th>Triage Priority</th>
                            <th>Arrival</th>
                            <th>Est. Wait</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredQueue.map(p => {
                            const isSelected = sel?.appointmentId === p.appointmentId
                            return (
                              <tr
                                key={p.appointmentId}
                                onClick={() => setSel(isSelected ? null : p)}
                                className={`${isSelected ? 'row-selected' : ''} ${
                                  p.severityLevel === 'CRITICAL' ? 'row-critical' : ''
                                }`}
                                style={{ cursor: 'pointer' }}
                              >
                                <td style={{ fontWeight: 700, color: 'var(--txt2)' }}>#{p.queuePosition}</td>
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
                                <td style={{ maxWidth: 240 }}>
                                  <div
                                    style={{
                                      fontSize: 13,
                                      color: 'var(--txt1)',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {p.symptoms || '—'}
                                  </div>
                                  {p.aiDiagnosis && (
                                    <div
                                      style={{
                                        fontSize: 11.5,
                                        color: 'var(--txt3)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {p.aiDiagnosis}
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <SeverityBadge level={p.severityLevel} />
                                </td>
                                <td>
                                  <span
                                    className={`badge ${
                                      p.geofenceStatus === 'ARRIVED'
                                        ? 'b-low'
                                        : p.geofenceStatus === 'OUTSIDE_RADIUS'
                                        ? 'b-high'
                                        : 'b-neutral'
                                    }`}
                                  >
                                    {p.geofenceStatus === 'ARRIVED'
                                      ? 'On Site'
                                      : p.geofenceStatus === 'OUTSIDE_RADIUS'
                                      ? 'Outside Zone'
                                      : 'Pending'}
                                  </span>
                                </td>
                                <td style={{ fontSize: 12.5, color: 'var(--txt2)' }}>{p.estimatedWaitTime}m</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Structured Patient Clinical View Panel */}
              {sel && (
                <div className="split-side">
                  <ClinicalRecordPanel
                    record={sel}
                    onClose={() => setSel(null)}
                    onCallNext={callNext}
                    onComplete={() => complete(sel.appointmentId)}
                    onRequestAbsent={() => setConfirmAbsentId(sel.appointmentId)}
                    busy={busy}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── CONSULTATION HISTORY TAB ── */}
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
                      placeholder="Search patient name, token, or assessment…"
                      value={histSearch}
                      onChange={e => setHistSearch(e.target.value)}
                      aria-label="Search consultation history"
                    />
                    <select
                      className="inp"
                      style={{ width: 155 }}
                      value={histSevFilter}
                      onChange={e => setHistSevFilter(e.target.value)}
                      aria-label="Filter history by priority"
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
                      aria-label="Filter history by status"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="IN_CONSULTATION">In Consultation</option>
                      <option value="WAITING">Waiting</option>
                      <option value="ABSENT">Absent</option>
                    </select>
                  </div>

                  {filteredHistory.length === 0 ? (
                    <div className="empty">
                      <div className="empty-icon">
                        <FileText size={22} />
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--txt2)' }}>No consultation records found</div>
                      <div style={{ fontSize: 12.5 }}>
                        Completed consultations and historical patient records will appear here.
                      </div>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>Token</th>
                            <th>Patient</th>
                            <th>Priority</th>
                            <th>Risk Score</th>
                            <th>Preliminary Assessment</th>
                            <th>Status</th>
                            <th>Date &amp; Time</th>
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
                                <td>
                                  <SeverityBadge level={p.severityLevel} />
                                </td>
                                <td>
                                  <span style={{ fontWeight: 700 }}>{Math.round(p.riskScore || 0)}</span>
                                  <span style={{ fontSize: 11, color: 'var(--txt3)' }}>/100</span>
                                </td>
                                <td style={{ fontSize: 12.5, color: 'var(--txt2)', maxWidth: 200 }}>
                                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {p.aiDiagnosis || '—'}
                                  </div>
                                </td>
                                <td>
                                  <span
                                    className={`badge ${
                                      p.status === 'COMPLETED'
                                        ? 'b-low'
                                        : p.status === 'ABSENT'
                                        ? 'b-critical'
                                        : 'b-neutral'
                                    }`}
                                  >
                                    {p.status}
                                  </span>
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
                  <ClinicalRecordPanel
                    record={histSel}
                    onClose={() => setHistSel(null)}
                    isHistory
                  />
                </div>
              )}
            </div>
          )}

          {/* ── PROFILE TAB ── */}
          {tab === 'profile' && (
            <div style={{ maxWidth: 560 }}>
              <form onSubmit={saveProfile} className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--txt1)' }}>Clinician Profile</div>
                  <div style={{ fontSize: 12.5, color: 'var(--txt3)', marginTop: 2 }}>
                    Update your professional details and consultation availability.
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    {pPhoto ? (
                      <img
                        src={pPhoto}
                        style={{
                          width: 68,
                          height: 68,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid var(--accent)',
                        }}
                        alt=""
                      />
                    ) : (
                      <div className="avatar" style={{ width: 68, height: 68, fontSize: 24 }}>
                        {doc?.name?.charAt(0) || 'D'}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      aria-label="Upload profile photo"
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 24,
                        height: 24,
                        background: 'var(--accent)',
                        border: '2px solid var(--surface)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Camera size={12} color="white" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--txt1)' }}>{doc?.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--txt2)', marginTop: 2 }}>{doc?.specialization}</div>
                    <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>
                      Clinician ID: <strong>{doc?.doctorId}</strong> · {doc?.email}
                    </div>
                  </div>
                </div>

                <div className="grid-2">
                  <div>
                    <label className="lbl" htmlFor="doc-name">
                      Full Name
                    </label>
                    <input id="doc-name" className="inp" value={pName} onChange={e => setPName(e.target.value)} />
                  </div>
                  <div>
                    <label className="lbl" htmlFor="doc-spec">
                      Clinical Specialization
                    </label>
                    <input id="doc-spec" className="inp" value={pSpec} onChange={e => setPSpec(e.target.value)} />
                  </div>
                  <div>
                    <label className="lbl" htmlFor="doc-exp">
                      Years of Experience
                    </label>
                    <input
                      id="doc-exp"
                      className="inp"
                      type="number"
                      min={0}
                      value={pExp}
                      onChange={e => setPExp(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="lbl" htmlFor="doc-pwd">
                      New Password (Optional)
                    </label>
                    <input
                      id="doc-pwd"
                      className="inp"
                      type="password"
                      value={pPwd}
                      onChange={e => setPPwd(e.target.value)}
                      placeholder="Leave blank to keep current"
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--txt1)' }}>Queue Availability</div>
                    <div style={{ fontSize: 12, color: 'var(--txt3)' }}>
                      Setting status to Unavailable redistributes waiting patients to other active clinicians.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleAvail}
                    className={`btn btn-sm ${avail === 'AVAILABLE' ? 'btn-success' : 'btn-ghost'}`}
                  >
                    {avail === 'AVAILABLE' ? 'Available' : 'Unavailable'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" disabled={busy} className="btn btn-primary">
                    {busy ? 'Saving changes…' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Marking Patient Absent */}
      {confirmAbsentId && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="absent-modal-title">
          <div className="modal-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <AlertCircle size={20} color="var(--red)" />
              <div id="absent-modal-title" style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--txt1)' }}>
                Confirm Patient Absence
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.5, margin: '0 0 18px' }}>
              Are you sure you want to mark this patient as <strong>Absent</strong>? This will remove them from the active consultation queue.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setConfirmAbsentId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={busy}
                onClick={() => markAbsent(confirmAbsentId)}
              >
                Confirm Absent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ClinicalRecordPanel({ record, onClose, onCallNext, onComplete, onRequestAbsent, busy, isHistory = false }) {
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
      {/* Header */}
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
            {record.urgencyFlag && <span className="badge b-critical">Urgent</span>}
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--txt1)', marginTop: 6 }}>
            {record.patientName}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--txt3)', marginTop: 2 }}>
            {record.age} years · {record.gender} · Status: <strong>{record.status}</strong>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          onClick={onClose}
          aria-label="Close clinical record panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Section 1: Patient-Reported Information */}
      <div className="clinical-sec">
        <div className="clinical-sec-header">
          <span>Patient-Reported Information</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--txt1)', lineHeight: 1.55 }}>
          {record.symptoms || 'No symptom description provided.'}
        </div>
        {record.extractedSymptoms && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt3)', marginBottom: 4 }}>
              Extracted Symptom Keywords:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {record.extractedSymptoms.split(',').map((s, i) => (
                <span key={i} className="badge b-neutral" style={{ fontSize: 11 }}>
                  {s.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: System-Generated Triage Support */}
      <div className="clinical-sec ai-support">
        <div className="clinical-sec-header">
          <span>System Triage Support</span>
          <span style={{ fontWeight: 500, textTransform: 'none' }}>Decision Support</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            paddingBottom: 10,
            marginBottom: 10,
            borderBottom: '1px solid var(--accent-bd)',
          }}
        >
          <ScoreRing score={record.riskScore} size={46} label="Risk" />
          <ScoreRing score={record.priorityScore || 0} size={46} label="Priority" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--txt3)', fontWeight: 600 }}>Preliminary Classification</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--txt1)', marginTop: 2 }}>
              {record.aiDiagnosis || 'Pending clinician evaluation'}
            </div>
          </div>
        </div>

        {record.icdCodes && record.icdCodes.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt3)', marginBottom: 5 }}>
              Candidate ICD-10 Codes:
            </div>
            <IcdCards icdCodes={record.icdCodes} />
          </div>
        )}

        {record.recommendedAction && (
          <div style={{ fontSize: 12.5, color: 'var(--txt1)', marginBottom: 6 }}>
            <strong>Suggested Workflow Action:</strong> {record.recommendedAction.replace(/_/g, ' ')}
          </div>
        )}

        {record.clinicalNotes && (
          <div style={{ fontSize: 12.5, color: 'var(--txt2)', lineHeight: 1.5 }}>
            <strong>Rationale / Clinical Notes:</strong> {record.clinicalNotes}
          </div>
        )}
      </div>

      {/* Section 3: Queue & Operational Metadata */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {!isHistory && (
          <>
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
              <span style={{ color: 'var(--txt3)' }}>Queue Position</span>
              <strong>#{record.queuePosition}</strong>
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
              <span style={{ color: 'var(--txt3)' }}>Estimated Wait</span>
              <strong>{record.estimatedWaitTime} min</strong>
            </div>
          </>
        )}
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
          <span style={{ color: 'var(--txt3)' }}>Clinic Arrival (Geofence)</span>
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

      <div className="clinical-disclaimer">
        System-generated triage scores and ICD-10 mappings are provided for prioritization support only and must be verified by the examining clinician.
      </div>

      {/* Workflow Actions */}
      {!isHistory && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {record.status !== 'IN_CONSULTATION' && record.status !== 'COMPLETED' && (
            <button
              type="button"
              onClick={onCallNext}
              disabled={busy}
              className="btn btn-primary btn-full"
            >
              <Stethoscope size={15} />
              <span>Call Next Patient to Consultation</span>
            </button>
          )}
          {record.status === 'IN_CONSULTATION' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={onComplete}
                disabled={busy}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <CheckCircle2 size={15} />
                <span>Complete</span>
              </button>
              <button
                type="button"
                onClick={onRequestAbsent}
                disabled={busy}
                className="btn btn-danger"
                style={{ flex: 1 }}
              >
                <X size={15} />
                <span>Mark Absent</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
