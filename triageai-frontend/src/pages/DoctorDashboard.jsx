import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Users, User, LogOut, RefreshCw, CheckCircle2, X, ArrowRight, Stethoscope, AlertCircle, Clock, ShieldAlert, Check, Camera, ChevronRight, Info } from 'lucide-react'
import api from '../utils/api'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import SeverityBadge from '../components/SeverityBadge'
import ScoreRing from '../components/ScoreRing'
import IcdCards from '../components/IcdCards'

const NAV = [
  { id: 'overview', label: 'Overview',      icon: Activity },
  { id: 'queue',    label: 'Patient Queue', icon: Users },
  { id: 'history',  label: 'Patient History', icon: Clock },
  { id: 'profile',  label: 'My Profile',    icon: User },
]

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [slim, setSlim] = useState(false)
  const [queue, setQueue] = useState([])
  const [sel, setSel] = useState(null)
  const [doc, setDoc] = useState(null)
  const [avail, setAvail] = useState('AVAILABLE')
  const [time, setTime] = useState(new Date())
  const [search, setSearch] = useState('')
  const [sevF, setSevF] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)

  // Profile form
  const [pName, setPName] = useState(''); const [pSpec, setPSpec] = useState(''); const [pExp, setPExp] = useState(''); const [pPwd, setPPwd] = useState(''); const [pPhoto, setPPhoto] = useState('')
  const fileRef = useRef()

  // Patient History states
  const [history, setHistory] = useState([])
  const [histSel, setHistSel] = useState(null)
  const [histSearch, setHistSearch] = useState('')
  const [histSevFilter, setHistSevFilter] = useState('ALL')
  const [histStatusFilter, setHistStatusFilter] = useState('ALL')

  const logout = () => { ['triageai_token','triageai_role','triageai_id'].forEach(k => localStorage.removeItem(k)); navigate('/') }
  const flash = (msg, isErr = false) => { isErr ? setErr(msg) : setOk(msg); setTimeout(() => isErr ? setErr('') : setOk(''), 4000) }

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/api/doctor/profile')
      setDoc(data); setAvail(data.availabilityStatus || 'AVAILABLE')
      setPName(data.name || ''); setPSpec(data.specialization || ''); setPExp(data.experienceYears || ''); setPPhoto(data.profilePhoto || '')
    } catch { logout() }
  }, [])

  const loadQueue = useCallback(async () => {
    try {
      const { data } = await api.get('/api/doctor/queue')
      setQueue(data || [])
      if (sel) { const u = data.find(p => p.appointmentId === sel.appointmentId); if (u) setSel(u) }
    } catch (e) {
      if (e.response?.status === 401) logout()
    } finally { setLoading(false) }
  }, [sel])

  const loadHistory = useCallback(async () => {
    try {
      const { data } = await api.get('/api/doctor/history')
      setHistory(data || [])
    } catch {}
  }, [])

  useEffect(() => { loadProfile(); loadQueue() }, [])
  useEffect(() => {
    if (tab === 'queue') { const t = setInterval(loadQueue, 10000); return () => clearInterval(t) }
    if (tab === 'history') { loadHistory() }
  }, [tab, loadQueue, loadHistory])
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])

  const toggleAvail = async () => {
    const next = avail === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE'
    try { await api.put('/api/doctor/availability', null, { params: { status: next } }); setAvail(next); flash(`Status: ${next.toLowerCase()}`) }
    catch { flash('Failed to update.', true) }
  }

  const callNext = async () => {
    setBusy(true)
    try { await api.post('/api/doctor/call-next'); await loadQueue(); flash('Next patient called.') }
    catch { flash('No patients available.', true) }
    finally { setBusy(false) }
  }

  const complete = async id => {
    try { await api.put(`/api/doctor/complete/${id}`); setSel(null); await loadQueue(); flash('Consultation completed.') }
    catch { flash('Failed.', true) }
  }

  const markAbsent = async id => {
    try { await api.put(`/api/doctor/mark-absent/${id}`); setSel(null); await loadQueue(); flash('Patient marked absent.') }
    catch { flash('Failed.', true) }
  }

  const saveProfile = async e => {
    e.preventDefault(); setBusy(true)
    try {
      await api.put('/api/doctor/profile', { name: pName, specialization: pSpec, experienceYears: parseInt(pExp), profilePhoto: pPhoto || null, password: pPwd || null })
      setPPwd(''); flash('Profile updated.'); await loadProfile()
    } catch { flash('Save failed.', true) }
    finally { setBusy(false) }
  }

  const onPhoto = e => {
    const f = e.target.files[0]; if (!f) return
    const r = new FileReader(); r.onload = ev => setPPhoto(ev.target.result); r.readAsDataURL(f)
  }

  const active = queue.find(p => p.status === 'IN_CONSULTATION')
  const waiting = queue.filter(p => !['IN_CONSULTATION','COMPLETED','ABSENT'].includes(p.status))
  const filtered = waiting
    .filter(p => sevF === 'ALL' || p.severityLevel === sevF)
    .filter(p => !search || p.patientName?.toLowerCase().includes(search.toLowerCase()) || p.tokenNumber?.toLowerCase().includes(search.toLowerCase()))

  const navItems = NAV.map(n => n.id === 'queue' ? { ...n, badge: waiting.length } : n)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <RefreshCw size={24} color="var(--accent)" className="spin" />
    </div>
  )

  return (
    <div className="shell">
      <Sidebar
        items={navItems} active={tab} onSelect={setTab} collapsed={slim} setCollapsed={setSlim}
        profileSlot={doc && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            {pPhoto ? <img src={pPhoto} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} alt="" />
              : <div className="avatar" style={{ width: 34, height: 34, fontSize: 13 }}>{doc.name?.charAt(0) || 'D'}</div>}
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
              <div style={{ fontSize: 10, color: 'var(--sidebar-txt)' }}>{doc.specialization}</div>
            </div>
          </div>
        )}
        bottomItems={[{ id: 'logout', label: 'Sign Out', icon: LogOut, color: '#EF4444', onClick: logout }]}
      />
      <div className={`main${slim ? ' slim' : ''}`}>
        <Topbar
          title={NAV.find(n => n.id === tab)?.label}
          subtitle={time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          onToggleSidebar={() => setSlim(s => !s)}
          onRefresh={() => { loadQueue(); loadHistory(); loadProfile() }}
          extra={
            <button onClick={toggleAvail} className={`btn btn-sm ${avail === 'AVAILABLE' ? 'btn-success' : 'btn-ghost'}`} style={{ fontSize: 12 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: avail === 'AVAILABLE' ? 'var(--green)' : 'var(--txt3)', display: 'inline-block' }} />
              {avail === 'AVAILABLE' ? 'Available' : 'Unavailable'}
            </button>
          }
        />
        <div className="page-body">
          {err && <div className="alert alert-error" style={{ marginBottom: 16 }}><ShieldAlert size={15} style={{ flexShrink: 0 }} /><span style={{ flex: 1 }}>{err}</span><button onClick={() => setErr('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}><X size={14} /></button></div>}
          {ok  && <div className="alert alert-success" style={{ marginBottom: 16 }}><Check size={15} style={{ flexShrink: 0 }} /><span>{ok}</span></div>}

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                <div className="stat"><div className="stat-icon" style={{ background: '#3B5BDB18', color: '#3B5BDB' }}><Users size={18} /></div><div className="stat-val">{waiting.length}</div><div className="stat-lbl">Waiting</div></div>
                <div className="stat"><div className="stat-icon" style={{ background: '#DC262618', color: '#DC2626' }}><AlertCircle size={18} /></div><div className="stat-val">{queue.filter(p => p.severityLevel === 'CRITICAL').length}</div><div className="stat-lbl">Critical</div></div>
                <div className="stat"><div className="stat-icon" style={{ background: '#05966918', color: '#059669' }}><CheckCircle2 size={18} /></div><div className="stat-val">{queue.filter(p => p.status === 'COMPLETED').length}</div><div className="stat-lbl">Completed</div></div>
                <div className="stat"><div className="stat-icon" style={{ background: '#D9770618', color: '#D97706' }}><Clock size={18} /></div><div className="stat-val">{waiting.length > 0 ? Math.round(waiting.reduce((s,p) => s + (p.estimatedWaitTime||0), 0)/waiting.length) : 0}m</div><div className="stat-lbl">Avg Wait</div></div>
              </div>

              {/* Active consultation */}
              {active ? (
                <div className="card card-p" style={{ border: '2px solid var(--accent)', boxShadow: '0 0 0 4px var(--accent-glow)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span style={{ width: 8, height: 8, background: '#059669', borderRadius: '50%' }} className="pulse-anim" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '.06em' }}>In Consultation</span>
                    <span style={{ marginLeft: 'auto' }}><SeverityBadge level={active.severityLevel} /></span>
                    {active.urgencyFlag && <span className="badge b-critical"><AlertCircle size={10} />URGENT</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div className="avatar" style={{ width: 56, height: 56, fontSize: 22, flexShrink: 0 }}>{active.patientName?.charAt(0) || 'P'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--txt1)', marginBottom: 2 }}>{active.patientName}</div>
                      <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 12 }}>{active.age}y · {active.gender} · Token <strong style={{ color: 'var(--accent)' }}>{active.tokenNumber}</strong></div>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
                        <ScoreRing score={active.riskScore} size={52} label="Risk" />
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--txt3)', marginBottom: 4 }}>AI Diagnosis</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt1)', marginBottom: 8 }}>{active.aiDiagnosis || 'Pending'}</div>
                          <IcdCards icdCodes={[]} />
                        </div>
                      </div>
                      {active.symptoms && (
                        <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, color: 'var(--txt2)', lineHeight: 1.6, marginBottom: 14 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: 4 }}>Symptoms</div>
                          {active.symptoms}
                        </div>
                      )}
                      {active.clinicalNotes && (
                        <div style={{ padding: '10px 12px', background: 'var(--blue-bg)', border: '1px solid var(--blue-bd)', borderRadius: 10, fontSize: 12, color: 'var(--blue)', lineHeight: 1.6, marginBottom: 14, display: 'flex', gap: 8 }}>
                          <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />{active.clinicalNotes}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => complete(active.appointmentId)} className="btn btn-primary"><CheckCircle2 size={15} />Complete</button>
                        <button onClick={() => markAbsent(active.appointmentId)} className="btn btn-danger"><X size={15} />Mark Absent</button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card card-p" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{ width: 52, height: 52, background: 'var(--accent-bg)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}><Stethoscope size={24} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>No Active Consultation</div>
                    <div style={{ fontSize: 13, color: 'var(--txt3)' }}>Call the next patient from the queue when ready.</div>
                  </div>
                  <button onClick={callNext} disabled={busy || waiting.length === 0} className="btn btn-primary">
                    {busy ? 'Calling…' : <><span>Call Next</span><ArrowRight size={15} /></>}
                  </button>
                </div>
              )}

              {/* Next up */}
              {waiting.slice(0, 4).length > 0 && (
                <div className="card">
                  <div style={{ padding: '13px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14 }}>Next Up</div>
                  {waiting.slice(0, 4).map((p, i) => (
                    <div key={p.appointmentId} onClick={() => { setSel(p); setTab('queue') }}
                      style={{ display: 'flex', alignItems: 'center', padding: '11px 20px', borderBottom: i < 3 ? '1px solid var(--border2)' : 'none', gap: 12, cursor: 'pointer', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--txt3)', width: 22 }}>#{i+1}</span>
                      <div className="avatar" style={{ width: 34, height: 34, fontSize: 13 }}>{p.patientName?.charAt(0)||'P'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.patientName}</div>
                        <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{p.age}y · {p.tokenNumber}</div>
                      </div>
                      <SeverityBadge level={p.severityLevel} />
                      <ScoreRing score={p.riskScore} size={36} />
                      <ChevronRight size={15} color="var(--txt3)" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── QUEUE TAB ── */}
          {tab === 'queue' && (
            <div style={{ display: 'flex', gap: 18 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="card">
                  <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input className="inp" style={{ flex: 1, minWidth: 160 }} placeholder="Search name or token…" value={search} onChange={e => setSearch(e.target.value)} />
                    <select className="inp" style={{ width: 140 }} value={sevF} onChange={e => setSevF(e.target.value)}>
                      <option value="ALL">All Severity</option>
                      {['CRITICAL','HIGH','MEDIUM','LOW'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={loadQueue}><RefreshCw size={14} /></button>
                  </div>
                  {filtered.length === 0
                    ? <div className="empty"><div className="empty-icon"><Users size={22} color="var(--txt3)" /></div><div style={{ fontWeight: 600 }}>No patients</div></div>
                    : filtered.map(p => (
                      <div key={p.appointmentId} onClick={() => setSel(sel?.appointmentId === p.appointmentId ? null : p)}
                        style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid var(--border2)', gap: 10, cursor: 'pointer', background: sel?.appointmentId === p.appointmentId ? 'var(--accent-bg)' : '', transition: 'background .15s' }}>
                        <span className={`dot dot-${(p.severityLevel||'low').toLowerCase()}`} />
                        <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>{p.patientName?.charAt(0)||'P'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.patientName}</div>
                          <div style={{ fontSize: 11, color: 'var(--txt3)' }}>#{p.tokenNumber} · {p.age}y</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <SeverityBadge level={p.severityLevel} />
                          <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{p.estimatedWaitTime}m</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Detail panel */}
              {sel && (
                <div style={{ width: 360, flexShrink: 0 }}>
                  <div className="card card-p fade-up" style={{ position: 'sticky', top: 74, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <SeverityBadge level={sel.severityLevel} />
                        {sel.urgencyFlag && <span className="badge b-critical"><AlertCircle size={10} />URGENT</span>}
                      </div>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSel(null)}><X size={14} /></button>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: 18 }}>
                      <div className="avatar" style={{ width: 60, height: 60, fontSize: 24, margin: '0 auto 10px' }}>{sel.patientName?.charAt(0)||'P'}</div>
                      <div style={{ fontSize: 19, fontWeight: 900 }}>{sel.patientName}</div>
                      <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>{sel.age}y · {sel.gender}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)', marginTop: 6 }}>{sel.tokenNumber}</div>
                    </div>

                    {/* Scores */}
                    <div style={{ display: 'flex', justifyContent: 'space-around', padding: '14px 0', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 14 }}>
                      <ScoreRing score={sel.riskScore} size={52} label="Risk" />
                      <ScoreRing score={sel.priorityScore || 0} size={52} label="Priority" />
                    </div>

                    {/* ICD / Diagnosis */}
                    {sel.aiDiagnosis && (
                      <div style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--purple-bg)', border: '1px solid var(--purple-bd)', borderRadius: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--purple)', marginBottom: 4 }}>AI Diagnosis</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt1)' }}>{sel.aiDiagnosis}</div>
                      </div>
                    )}

                    {sel.extractedSymptoms && (
                      <div style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: 6 }}>Extracted Symptoms</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {sel.extractedSymptoms.split(',').map((s, i) => <span key={i} className="badge b-neutral" style={{ fontSize: 11 }}>{s.trim()}</span>)}
                        </div>
                      </div>
                    )}

                    {sel.symptoms && (
                      <div style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: 4 }}>Patient Description</div>
                        <div style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.6 }}>{sel.symptoms}</div>
                      </div>
                    )}

                    {sel.clinicalNotes && (
                      <div style={{ marginBottom: 14, padding: '10px 12px', background: 'var(--blue-bg)', border: '1px solid var(--blue-bd)', borderRadius: 10, fontSize: 12, color: 'var(--blue)', lineHeight: 1.6, display: 'flex', gap: 8 }}>
                        <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />{sel.clinicalNotes}
                      </div>
                    )}

                    {/* Details grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                      {[
                        { label: 'Position', val: `#${sel.queuePosition}` },
                        { label: 'Est. Wait', val: `${sel.estimatedWaitTime}m` },
                        { label: 'Recommended', val: sel.recommendedAction?.replace(/_/g,' ') || '—' },
                      ].map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--surface2)', borderRadius: 8 }}>
                          <span style={{ fontSize: 12, color: 'var(--txt3)' }}>{r.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{r.val}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {sel.status !== 'IN_CONSULTATION' && sel.status !== 'COMPLETED' && (
                        <button onClick={callNext} disabled={busy} className="btn btn-primary btn-full"><Stethoscope size={15} />Call to Consultation</button>
                      )}
                      {sel.status === 'IN_CONSULTATION' && (
                        <>
                          <button onClick={() => complete(sel.appointmentId)} className="btn btn-success btn-full"><CheckCircle2 size={15} />Complete</button>
                          <button onClick={() => markAbsent(sel.appointmentId)} className="btn btn-danger btn-full"><X size={15} />Mark Absent</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                              <td><SeverityBadge level={p.severityLevel} /></td>
                              <td><ScoreRing score={p.riskScore} size={36} /></td>
                              <td style={{ fontSize: 11, color: 'var(--txt2)', maxWidth: 180 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.aiDiagnosis || '—'}</div></td>
                              <td><span className={`badge ${p.status === 'COMPLETED' ? 'b-low' : p.status === 'ABSENT' ? 'b-critical' : 'b-neutral'}`}>{p.status}</span></td>
                              <td style={{ fontSize: 11, color: 'var(--txt3)' }}>{p.bookingTime ? new Date(p.bookingTime).toLocaleString() : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Side Drawer Detail Panel for Doctor History */}
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

          {/* ── PROFILE ── */}
          {tab === 'profile' && (
            <div style={{ maxWidth: 520 }}>
              <form onSubmit={saveProfile} className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>My Profile</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ position: 'relative' }}>
                    {pPhoto ? <img src={pPhoto} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} alt="" />
                      : <div className="avatar" style={{ width: 72, height: 72, fontSize: 28, border: '3px solid var(--border)' }}>{doc?.name?.charAt(0)||'D'}</div>}
                    <button type="button" onClick={() => fileRef.current?.click()}
                      style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, background: 'var(--accent)', border: '2px solid white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Camera size={12} color="white" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{doc?.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--txt3)', marginTop: 2 }}>{doc?.doctorId}</div>
                    <div style={{ fontSize: 13, color: 'var(--txt2)' }}>{doc?.specialization}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div><label className="lbl">Full Name</label><input className="inp" value={pName} onChange={e => setPName(e.target.value)} /></div>
                  <div><label className="lbl">Specialization</label><input className="inp" value={pSpec} onChange={e => setPSpec(e.target.value)} /></div>
                  <div><label className="lbl">Experience (years)</label><input className="inp" type="number" min={0} value={pExp} onChange={e => setPExp(e.target.value)} /></div>
                  <div><label className="lbl">New Password</label><input className="inp" type="password" value={pPwd} onChange={e => setPPwd(e.target.value)} placeholder="Leave blank to keep" /></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <div><div style={{ fontSize: 13, fontWeight: 600 }}>Availability</div><div style={{ fontSize: 12, color: 'var(--txt3)' }}>Toggle to accept or pause patients</div></div>
                  <button type="button" onClick={toggleAvail} className={`btn btn-sm ${avail === 'AVAILABLE' ? 'btn-success' : 'btn-ghost'}`}>{avail === 'AVAILABLE' ? '● Available' : '○ Unavailable'}</button>
                </div>
                <button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Saving…' : 'Save Profile'}</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
