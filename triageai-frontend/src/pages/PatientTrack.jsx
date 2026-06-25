import React, { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Activity, Clock, Users, Navigation, ArrowLeft, RefreshCw, CheckCircle2, MapPin, AlertCircle, Info, Plus } from 'lucide-react'
import api from '../utils/api'
import SeverityBadge from '../components/SeverityBadge'
import ScoreRing from '../components/ScoreRing'
import IcdCards from '../components/IcdCards'

export default function PatientTrack() {
  const { tokenNumber } = useParams()
  const [data, setData] = useState(null)
  const [gpsLog, setGpsLog] = useState([])
  const [locStatus, setLocStatus] = useState('prompt')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const fetchStatus = useCallback(async () => {
    try { const r = await api.get(`/api/appointment/track/${tokenNumber}`); setData(r.data); setErr('') }
    catch { setErr('Could not load tracking data.') }
    finally { setLoading(false) }
  }, [tokenNumber])

  const sendLocation = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async pos => {
      setLocStatus('granted')
      const { latitude: lat, longitude: lng } = pos.coords
      const apptId = data?.id || data?.appointmentId || localStorage.getItem('patient_active_appt_id')
      if (apptId) {
        try {
          await api.post(`/api/appointment/location/${apptId}`, null, { params: { lat, lng } })
          setGpsLog(prev => [{ time: new Date().toLocaleTimeString(), lat: lat.toFixed(5), lng: lng.toFixed(5) }, ...prev.slice(0, 4)])
          fetchStatus()
        } catch {}
      }
    }, () => setLocStatus('denied'))
  }, [data, fetchStatus])

  useEffect(() => { fetchStatus() }, [fetchStatus])
  useEffect(() => {
    sendLocation()
    const s = setInterval(fetchStatus, 10000)
    const g = setInterval(sendLocation, 15000)
    return () => { clearInterval(s); clearInterval(g) }
  }, [])

  const geoStyle = s => ({
    ARRIVED:        { bg: 'var(--green-bg)',  bd: 'var(--green-bd)',  col: 'var(--green)',  txt: 'Inside clinic zone ✓' },
    OUTSIDE_RADIUS: { bg: 'var(--orange-bg)', bd: 'var(--orange-bd)', col: 'var(--orange)', txt: 'Outside clinic radius — please return' },
    ABSENT:         { bg: 'var(--red-bg)',    bd: 'var(--red-bd)',    col: 'var(--red)',    txt: 'Marked absent' },
    UNKNOWN:        { bg: 'var(--surface2)',  bd: 'var(--border)',    col: 'var(--txt3)',   txt: 'Location unknown' },
  }[s] || { bg: 'var(--surface2)', bd: 'var(--border)', col: 'var(--txt3)', txt: s })

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <RefreshCw size={24} color="var(--accent)" className="spin" />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 460, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--txt2)', textDecoration: 'none', fontWeight: 600 }}>
            <ArrowLeft size={15} />Back
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} color="white" strokeWidth={3.5} /></div>
            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--txt1)' }}>TriageAI Tracker</span>
          </div>
          <button onClick={fetchStatus} style={{ width: 32, height: 32, background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--txt2)' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {err && <div className="alert alert-error" style={{ marginBottom: 16 }}><AlertCircle size={15} style={{ flexShrink: 0 }} /><span>{err}</span></div>}

        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="fade-up">
            {/* Main token card */}
            <div className="card card-p" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-bg)', padding: '4px 10px', borderRadius: 20, border: '1px solid var(--accent)30' }}>
                <span style={{ width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} className="pulse-anim" />LIVE
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--txt3)', marginBottom: 6 }}>Queue Token</div>
              <div style={{ fontSize: 56, fontWeight: 900, color: 'var(--txt1)', lineHeight: 1, fontFamily: 'monospace', letterSpacing: '.05em', marginBottom: 12 }}>{data.tokenNumber}</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
                <SeverityBadge level={data.severityLevel} />
                {data.urgencyFlag && <span className="badge b-critical"><AlertCircle size={10} />URGENT</span>}
              </div>

              {data.status !== 'COMPLETED' ? (
                <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', color: 'var(--accent)' }}><Users size={20} /></div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Position</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--txt1)', marginTop: 3 }}>{data.queuePosition > 0 ? `#${data.queuePosition}` : '—'}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', color: 'var(--accent)' }}><Clock size={20} /></div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Est. Wait</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent)', marginTop: 3 }}>{data.queuePosition > 0 ? `${data.estimatedWaitTime}m` : 'Now'}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <ScoreRing score={data.riskScore || 0} size={52} label="Risk" />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px', background: 'var(--green-bg)', border: '1px solid var(--green-bd)', borderRadius: 12, color: 'var(--green)' }}>
                  <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Consultation Complete</div>
                    <div style={{ fontSize: 12, opacity: .8 }}>Thank you for visiting. Please take care!</div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Assessment */}
            {(data.aiDiagnosis || (data.icdCodes && data.icdCodes.length > 0)) && (
              <div className="card card-p">
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt2)', marginBottom: 10 }}>AI Clinical Assessment</div>
                {data.aiDiagnosis && (
                  <div style={{ marginBottom: 10, padding: '10px 12px', background: 'var(--purple-bg)', border: '1px solid var(--purple-bd)', borderRadius: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--purple)', marginBottom: 3 }}>Preliminary Diagnosis</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt1)' }}>{data.aiDiagnosis}</div>
                  </div>
                )}
                {data.icdCodes && data.icdCodes.length > 0 && <IcdCards icdCodes={data.icdCodes} />}
                {data.clinicalNotes && (
                  <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--blue-bg)', border: '1px solid var(--blue-bd)', borderRadius: 10, fontSize: 12, color: 'var(--blue)', lineHeight: 1.6, display: 'flex', gap: 8 }}>
                    <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />{data.clinicalNotes}
                  </div>
                )}
              </div>
            )}

            {/* Geofence */}
            {data.status !== 'COMPLETED' && data.geofenceStatus && (() => {
              const gs = geoStyle(data.geofenceStatus)
              return (
                <div style={{ padding: '12px 14px', borderRadius: 10, background: gs.bg, border: `1px solid ${gs.bd}`, color: gs.col, display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, fontWeight: 500 }}>
                  <Navigation size={15} style={{ flexShrink: 0 }} />{gs.txt}
                </div>
              )
            })()}

            {/* GPS Log */}
            {data.status !== 'COMPLETED' && (
              <div className="card card-p">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} color="var(--accent)" />GPS Pings
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: locStatus === 'granted' ? 'var(--green-bg)' : 'var(--red-bg)', color: locStatus === 'granted' ? 'var(--green)' : 'var(--red)', border: `1px solid ${locStatus === 'granted' ? 'var(--green-bd)' : 'var(--red-bd)'}` }}>
                    {locStatus === 'granted' ? 'Active' : 'Blocked'}
                  </span>
                </div>
                {gpsLog.length === 0
                  ? <div style={{ fontSize: 12, color: 'var(--txt3)', fontStyle: 'italic' }}>Awaiting first GPS sync…</div>
                  : gpsLog.map((l, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--surface2)', borderRadius: 7, marginBottom: 4, fontSize: 11, fontFamily: 'monospace', color: 'var(--txt2)' }}>
                      <span style={{ color: 'var(--txt3)' }}>{l.time}</span>
                      <span>{l.lat}, {l.lng}</span>
                      <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}

        {!data && !loading && (
          <div className="card card-p" style={{ textAlign: 'center' }}>
            <div className="empty">
              <div className="empty-icon"><AlertCircle size={24} color="var(--txt3)" /></div>
              <div style={{ fontWeight: 600 }}>Token Not Found</div>
              <div style={{ fontSize: 12 }}>No appointment found for token <strong>{tokenNumber}</strong>.</div>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--txt3)' }}>© {new Date().getFullYear()} TriageAI · All rights reserved</div>
      </div>
    </div>
  )
}
