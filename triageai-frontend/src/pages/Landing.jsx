import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Stethoscope,
  Building2,
  Plus,
  ArrowRight,
  KeyRound,
  User,
  Mail,
  Moon,
  Sun,
  ShieldAlert,
  Check,
  Eye,
  EyeOff,
  Heart,
} from 'lucide-react'
import api from '../utils/api'
import { useTheme } from '../context/ThemeContext'

export default function Landing() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [tab, setTab] = useState('doctor')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotRole, setForgotRole] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const [docId, setDocId] = useState('')
  const [docPwd, setDocPwd] = useState('')
  const [clinicUser, setClinicUser] = useState('')
  const [clinicPwd, setClinicPwd] = useState('')
  const [rName, setRName] = useState('')
  const [rUser, setRUser] = useState('')
  const [rEmail, setREmail] = useState('')
  const [rPwd, setRPwd] = useState('')
  const [rConf, setRConf] = useState('')

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const clear = () => {
    setErr('')
    setOk('')
  }

  const loginDoctor = async e => {
    e.preventDefault()
    clear()
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/doctor/login', { doctorId: docId, password: docPwd })
      localStorage.setItem('triageai_token', data.token)
      localStorage.setItem('triageai_role', data.role)
      localStorage.setItem('triageai_id', data.userId)
      navigate('/doctor/dashboard')
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Invalid Doctor ID or password.')
    } finally {
      setLoading(false)
    }
  }

  const loginClinic = async e => {
    e.preventDefault()
    clear()
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/clinic/login', { username: clinicUser, password: clinicPwd })
      localStorage.setItem('triageai_token', data.token)
      localStorage.setItem('triageai_role', data.role)
      localStorage.setItem('triageai_id', data.userId)
      navigate('/clinic/dashboard')
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  const registerClinic = async e => {
    e.preventDefault()
    clear()
    if (rPwd !== rConf) {
      setErr('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/api/clinic/register', {
        clinicName: rName,
        username: rUser,
        email: rEmail,
        password: rPwd,
        confirmPassword: rConf,
      })
      setOk(`Clinic registered! Your ID is ${data}. Login credentials sent to your email.`)
      setTab('clinic')
      setClinicUser(rUser)
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const sendForgot = async e => {
    e.preventDefault()
    clear()
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password', null, {
        params: { email: forgotEmail, role: forgotRole },
      })
      setOk(`Reset link sent to ${forgotEmail}.`)
      setShowForgot(false)
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Failed to send reset email.')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'doctor', label: 'Doctor', icon: Stethoscope },
    { id: 'clinic', label: 'Clinic Admin', icon: Building2 },
    { id: 'register', label: 'Register Clinic', icon: Plus },
  ]

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
      <div style={{ width: '100%', maxWidth: 440 }} className="fade-up">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 28,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div className="brand-logo-mark" style={{ width: 42, height: 42 }}>
              <img src="/logo.png" alt="TriageAI Logo" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 19, color: 'var(--txt1)', lineHeight: 1.1 }}>
                TriageAI
              </div>
              <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>
                Clinical Triage Platform
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

        <div className="card" style={{ overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {/* Alerts */}
          {err && (
            <div className="alert alert-error" style={{ margin: '16px 20px 0' }}>
              <ShieldAlert size={15} style={{ flexShrink: 0 }} />
              <span>{err}</span>
            </div>
          )}
          {ok && (
            <div className="alert alert-success" style={{ margin: '16px 20px 0' }}>
              <Check size={15} style={{ flexShrink: 0 }} />
              <span>{ok}</span>
            </div>
          )}

          {showForgot ? (
            <form
              onSubmit={sendForgot}
              style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--txt1)' }}>
                  Reset Password
                </div>
                <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 3 }}>
                  For: <strong>{forgotRole}</strong> account
                </div>
              </div>
              <FieldWrap label="Email Address" icon={<Mail size={14} />}>
                <input
                  type="email"
                  required
                  className="inp inp-icon"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="registered@email.com"
                />
              </FieldWrap>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setShowForgot(false)}
                >
                  Back
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Tabs */}
              <div className="tabs">
                {tabs.map(t => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`tab${tab === t.id ? ' on' : ''}`}
                      onClick={() => {
                        setTab(t.id)
                        clear()
                      }}
                    >
                      <Icon size={14} />
                      <span>{t.label}</span>
                    </button>
                  )
                })}
              </div>

              <div style={{ padding: 24 }}>
                {/* Doctor */}
                {tab === 'doctor' && (
                  <form
                    onSubmit={loginDoctor}
                    style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                  >
                    <Hero
                      icon={<Stethoscope size={22} />}
                      title="Doctor Sign In"
                      sub="Access your patient queue"
                    />
                    <FieldWrap label="Doctor ID" icon={<User size={14} />}>
                      <input
                        className="inp inp-icon"
                        required
                        value={docId}
                        onChange={e => setDocId(e.target.value)}
                        placeholder="e.g. DOC1001"
                      />
                    </FieldWrap>
                    <FieldWrap
                      label="Password"
                      icon={<KeyRound size={14} />}
                      extra={
                        <button
                          type="button"
                          style={{
                            fontSize: 11.5,
                            color: 'var(--accent)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            padding: 0,
                          }}
                          onClick={() => {
                            setForgotRole('DOCTOR')
                            setShowForgot(true)
                            clear()
                          }}
                        >
                          Forgot?
                        </button>
                      }
                    >
                      <input
                        className="inp inp-icon"
                        type={showPwd ? 'text' : 'password'}
                        required
                        value={docPwd}
                        onChange={e => setDocPwd(e.target.value)}
                        placeholder="Your password"
                        style={{ paddingRight: 38 }}
                      />
                      <PwdToggle show={showPwd} toggle={() => setShowPwd(s => !s)} />
                    </FieldWrap>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary btn-full btn-lg"
                      style={{ marginTop: 4 }}
                    >
                      {loading ? (
                        'Signing in…'
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Clinic */}
                {tab === 'clinic' && (
                  <form
                    onSubmit={loginClinic}
                    style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                  >
                    <Hero
                      icon={<Building2 size={22} />}
                      title="Clinic Admin Sign In"
                      sub="Manage your clinic & queue"
                    />
                    <FieldWrap label="Username" icon={<User size={14} />}>
                      <input
                        className="inp inp-icon"
                        required
                        value={clinicUser}
                        onChange={e => setClinicUser(e.target.value)}
                        placeholder="Admin username"
                      />
                    </FieldWrap>
                    <FieldWrap
                      label="Password"
                      icon={<KeyRound size={14} />}
                      extra={
                        <button
                          type="button"
                          style={{
                            fontSize: 11.5,
                            color: 'var(--accent)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            padding: 0,
                          }}
                          onClick={() => {
                            setForgotRole('CLINIC')
                            setShowForgot(true)
                            clear()
                          }}
                        >
                          Forgot?
                        </button>
                      }
                    >
                      <input
                        className="inp inp-icon"
                        type={showPwd ? 'text' : 'password'}
                        required
                        value={clinicPwd}
                        onChange={e => setClinicPwd(e.target.value)}
                        placeholder="Your password"
                        style={{ paddingRight: 38 }}
                      />
                      <PwdToggle show={showPwd} toggle={() => setShowPwd(s => !s)} />
                    </FieldWrap>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary btn-full btn-lg"
                      style={{ marginTop: 4 }}
                    >
                      {loading ? (
                        'Signing in…'
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Register */}
                {tab === 'register' && (
                  <form
                    onSubmit={registerClinic}
                    style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                  >
                    <div style={{ marginBottom: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--txt1)' }}>
                        Register Your Clinic
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 3 }}>
                        Get started with AI-powered triage
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label className="lbl">Clinic Name</label>
                        <input
                          className="inp"
                          required
                          value={rName}
                          onChange={e => setRName(e.target.value)}
                          placeholder="City General Hospital"
                        />
                      </div>
                      <div>
                        <label className="lbl">Username</label>
                        <input
                          className="inp"
                          required
                          value={rUser}
                          onChange={e => setRUser(e.target.value)}
                          placeholder="admin_username"
                        />
                      </div>
                      <div>
                        <label className="lbl">Email</label>
                        <input
                          className="inp"
                          type="email"
                          required
                          value={rEmail}
                          onChange={e => setREmail(e.target.value)}
                          placeholder="clinic@email.com"
                        />
                      </div>
                      <div>
                        <label className="lbl">Password</label>
                        <input
                          className="inp"
                          type="password"
                          required
                          minLength={6}
                          value={rPwd}
                          onChange={e => setRPwd(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label className="lbl">Confirm Password</label>
                        <input
                          className="inp"
                          type="password"
                          required
                          value={rConf}
                          onChange={e => setRConf(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary btn-full btn-lg"
                      style={{ marginTop: 4 }}
                    >
                      {loading ? 'Creating account…' : 'Create Clinic Account'}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>

        <div
          style={{
            textAlign: 'center',
            marginTop: 20,
            fontSize: 11.5,
            color: 'var(--txt3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <Heart size={11} color="var(--accent)" />
          <span>TriageAI · AI-powered clinical triage &amp; queue management</span>
        </div>
      </div>
    </div>
  )
}

function Hero({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 6 }}>
      <div
        style={{
          width: 46,
          height: 46,
          background: 'var(--accent-bg)',
          border: '1px solid var(--accent-bd)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 10px',
          color: 'var(--accent)',
        }}
      >
        {icon}
      </div>
      <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--txt1)' }}>{title}</div>
      <div style={{ fontSize: 12.5, color: 'var(--txt3)', marginTop: 3 }}>{sub}</div>
    </div>
  )
}

function FieldWrap({ label, icon, children, extra }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 5,
        }}
      >
        <label className="lbl" style={{ marginBottom: 0 }}>
          {label}
        </label>
        {extra}
      </div>
      <div style={{ position: 'relative' }}>
        {icon && (
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
            {icon}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

function PwdToggle({ show, toggle }) {
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={show ? 'Hide password' : 'Show password'}
      style={{
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--txt3)',
        display: 'flex',
        padding: 2,
      }}
    >
      {show ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  )
}
