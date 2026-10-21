import React, { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Clock,
  Users,
  Navigation,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  MapPin,
  AlertCircle,
  Info,
  Plus,
  Stethoscope,
  Sun,
  Moon,
} from 'lucide-react'
import api from '../utils/api'
import { useTheme } from '../context/ThemeContext'
import SeverityBadge from '../components/SeverityBadge'
import IcdCards from '../components/IcdCards'

export default function PatientTrack() {
  const { tokenNumber } = useParams()
  const { theme, toggleTheme } = useTheme()
  const [data, setData] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [locStatus, setLocStatus] = useState('prompt')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const fetchStatus = useCallback(async () => {
    try {
      const r = await api.get(`/api/appointment/track/${tokenNumber}`)
      setData(r.data)
      setLastUpdated(new Date())
      setErr('')
    } catch {
      setErr('Unable to retrieve appointment status for this token.')
    } finally {
      setLoading(false)
    }
  }, [tokenNumber])

  const sendLocation = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async pos => {
        setLocStatus('granted')
        const { latitude: lat, longitude: lng } = pos.coords
        const apptId = data?.id || data?.appointmentId || localStorage.getItem('patient_active_appt_id')
        if (apptId) {
          try {
            await api.post(`/api/appointment/location/${apptId}`, null, { params: { lat, lng } })
            fetchStatus()
          } catch {}
        }
      },
      () => setLocStatus('denied')
    )
  }, [data, fetchStatus])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    sendLocation()
    const s = setInterval(fetchStatus, 10000)
    const g = setInterval(sendLocation, 15000)
    return () => {
      clearInterval(s)
      clearInterval(g)
    }
  }, [fetchStatus, sendLocation])

  const geoInfo = s =>
    ({
      ARRIVED: {
        cls: 'alert-success',
        title: 'Checked in at clinic waiting area',
        desc: 'Your arrival within the clinic perimeter is confirmed.',
      },
      OUTSIDE_RADIUS: {
        cls: 'alert-warn',
        title: 'Currently outside clinic waiting area',
        desc: 'Please return to the clinic waiting area before your token is called.',
      },
      ABSENT: {
        cls: 'alert-error',
        title: 'Marked absent when called',
        desc: 'Please speak with clinic reception to restore your place in the queue.',
      },
      UNKNOWN: {
        cls: 'alert-info',
        title: 'Location verification pending',
        desc: 'Stay in the waiting room and listen for your token number.',
      },
    }[s] || {
      cls: 'alert-info',
      title: `Arrival status: ${s}`,
      desc: 'Please remain near the consultation area.',
    })

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
          <div style={{ fontSize: 13, color: 'var(--txt3)' }}>Loading your queue status…</div>
        </div>
      </div>
    )
  }

  const stageIndex =
    data?.status === 'COMPLETED'
      ? 4
      : data?.status === 'IN_CONSULTATION'
      ? 3
      : data?.status === 'WAITING'
      ? 2
      : 1

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 540, margin: '0 auto' }}>
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: 'var(--txt2)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={15} />
            <span>Patient Portal</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="brand-logo-mark" style={{ width: 32, height: 32 }}>
              <img src="/logo.png" alt="TriageAI Logo" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--txt1)' }}>Live Queue Status</span>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={fetchStatus}
              className="btn btn-ghost btn-icon btn-sm"
              title="Refresh queue status"
              aria-label="Refresh queue status"
            >
              <RefreshCw size={14} />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-ghost btn-icon btn-sm"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          </div>
        </header>

        {err && (
          <div className="alert alert-error" style={{ marginBottom: 16 }} role="alert">
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{err}</span>
          </div>
        )}

        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="fade-up">
            {/* Primary Token & Status Card */}
            <div className="card card-p">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--txt3)' }}>
                    Patient Visit Token
                  </div>
                  <div
                    style={{
                      fontSize: 38,
                      fontWeight: 800,
                      color: 'var(--accent)',
                      fontFamily: 'monospace',
                      lineHeight: 1.1,
                      marginTop: 2,
                    }}
                  >
                    {data.tokenNumber}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <SeverityBadge level={data.severityLevel} verbose />
                  <span style={{ fontSize: 11.5, color: 'var(--txt3)' }}>
                    {data.patientName} ({data.age}y)
                  </span>
                </div>
              </div>

              {/* Visit Progress Steps */}
              <div className="stepper" style={{ marginBottom: 18 }}>
                {[
                  { id: 1, label: 'Checked In' },
                  { id: 2, label: 'Waiting' },
                  { id: 3, label: 'With Doctor' },
                  { id: 4, label: 'Completed' },
                ].map((st, idx) => {
                  const state = stageIndex === st.id ? 'active' : stageIndex > st.id ? 'done' : ''
                  return (
                    <React.Fragment key={st.id}>
                      <div className={`step-item ${state}`}>
                        <div className="step-circle">{stageIndex > st.id ? '✓' : st.id}</div>
                        <span className="step-label">{st.label}</span>
                      </div>
                      {idx < 3 && <div className="step-line" />}
                    </React.Fragment>
                  )
                })}
              </div>

              {data.status === 'COMPLETED' ? (
                <div className="alert alert-success">
                  <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>Consultation Completed</div>
                    <div style={{ fontSize: 12.5, marginTop: 2 }}>
                      Your visit has been marked complete. Please follow your clinician&apos;s discharge or prescription instructions.
                    </div>
                  </div>
                </div>
              ) : data.status === 'IN_CONSULTATION' ? (
                <div className="alert alert-info">
                  <Stethoscope size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>Your Turn — In Consultation</div>
                    <div style={{ fontSize: 12.5, marginTop: 2 }}>
                      Please proceed to the consultation room with <strong>{data.doctorName || 'your assigned doctor'}</strong>.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid-2" style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      padding: '14px',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: 'var(--accent-bg)',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Users size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--txt3)' }}>
                        Position in Queue
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--txt1)' }}>
                        {data.queuePosition > 0 ? `#${data.queuePosition}` : 'Next'}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '14px',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: 'var(--accent-bg)',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Clock size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--txt3)' }}>
                        Estimated Wait
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--txt1)' }}>
                        {data.queuePosition > 0 ? `~${data.estimatedWaitTime} min` : 'Shortly'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {data.doctorName && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: 'var(--txt3)' }}>Assigned Clinician:</span>
                  <strong style={{ color: 'var(--txt1)' }}>{data.doctorName}</strong>
                </div>
              )}
            </div>

            {/* Arrival / Geofence Banner */}
            {data.status !== 'COMPLETED' && data.geofenceStatus && (() => {
              const g = geoInfo(data.geofenceStatus)
              return (
                <div className={`alert ${g.cls}`} style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Navigation size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 700 }}>{g.title}</div>
                      <div style={{ fontSize: 12.5, marginTop: 2 }}>{g.desc}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={sendLocation}
                    className="btn btn-ghost btn-sm"
                    style={{ flexShrink: 0 }}
                  >
                    <MapPin size={13} />
                    <span>Verify Location</span>
                  </button>
                </div>
              )
            })()}

            {/* Clinical Summary Card */}
            <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--txt1)' }}>
                Visit &amp; Assessment Summary
              </div>

              {data.symptoms && (
                <div className="clinical-sec">
                  <div className="clinical-sec-header">
                    <span>Patient-Reported Symptoms</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--txt1)', lineHeight: 1.5 }}>{data.symptoms}</div>
                </div>
              )}

              {(data.aiDiagnosis || (data.icdCodes && data.icdCodes.length > 0)) && (
                <div className="clinical-sec ai-support">
                  <div className="clinical-sec-header">
                    <span>Preliminary Triage Assessment (Decision Support)</span>
                  </div>
                  {data.aiDiagnosis && (
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--txt1)', marginBottom: 8 }}>
                      {data.aiDiagnosis}
                    </div>
                  )}
                  {data.icdCodes && data.icdCodes.length > 0 && <IcdCards icdCodes={data.icdCodes} />}
                </div>
              )}

              <div className="clinical-disclaimer">
                <Info size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 5 }} />
                Wait times are estimates and may adjust if a patient with a critical medical need arrives.
                {lastUpdated && (
                  <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: 'var(--txt3)' }}>
                    Status automatically updates every 10 seconds (Last checked: {lastUpdated.toLocaleTimeString()}).
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {!data && !loading && (
          <div className="card card-p" style={{ textAlign: 'center' }}>
            <div className="empty">
              <div className="empty-icon">
                <AlertCircle size={22} />
              </div>
              <div style={{ fontWeight: 700, color: 'var(--txt1)', fontSize: 15 }}>Queue Token Not Found</div>
              <div style={{ fontSize: 13, maxWidth: 320 }}>
                No active or past appointment was found for token <strong>{tokenNumber}</strong>. Please check your token code or return to the Patient Portal.
              </div>
              <Link to="/" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', marginTop: 6 }}>
                Return to Patient Portal
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
