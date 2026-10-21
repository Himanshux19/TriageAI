import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Mic,
  MicOff,
  CheckCircle2,
  ShieldAlert,
  User,
  Mail,
  MapPin,
  ArrowRight,
  Clock,
  AlertCircle,
  Info,
  Moon,
  Sun,
} from 'lucide-react'
import api from '../utils/api'
import { useTheme } from '../context/ThemeContext'
import SeverityBadge from '../components/SeverityBadge'
import ScoreRing from '../components/ScoreRing'
import IcdCards from '../components/IcdCards'

export default function PatientBook() {
  const { clinicId } = useParams()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [docList, setDocList] = useState([])
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('MALE')
  const [email, setEmail] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [prefDoc, setPrefDoc] = useState('')
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const [locStatus, setLocStatus] = useState('prompt')
  const [recording, setRecording] = useState(false)
  const [recSecs, setRecSecs] = useState(0)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [booked, setBooked] = useState(null)
  const mrRef = useRef()
  const streamRef = useRef()
  const timerRef = useRef()
  const chunksRef = useRef([])

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setLocStatus('granted')
      },
      () => setLocStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
    api
      .get(`/api/appointment/doctors/${clinicId}`)
      .then(r => setDocList(r.data || []))
      .catch(() => {})
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [clinicId])

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const mr = new MediaRecorder(stream, { mimeType: mime })
      mrRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mime })
        const reader = new FileReader()
        reader.onloadend = async () => {
          const b64 = reader.result.split(',')[1]
          try {
            const { data } = await api.post('/api/appointment/transcribe', {
              audio: b64,
              mimeType: mime,
            })
            if (data) setSymptoms(s => (s ? s + ' ' + data : data))
          } catch {}
        }
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      setRecording(true)
      setRecSecs(0)
      timerRef.current = setInterval(() => setRecSecs(s => s + 1), 1000)
    } catch {
      setErr('Microphone access denied.')
    }
  }

  const stopRec = () => {
    if (mrRef.current && recording) {
      mrRef.current.stop()
      setRecording(false)
      clearInterval(timerRef.current)
    }
  }

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      const { data } = await api.post('/api/appointment/book', {
        clinicId,
        patientName: name,
        age: parseInt(age, 10),
        gender,
        email: email || null,
        symptoms,
        preferredDoctorId: prefDoc || null,
        latitude: lat,
        longitude: lng,
      })
      localStorage.setItem('patient_active_appt_id', data.id || data.appointmentId || '')
      setBooked(data)
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Booking failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (booked) {
    const icdCodes = booked.icdCodes || []
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 480 }} className="fade-up">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 64,
                height: 64,
                background: 'var(--green-bg)',
                border: '1px solid var(--green-bd)',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <CheckCircle2 size={32} color="var(--green)" />
            </div>
            <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--txt1)', marginBottom: 6 }}>
              You&apos;re in the queue!
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--txt3)' }}>
              Your appointment has been confirmed. Track your position below.
            </div>
          </div>

          <div className="card card-p" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Token', val: booked.tokenNumber, big: true, col: 'var(--accent)' },
                { label: 'Position', val: `#${booked.queuePosition}` },
                { label: 'Est. Wait', val: `${booked.estimatedWaitTime}m` },
              ].map(r => (
                <div
                  key={r.label}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                      color: 'var(--txt3)',
                      marginBottom: 4,
                    }}
                  >
                    {r.label}
                  </div>
                  <div
                    style={{
                      fontSize: r.big ? 28 : 20,
                      fontWeight: 800,
                      color: r.col || 'var(--txt1)',
                      lineHeight: 1,
                    }}
                  >
                    {r.val}
                  </div>
                </div>
              ))}
              <div
                style={{
                  padding: '12px 14px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ScoreRing score={booked.riskScore || 0} size={52} label="Risk Score" />
              </div>
            </div>

            {booked.severityLevel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <SeverityBadge level={booked.severityLevel} />
                {booked.urgencyFlag && (
                  <span className="badge b-critical">
                    <AlertCircle size={11} />
                    <span>Urgent — Please stay close</span>
                  </span>
                )}
              </div>
            )}

            {booked.aiDiagnosis && (
              <div
                style={{
                  padding: '10px 12px',
                  background: 'var(--accent-bg)',
                  border: '1px solid var(--accent-bd)',
                  borderRadius: 8,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--accent)',
                    marginBottom: 3,
                  }}
                >
                  AI Preliminary Assessment
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt1)' }}>
                  {booked.aiDiagnosis}
                </div>
              </div>
            )}

            {icdCodes.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--txt3)',
                    marginBottom: 6,
                  }}
                >
                  ICD-10 Codes
                </div>
                <IcdCards icdCodes={icdCodes} />
              </div>
            )}

            {booked.doctorName && (
              <div
                style={{
                  padding: '10px 12px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--txt3)',
                    marginBottom: 2,
                  }}
                >
                  Assigned Doctor
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--txt1)' }}>
                  {booked.doctorName}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate(`/patient/track/${booked.tokenNumber}`)}
            className="btn btn-primary btn-full btn-lg"
            style={{ marginBottom: 10 }}
          >
            <Clock size={16} />
            <span>Track My Position</span>
            <ArrowRight size={15} />
          </button>
          <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--txt3)' }}>
            Please stay within the clinic premises. GPS tracking is active.
          </div>
        </div>
      </div>
    )
  }

  const locBg =
    locStatus === 'granted'
      ? 'var(--green-bg)'
      : locStatus === 'denied'
      ? 'var(--red-bg)'
      : 'var(--surface2)'
  const locBd =
    locStatus === 'granted'
      ? 'var(--green-bd)'
      : locStatus === 'denied'
      ? 'var(--red-bd)'
      : 'var(--border)'
  const locCol =
    locStatus === 'granted'
      ? 'var(--green)'
      : locStatus === 'denied'
      ? 'var(--red)'
      : 'var(--txt3)'
  const locText =
    locStatus === 'granted'
      ? `GPS active (${lat?.toFixed(4)}, ${lng?.toFixed(4)})`
      : locStatus === 'denied'
      ? 'Location denied — geofencing unavailable'
      : 'Requesting GPS location…'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 540, margin: '0 auto' }} className="fade-up">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 22,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div className="brand-logo-mark" style={{ width: 38, height: 38 }}>
              <img src="/logo.png" alt="TriageAI Logo" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--txt1)', lineHeight: 1.1 }}>
                Book Appointment
              </div>
              <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>
                AI-Powered Triage · Clinic {clinicId}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>

        {/* GPS Banner */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 16,
            background: locBg,
            border: `1px solid ${locBd}`,
            color: locCol,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12.5,
            fontWeight: 500,
          }}
        >
          <MapPin size={14} style={{ flexShrink: 0 }} />
          <span>{locText}</span>
        </div>

        {err && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <ShieldAlert size={15} style={{ flexShrink: 0 }} />
            <span>{err}</span>
          </div>
        )}

        <form
          onSubmit={submit}
          className="card card-p"
          style={{ display: 'flex', flexDirection: 'column', gap: 15, boxShadow: 'var(--shadow-sm)' }}
        >
          <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--txt1)', marginBottom: 2 }}>
            Patient Information
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="lbl">Full Name *</label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--txt3)',
                    pointerEvents: 'none',
                    display: 'flex',
                  }}
                >
                  <User size={14} />
                </div>
                <input
                  className="inp inp-icon"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
            </div>
            <div>
              <label className="lbl">Age *</label>
              <input
                className="inp"
                type="number"
                required
                min={1}
                max={120}
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="25"
              />
            </div>
            <div>
              <label className="lbl">Gender *</label>
              <select className="inp" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="lbl">Email (for confirmation)</label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--txt3)',
                    pointerEvents: 'none',
                    display: 'flex',
                  }}
                >
                  <Mail size={14} />
                </div>
                <input
                  className="inp inp-icon"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>

          {docList.length > 0 && (
            <div>
              <label className="lbl">Preferred Doctor (optional)</label>
              <select className="inp" value={prefDoc} onChange={e => setPrefDoc(e.target.value)}>
                <option value="">No preference — auto-assign</option>
                {docList.map(d => (
                  <option key={d.doctorId} value={d.doctorId}>
                    Dr. {d.name} — {d.specialization}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="lbl">Describe Your Symptoms *</label>
            <textarea
              className="inp"
              required
              value={symptoms}
              onChange={e => setSymptoms(e.target.value)}
              placeholder="Describe what you're experiencing in as much detail as possible. Include: when it started, severity (1-10), any other symptoms…"
              style={{ minHeight: 110 }}
            />
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              {!recording ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={startRec}>
                  <Mic size={13} />
                  <span>Record voice</span>
                </button>
              ) : (
                <button type="button" className="btn btn-sm btn-danger" onClick={stopRec}>
                  <MicOff size={13} />
                  <span>Stop ({recSecs}s)</span>
                </button>
              )}
              {recording && (
                <span
                  style={{
                    fontSize: 11.5,
                    color: 'var(--red)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      background: 'var(--red)',
                      borderRadius: '50%',
                    }}
                    className="pulse-anim"
                  />
                  <span>Recording…</span>
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              background: 'var(--accent-bg)',
              borderRadius: 8,
              border: '1px solid var(--accent-bd)',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <Info size={15} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12.5, color: 'var(--txt2)', lineHeight: 1.55 }}>
              Our AI analyzes your symptoms to assign an <strong>ICD-10 diagnosis</strong> and{' '}
              <strong>triage priority</strong>. Critical cases are seen first regardless of arrival time.
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg">
            {loading ? (
              'Analyzing symptoms & booking…'
            ) : (
              <>
                <span>Book Appointment</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
