import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Plus, ShieldCheck, KeyRound, ShieldAlert, Check, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import api from '../utils/api'

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const token = query.get('token') || ''
  const role = query.get('role') || 'CLINIC'

  const [pwd, setPwd] = useState('')
  const [conf, setConf] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const strength = pwd.length === 0 ? 0 : pwd.length < 6 ? 1 : pwd.length < 8 ? 2 : pwd.length < 12 ? 3 : 4
  const strengthLabel = ['', 'Too short (min. 6 characters)', 'Weak', 'Good', 'Strong']
  const strengthColor = ['', 'var(--red)', 'var(--orange)', 'var(--yellow)', 'var(--green)']

  const submit = async e => {
    e.preventDefault()
    setErr('')
    setOk('')
    if (!token) {
      setErr('Password reset token is missing from the link. Please request a new password reset email.')
      return
    }
    if (pwd !== conf) {
      setErr('Passwords do not match. Please verify both fields.')
      return
    }
    if (pwd.length < 6) {
      setErr('Password must be at least 6 characters long.')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/auth/reset-password', null, {
        params: { token, role, newPassword: pwd },
      })
      setOk('Your password has been updated. Redirecting to sign in…')
      setTimeout(() => navigate('/'), 2200)
    } catch (ex) {
      setErr(ex.response?.data?.message || ex.response?.data || 'Reset failed. The reset link may have expired.')
    } finally {
      setLoading(false)
    }
  }

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
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div className="brand-logo-mark">
            <img src="/logo.png" alt="TriageAI Logo" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--txt1)', lineHeight: 1.1 }}>TriageAI</div>
            <div style={{ fontSize: 11.5, color: 'var(--txt3)' }}>Account Security</div>
          </div>
        </div>

        <div className="card card-p">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div
              style={{
                width: 40,
                height: 40,
                background: 'var(--accent-bg)',
                border: '1px solid var(--accent-bd)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--txt1)' }}>Set New Password</div>
              <div style={{ fontSize: 12.5, color: 'var(--txt3)', marginTop: 2 }}>
                Updating credentials for your <strong>{role.toLowerCase()}</strong> account
              </div>
            </div>
          </div>

          {err && (
            <div className="alert alert-error" style={{ marginBottom: 16 }} role="alert">
              <ShieldAlert size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{err}</span>
            </div>
          )}
          {ok && (
            <div className="alert alert-success" style={{ marginBottom: 16 }} role="status">
              <Check size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{ok}</span>
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="lbl" htmlFor="new-password">
                New Password <span className="lbl-req">*</span>
              </label>
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
                  <KeyRound size={14} />
                </div>
                <input
                  id="new-password"
                  type={show ? 'text' : 'password'}
                  required
                  value={pwd}
                  onChange={e => setPwd(e.target.value)}
                  className="inp inp-icon"
                  placeholder="Minimum 6 characters"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
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
                    padding: 4,
                  }}
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pwd.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 2,
                          background: i <= strength ? strengthColor[strength] : 'var(--border)',
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: 11.5, color: strengthColor[strength], fontWeight: 600 }}>
                    {strengthLabel[strength]}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="lbl" htmlFor="confirm-password">
                Confirm New Password <span className="lbl-req">*</span>
              </label>
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
                  <KeyRound size={14} />
                </div>
                <input
                  id="confirm-password"
                  type={show ? 'text' : 'password'}
                  required
                  value={conf}
                  onChange={e => setConf(e.target.value)}
                  className="inp inp-icon"
                  placeholder="Re-enter new password"
                  style={{ borderColor: conf && conf !== pwd ? 'var(--red)' : undefined }}
                />
              </div>
              {conf && conf !== pwd && (
                <div style={{ fontSize: 11.5, color: 'var(--red)', marginTop: 4, fontWeight: 600 }}>
                  Passwords do not match.
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !!ok}
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: 4 }}
            >
              {loading ? 'Updating password…' : 'Update Password'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <Link
              to="/"
              style={{
                fontSize: 13,
                color: 'var(--accent)',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <ArrowLeft size={14} />
              <span>Return to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
