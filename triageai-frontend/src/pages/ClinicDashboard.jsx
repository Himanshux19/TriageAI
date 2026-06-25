import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, BarChart3, QrCode, Settings, UserCheck, LogOut, RefreshCw, Plus, Trash2, Edit3, Check, X, ShieldAlert, Copy, TrendingUp, Clock, AlertCircle, Activity, MapPin, Zap, Download } from 'lucide-react'
import api from '../utils/api'
import { useTheme } from '../context/ThemeContext'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import SeverityBadge from '../components/SeverityBadge'
import ScoreRing from '../components/ScoreRing'

const NAV = [
  { id: 'queue',     label: 'Live Queue',  icon: Users },
  { id: 'doctors',   label: 'Doctors',     icon: UserCheck },
  { id: 'analytics', label: 'Analytics',   icon: BarChart3 },
  { id: 'history',   label: 'Patient History', icon: Clock },
  { id: 'qr',        label: 'QR Code',     icon: QrCode },
  { id: 'settings',  label: 'Settings',    icon: Settings },
]

export default function ClinicDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('queue')
  const [slim, setSlim] = useState(false)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  // Doctor form
  const [dName, setDName] = useState(''); const [dSpec, setDSpec] = useState(''); const [dExp, setDExp] = useState(''); const [dEmail, setDEmail] = useState('')
  // Edit state
  const [editId, setEditId] = useState(null); const [eN, setEN] = useState(''); const [eSp, setESp] = useState(''); const [eEx, setEEx] = useState(''); const [eEm, setEEm] = useState('')
  // Settings
  const [sName, setSName] = useState(''); const [sEmail, setSEmail] = useState(''); const [sPhone, setSPhone] = useState(''); const [sLat, setSLat] = useState(''); const [sLng, setSLng] = useState(''); const [sGeo, setSGeo] = useState(500); const [sPwd, setSPwd] = useState('')

  // Patient History states
  const [history, setHistory] = useState([])
  const [histSel, setHistSel] = useState(null)
  const [histSearch, setHistSearch] = useState('')
  const [histSevFilter, setHistSevFilter] = useState('ALL')
  const [histStatusFilter, setHistStatusFilter] = useState('ALL')

  // Doctor History for Clinic states
  const [selectedDocHistory, setSelectedDocHistory] = useState(null)
  const [docHistoryData, setDocHistoryData] = useState([])

  const loadDocHistory = async (doc) => {
    setSelectedDocHistory(doc)
    try {
      const r = await api.get(`/api/clinic/doctor/${doc.doctorId}/history`)
      setDocHistoryData(r.data || [])
    } catch {
      flash('Failed to load doctor history.', true)
    }
  }

  const logout = () => { ['triageai_token','triageai_role','triageai_id'].forEach(k => localStorage.removeItem(k)); navigate('/') }

  const flash = (msg, isErr = false) => {
    isErr ? setErr(msg) : setOk(msg)
    setTimeout(() => isErr ? setErr('') : setOk(''), 4000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, s, d] = await Promise.all([api.get('/api/clinic/profile'), api.get('/api/clinic/statistics'), api.get('/api/doctor/doctors')])
      setProfile(p.data); setStats(s.data); setDoctors(d.data)
      setSName(p.data.clinicName || ''); setSEmail(p.data.email || ''); setSPhone(p.data.phone || '')
      setSLat(p.data.latitude || ''); setSLng(p.data.longitude || ''); setSGeo(p.data.thresholdDistance || 500)
    } catch { logout() }
    finally { setLoading(false) }
  }, [])

  const loadQueue = useCallback(async () => {
    try { const r = await api.get('/api/clinic/queue'); setQueue(r.data || []) } catch {}
  }, [])

  const loadHistory = useCallback(async () => {
    try { const r = await api.get('/api/clinic/history'); setHistory(r.data || []) } catch {}
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (tab === 'queue') { loadQueue(); const t = setInterval(loadQueue, 8000); return () => clearInterval(t) }
    if (tab === 'history') { loadHistory() }
  }, [tab, loadQueue, loadHistory])

  const addDoctor = async e => {
    e.preventDefault(); setBusy(true)
    try {
      await api.post('/api/doctor/register', { name: dName, specialization: dSpec, experienceYears: parseInt(dExp), email: dEmail, clinicId: profile?.clinicId })
      flash(`Dr. ${dName} added. Credentials sent to ${dEmail}.`)
      setDName(''); setDSpec(''); setDExp(''); setDEmail('')
      const r = await api.get('/api/doctor/doctors'); setDoctors(r.data)
    } catch { flash('Failed to add doctor.', true) }
    finally { setBusy(false) }
  }

  const saveEdit = async id => {
    try {
      await api.put(`/api/doctor/${id}/edit`, { name: eN, specialization: eSp, experienceYears: parseInt(eEx), email: eEm, clinicId: profile?.clinicId })
      setEditId(null); flash('Doctor updated.')
      const r = await api.get('/api/doctor/doctors'); setDoctors(r.data)
    } catch { flash('Update failed.', true) }
  }

  const toggleDoc = async doc => {
    const next = !(doc.active != null ? doc.active : true)
    try {
      await api.put(`/api/doctor/${doc.doctorId}/active`, null, { params: { active: next } })
      setDoctors(ds => ds.map(d => d.doctorId === doc.doctorId ? { ...d, active: next } : d))
      flash(`Dr. ${doc.name} ${next ? 'enabled' : 'disabled'}.`)
    } catch { flash('Failed to update.', true) }
  }

  const deleteDoc = async id => {
    if (!confirm('Remove this doctor?')) return
    try { await api.delete(`/api/doctor/${id}`); setDoctors(ds => ds.filter(d => d.doctorId !== id)); flash('Doctor removed.') }
    catch { flash('Failed.', true) }
  }

  const saveSettings = async e => {
    e.preventDefault(); setBusy(true)
    try {
      await api.put('/api/clinic/profile', { clinicName: sName, email: sEmail, phone: sPhone, latitude: parseFloat(sLat) || null, longitude: parseFloat(sLng) || null, thresholdDistance: parseInt(sGeo), password: sPwd || null })
      flash('Settings saved.'); setSPwd(''); const r = await api.get('/api/clinic/profile'); setProfile(r.data)
    } catch { flash('Save failed.', true) }
    finally { setBusy(false) }
  }

  const genQR = async () => {
    try { const r = await api.post('/api/clinic/generate-qr'); setProfile(p => ({ ...p, qrCodeUrl: r.data })); flash('QR code generated.') }
    catch { flash('QR generation failed.', true) }
  }

  const exportCSV = () => {
    const token = localStorage.getItem('triageai_token')
    window.open(`/api/clinic/export-patients?token=${token}`, '_blank')
  }

  const sevStatus = s => ({ ARRIVED: 'b-low', IN_CONSULTATION: 'b-info', OUTSIDE_RADIUS: 'b-high', ABSENT: 'b-critical', WAITING: 'b-neutral' }[s] || 'b-neutral')

  if (loading) return <Loader />

  const navItems = NAV.map(n => n.id === 'queue' ? { ...n, badge: queue.filter(q => q.status === 'WAITING').length } : n)

  return (
    <div className="shell">
      <Sidebar
        items={navItems} active={tab} onSelect={setTab} collapsed={slim} setCollapsed={setSlim}
        profileSlot={profile && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--sidebar-txt)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>Active Clinic</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.clinicName}</div>
            <div style={{ fontSize: 10, color: 'var(--sidebar-txt)', marginTop: 1 }}>{profile.clinicId}</div>
          </div>
        )}
        bottomItems={[{ id: 'logout', label: 'Sign Out', icon: LogOut, color: '#EF4444', onClick: logout }]}
      />
      <div className={`main${slim ? ' slim' : ''}`}>
        <Topbar
          title={NAV.find(n => n.id === tab)?.label}
          subtitle={tab === 'queue' ? 'Auto-refreshes every 8s' : undefined}
          onToggleSidebar={() => setSlim(s => !s)}
          onRefresh={() => { load(); loadQueue(); loadHistory() }}
        />
        <div className="page-body">
          {err && <Msg type="error" msg={err} onClose={() => setErr('')} />}
          {ok  && <Msg type="ok"    msg={ok}  onClose={() => setOk('')} />}

          {/* ── QUEUE ── */}
          {tab === 'queue' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                  <Stat icon={<Users size={18} />} col="#3B5BDB" label="Today's Patients"      val={stats.totalPatientsToday ?? 0} />
                  <Stat icon={<Clock size={18} />} col="#059669" label="Avg Wait"               val={`${stats.averageWaitTime ?? 8}m`} />
                  <Stat icon={<TrendingUp size={18} />} col="#D97706" label="Completed"         val={stats.completedConsultations ?? 0} />
                  <Stat icon={<AlertCircle size={18} />} col="#DC2626" label="Critical Cases"   val={stats.criticalCasesCount ?? 0} />
                </div>
              )}
              <div className="card">
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Live Patient Queue</div>
                    <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>{queue.length} entries</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost btn-sm" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Download size={13} />Download CSV</button>
                    <button className="btn btn-ghost btn-sm" onClick={loadQueue} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><RefreshCw size={13} />Refresh</button>
                  </div>
                </div>
                {queue.length === 0
                  ? <div className="empty"><div className="empty-icon"><Users size={22} color="var(--txt3)" /></div><div style={{ fontWeight: 600 }}>Queue is empty</div></div>
                  : <div style={{ overflowX: 'auto' }}>
                    <table className="tbl">
                      <thead><tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Severity</th><th>Risk</th><th>ICD</th><th>Status</th><th>#</th><th>Wait</th></tr></thead>
                      <tbody>
                        {queue.map(p => (
                          <tr key={p.appointmentId}>
                            <td><span style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: 15, color: 'var(--accent)' }}>{p.tokenNumber}</span></td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{p.patientName}</div>
                              <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{p.age}y · {p.gender}</div>
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--txt2)' }}>{p.doctorName || '—'}</td>
                            <td><SeverityBadge level={p.severityLevel} /></td>
                            <td><ScoreRing score={p.riskScore} size={38} /></td>
                            <td style={{ fontSize: 11, color: 'var(--txt2)', maxWidth: 120 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.aiDiagnosis || '—'}</div></td>
                            <td><span className={`badge ${sevStatus(p.status)}`}>{p.status}</span></td>
                            <td style={{ fontWeight: 700, textAlign: 'center' }}>#{p.queuePosition}</td>
                            <td style={{ color: 'var(--txt2)', fontSize: 12 }}>{p.estimatedWaitTime}m</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </div>
          )}

          {/* ── DOCTORS ── */}
          {tab === 'doctors' && (
            <div style={{ display: 'flex', gap: 18 }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="card card-p">
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Add New Doctor</div>
                  <div style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 16 }}>A temporary password will be emailed to the doctor.</div>
                  <form onSubmit={addDoctor} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label className="lbl">Full Name</label><input className="inp" required value={dName} onChange={e => setDName(e.target.value)} placeholder="Dr. Sarah Johnson" /></div>
                    <div><label className="lbl">Specialization</label><input className="inp" required value={dSpec} onChange={e => setDSpec(e.target.value)} placeholder="Cardiology" /></div>
                    <div><label className="lbl">Experience (years)</label><input className="inp" type="number" required min={0} max={60} value={dExp} onChange={e => setDExp(e.target.value)} placeholder="5" /></div>
                    <div><label className="lbl">Email</label><input className="inp" type="email" required value={dEmail} onChange={e => setDEmail(e.target.value)} placeholder="doctor@hospital.com" /></div>
                    <div style={{ gridColumn: '1/-1' }}><button type="submit" disabled={busy} className="btn btn-primary"><Plus size={14} />{busy ? 'Adding…' : 'Add Doctor'}</button></div>
                  </form>
                </div>
                <div className="card">
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Clinic Doctors <span style={{ fontSize: 12, color: 'var(--txt3)', fontWeight: 400 }}>({doctors.length})</span></div>
                  </div>
                  {doctors.length === 0
                    ? <div className="empty"><div className="empty-icon"><UserCheck size={22} color="var(--txt3)" /></div><div style={{ fontWeight: 600 }}>No doctors yet</div></div>
                    : <div style={{ overflowX: 'auto' }}>
                      <table className="tbl">
                        <thead><tr><th>Doctor</th><th>Specialization</th><th>Exp.</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                          {doctors.map(doc => (
                            <tr key={doc.doctorId}>
                              {editId === doc.doctorId ? (
                                <>
                                  <td><input className="inp" value={eN} onChange={e => setEN(e.target.value)} style={{ width: 140 }} /></td>
                                  <td><input className="inp" value={eSp} onChange={e => setESp(e.target.value)} style={{ width: 130 }} /></td>
                                  <td><input className="inp" type="number" value={eEx} onChange={e => setEEx(e.target.value)} style={{ width: 60 }} /></td>
                                  <td><input className="inp" type="email" value={eEm} onChange={e => setEEm(e.target.value)} style={{ width: 160 }} /></td>
                                  <td></td>
                                  <td><div style={{ display: 'flex', gap: 6 }}>
                                    <button className="btn btn-primary btn-sm btn-icon" onClick={() => saveEdit(doc.doctorId)}><Check size={13} /></button>
                                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setEditId(null)}><X size={13} /></button>
                                  </div></td>
                                </>
                              ) : (
                                <>
                                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div className="avatar" style={{ width: 34, height: 34, fontSize: 13 }}>{doc.name?.charAt(0) || 'D'}</div>
                                    <div><div style={{ fontWeight: 600, fontSize: 13 }}>{doc.name}</div><div style={{ fontSize: 11, color: 'var(--txt3)' }}>{doc.doctorId}</div></div>
                                  </div></td>
                                  <td style={{ fontSize: 13, color: 'var(--txt2)' }}>{doc.specialization}</td>
                                  <td style={{ fontSize: 13, color: 'var(--txt2)' }}>{doc.experienceYears}y</td>
                                  <td style={{ fontSize: 12, color: 'var(--txt3)' }}>{doc.email}</td>
                                  <td><label className="toggle"><input type="checkbox" checked={doc.active !== false} onChange={() => toggleDoc(doc)} /><span className="tslider"></span></label></td>
                                  <td><div style={{ display: 'flex', gap: 6 }}>
                                    <button className="btn btn-ghost btn-sm btn-icon" title="View History" onClick={() => loadDocHistory(doc)}><Clock size={13} /></button>
                                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditId(doc.doctorId); setEN(doc.name||''); setESp(doc.specialization||''); setEEx(doc.experienceYears||''); setEEm(doc.email||'') }}><Edit3 size={13} /></button>
                                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteDoc(doc.doctorId)}><Trash2 size={13} /></button>
                                  </div></td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  }
                </div>
              </div>
              {selectedDocHistory && (
                <div style={{ width: 380, flexShrink: 0 }}>
                  <div className="card card-p fade-up" style={{ position: 'sticky', top: 74, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>History: {selectedDocHistory.name}</h3>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setSelectedDocHistory(null); setDocHistoryData([]) }}><X size={14} /></button>
                    </div>
                    {docHistoryData.length === 0 ? (
                      <div className="empty" style={{ padding: '20px 0' }}>
                        <div className="empty-icon"><Clock size={20} color="var(--txt3)" /></div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>No consultations yet</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {docHistoryData.map(p => (
                          <div key={p.appointmentId} style={{ padding: 12, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: 13, color: 'var(--accent)' }}>{p.tokenNumber}</span>
                              <span className={`badge ${p.status === 'COMPLETED' ? 'b-low' : p.status === 'ABSENT' ? 'b-critical' : 'b-neutral'}`} style={{ fontSize: 10 }}>{p.status}</span>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--txt1)' }}>{p.patientName}</div>
                            <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 6 }}>{p.age}y · {p.gender}</div>
                            <div style={{ fontSize: 11, color: 'var(--txt2)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <SeverityBadge level={p.severityLevel} />
                              <span>Score: {p.riskScore}</span>
                            </div>
                            {p.aiDiagnosis && (
                              <div style={{ fontSize: 11, color: 'var(--txt2)', background: 'var(--purple-bg)', border: '1px solid var(--purple-bd)', padding: '4px 6px', borderRadius: 4, marginTop: 4 }}>
                                {p.aiDiagnosis}
                              </div>
                            )}
                            <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 6, textAlign: 'right' }}>
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

          {/* ── ANALYTICS ── */}
          {tab === 'analytics' && stats && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                <Stat icon={<Users size={18} />}      col="#3B5BDB" label="Total Today"         val={stats.totalPatientsToday ?? 0} />
                <Stat icon={<Check size={18} />}      col="#059669" label="Completed"            val={stats.completedConsultations ?? 0} />
                <Stat icon={<Activity size={18} />}   col="#0891B2" label="In Consultation"      val={stats.inConsultationCount ?? 0} />
                <Stat icon={<AlertCircle size={18} />}col="#DC2626" label="Critical"             val={stats.criticalCasesCount ?? 0} />
                <Stat icon={<Zap size={18} />}        col="#D97706" label="High Priority"        val={stats.highCount ?? 0} />
                <Stat icon={<UserCheck size={18} />}  col="#7C3AED" label="Active Doctors"       val={stats.activeDoctors ?? 0} />
              </div>
              <div className="card card-p">
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Severity Breakdown</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                  {[
                    { label: 'Critical', val: stats.criticalCasesCount ?? 0, col: '#DC2626', bg: 'var(--red-bg)', bd: 'var(--red-bd)' },
                    { label: 'High',     val: stats.highCount ?? 0,           col: '#D97706', bg: 'var(--orange-bg)', bd: 'var(--orange-bd)' },
                    { label: 'Medium',   val: stats.mediumCount ?? 0,         col: '#CA8A04', bg: 'var(--yellow-bg)', bd: 'var(--yellow-bd)' },
                    { label: 'Low',      val: stats.lowCount ?? 0,            col: '#059669', bg: 'var(--green-bg)', bd: 'var(--green-bd)' },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.bd}`, borderRadius: 12, padding: '18px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 32, fontWeight: 900, color: s.col, lineHeight: 1 }}>{s.val}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: s.col, marginTop: 6 }}>{s.label}</div>
                      <div style={{ marginTop: 10 }}><div className="prog-bar"><div className="prog-fill" style={{ width: `${stats.totalPatientsToday ? (s.val / stats.totalPatientsToday * 100) : 0}%`, background: s.col }} /></div></div>
                    </div>
                  ))}
                </div>
                {stats.averageRiskScore > 0 && (
                  <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <ScoreRing score={stats.averageRiskScore} size={52} label="Avg Risk" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--txt1)' }}>Average Risk Score: {stats.averageRiskScore.toFixed(1)}</div>
                      <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 3 }}>Across all patients today</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Patient History ── */}
          {tab === 'history' && (
            <div style={{ display: 'flex', gap: 18 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="card">
                  <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input className="inp" style={{ flex: 1, minWidth: 160 }} placeholder="Search patient or token..." value={histSearch} onChange={e => setHistSearch(e.target.value)} />
                    <select className="inp" style={{ width: 140 }} value={histSevFilter} onChange={e => setHistSevFilter(e.target.value)}>
                      <option value="ALL">All Severity</option>
                      {['CRITICAL','HIGH','MEDIUM','LOW'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select className="inp" style={{ width: 140 }} value={histStatusFilter} onChange={e => setHistStatusFilter(e.target.value)}>
                      <option value="ALL">All Status</option>
                      {['COMPLETED','ABSENT','WAITING','IN_CONSULTATION','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={loadHistory}><RefreshCw size={14} /></button>
                  </div>
                  {history.filter(p => {
                    const matchesSearch = !histSearch || p.patientName?.toLowerCase().includes(histSearch.toLowerCase()) || p.tokenNumber?.toLowerCase().includes(histSearch.toLowerCase());
                    const matchesSev = histSevFilter === 'ALL' || p.severityLevel === histSevFilter;
                    const matchesStatus = histStatusFilter === 'ALL' || p.status === histStatusFilter;
                    return matchesSearch && matchesSev && matchesStatus;
                  }).length === 0 ? (
                    <div className="empty"><div className="empty-icon"><Users size={22} color="var(--txt3)" /></div><div style={{ fontWeight: 600 }}>No history records found</div></div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>Token</th>
                            <th>Patient</th>
                            <th>Doctor</th>
                            <th>Severity</th>
                            <th>Risk</th>
                            <th>AI Diagnosis</th>
                            <th>Status</th>
                            <th>Booking Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.filter(p => {
                            const matchesSearch = !histSearch || p.patientName?.toLowerCase().includes(histSearch.toLowerCase()) || p.tokenNumber?.toLowerCase().includes(histSearch.toLowerCase());
                            const matchesSev = histSevFilter === 'ALL' || p.severityLevel === histSevFilter;
                            const matchesStatus = histStatusFilter === 'ALL' || p.status === histStatusFilter;
                            return matchesSearch && matchesSev && matchesStatus;
                          }).map(p => (
                            <tr key={p.appointmentId} onClick={() => setHistSel(histSel?.appointmentId === p.appointmentId ? null : p)} style={{ cursor: 'pointer', background: histSel?.appointmentId === p.appointmentId ? 'var(--accent-bg)' : '' }}>
                              <td><span style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: 14, color: 'var(--accent)' }}>{p.tokenNumber}</span></td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{p.patientName}</div>
                                <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{p.age}y · {p.gender}</div>
                              </td>
                              <td style={{ fontSize: 12, color: 'var(--txt2)' }}>{p.doctorName || '—'}</td>
                              <td><SeverityBadge level={p.severityLevel} /></td>
                              <td><ScoreRing score={p.riskScore} size={36} /></td>
                              <td style={{ fontSize: 11, color: 'var(--txt2)', maxWidth: 150 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.aiDiagnosis || '—'}</div></td>
                              <td><span className={`badge ${sevStatus(p.status)}`}>{p.status}</span></td>
                              <td style={{ fontSize: 11, color: 'var(--txt3)' }}>{p.bookingTime ? new Date(p.bookingTime).toLocaleString() : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Side Drawer Detail Panel for Clinic History */}
              {histSel && (
                <div style={{ width: 360, flexShrink: 0 }}>
                  <div className="card card-p fade-up" style={{ position: 'sticky', top: 74, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <SeverityBadge level={histSel.severityLevel} />
                        {histSel.urgencyFlag && <span className="badge b-critical"><AlertCircle size={10} />URGENT</span>}
                      </div>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setHistSel(null)}><X size={14} /></button>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: 18 }}>
                      <div className="avatar" style={{ width: 60, height: 60, fontSize: 24, margin: '0 auto 10px' }}>{histSel.patientName?.charAt(0)||'P'}</div>
                      <div style={{ fontSize: 19, fontWeight: 900 }}>{histSel.patientName}</div>
                      <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>{histSel.age}y · {histSel.gender}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)', marginTop: 6 }}>{histSel.tokenNumber}</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-around', padding: '14px 0', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 14 }}>
                      <ScoreRing score={histSel.riskScore} size={52} label="Risk" />
                      <ScoreRing score={histSel.priorityScore || 0} size={52} label="Priority" />
                    </div>

                    {histSel.aiDiagnosis && (
                      <div style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--purple-bg)', border: '1px solid var(--purple-bd)', borderRadius: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--purple)', marginBottom: 4 }}>AI Diagnosis</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt1)' }}>{histSel.aiDiagnosis}</div>
                      </div>
                    )}

                    {histSel.icdCodes && histSel.icdCodes.length > 0 && (
                      <div style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: 6 }}>ICD-10 Mapping</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {histSel.icdCodes.map((c, idx) => (
                            <div key={idx} style={{ fontSize: 12 }}>
                              <strong style={{ color: 'var(--accent)' }}>{c.code}</strong>: {c.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {histSel.symptoms && (
                      <div style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: 4 }}>Symptoms Description</div>
                        <div style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.6 }}>{histSel.symptoms}</div>
                      </div>
                    )}

                    {histSel.clinicalNotes && (
                      <div style={{ marginBottom: 14, padding: '10px 12px', background: 'var(--blue-bg)', border: '1px solid var(--blue-bd)', borderRadius: 10, fontSize: 12, color: 'var(--blue)', lineHeight: 1.6 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 4 }}>Clinical Notes</div>
                        {histSel.clinicalNotes}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[
                        { label: 'Doctor Assigned', val: histSel.doctorName || 'None' },
                        { label: 'Status', val: histSel.status },
                        { label: 'Geofence Status', val: histSel.geofenceStatus || '—' },
                        { label: 'Booking Time', val: histSel.bookingTime ? new Date(histSel.bookingTime).toLocaleString() : '—' },
                      ].map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--surface2)', borderRadius: 8 }}>
                          <span style={{ fontSize: 12, color: 'var(--txt3)' }}>{r.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── QR ── */}
          {tab === 'qr' && (
            <div style={{ maxWidth: 480 }}>
              <div className="card card-p">
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Clinic QR Code</div>
                <div style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 24 }}>Patients scan this to book an appointment at your clinic.</div>
                {profile?.qrCodeUrl ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-block', padding: 16, background: '#fff', border: '3px solid var(--accent)', borderRadius: 16, marginBottom: 20 }}>
                      <img src={profile.qrCodeUrl} alt="QR Code" style={{ width: 200, height: 200, display: 'block' }} onError={e => e.target.style.display='none'} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 14 }}>
                      Booking URL: <code style={{ color: 'var(--accent)', fontWeight: 700 }}>/patient/book/{profile.clinicId}</code>
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/patient/book/${profile.clinicId}`); flash('Link copied!') }}>
                        <Copy size={13} />Copy Link
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={genQR}><RefreshCw size={13} />Regenerate</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div className="empty" style={{ paddingBottom: 20 }}>
                      <div className="empty-icon"><QrCode size={24} color="var(--txt3)" /></div>
                      <div style={{ fontWeight: 600 }}>No QR Code Yet</div>
                      <div style={{ fontSize: 12 }}>Generate one so patients can book.</div>
                    </div>
                    <button className="btn btn-primary" onClick={genQR}><QrCode size={15} />Generate QR Code</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {tab === 'settings' && (
            <div style={{ maxWidth: 580 }}>
              <form onSubmit={saveSettings} className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Clinic Settings</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div><label className="lbl">Clinic Name</label><input className="inp" value={sName} onChange={e => setSName(e.target.value)} placeholder="My Clinic" /></div>
                  <div><label className="lbl">Email</label><input className="inp" type="email" value={sEmail} onChange={e => setSEmail(e.target.value)} /></div>
                  <div><label className="lbl">Phone</label><input className="inp" value={sPhone} onChange={e => setSPhone(e.target.value)} /></div>
                  <div><label className="lbl">Geofence Radius (m)</label><input className="inp" type="number" value={sGeo} onChange={e => setSGeo(e.target.value)} /></div>
                  <div><label className="lbl">Latitude</label><input className="inp" type="number" step="any" value={sLat} onChange={e => setSLat(e.target.value)} placeholder="28.6139" /></div>
                  <div><label className="lbl">Longitude</label><input className="inp" type="number" step="any" value={sLng} onChange={e => setSLng(e.target.value)} placeholder="77.2090" /></div>
                  <div style={{ gridColumn: '1/-1' }}><label className="lbl">New Password (leave blank to keep)</label><input className="inp" type="password" value={sPwd} onChange={e => setSPwd(e.target.value)} placeholder="••••••••" /></div>
                </div>
                {profile && (
                  <div style={{ padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', fontSize: 12, color: 'var(--txt3)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    <span><strong style={{ color: 'var(--txt2)' }}>Clinic ID:</strong> {profile.clinicId}</span>
                    <span><strong style={{ color: 'var(--txt2)' }}>Doctors:</strong> {doctors.length}</span>
                    <span><strong style={{ color: 'var(--txt2)' }}>Geofence:</strong> {profile.thresholdDistance}m</span>
                  </div>
                )}
                <div><button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Saving…' : 'Save Settings'}</button></div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, col, label, val }) {
  return (
    <div className="stat">
      <div className="stat-icon" style={{ background: col + '18', color: col }}>{icon}</div>
      <div className="stat-val">{val}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  )
}

function Msg({ type, msg, onClose }) {
  return (
    <div className={`alert ${type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 16 }}>
      {type === 'error' ? <ShieldAlert size={15} style={{ flexShrink: 0 }} /> : <Check size={15} style={{ flexShrink: 0 }} />}
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex' }}><X size={14} /></button>
    </div>
  )
}

function Loader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <RefreshCw size={24} color="var(--accent)" className="spin" />
        <div style={{ fontSize: 13, color: 'var(--txt3)' }}>Loading dashboard…</div>
      </div>
    </div>
  )
}
