import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Activity, ShieldCheck, KeyRound, ShieldAlert, Check, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import api from '../utils/api'

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const query = new URLSearchParams(location.search)
  const token = query.get('token') || ''
  const role  = query.get('role') || 'CLINIC'

  const [pwd, setPwd] = useState('')
  const [conf, setConf] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const strength = pwd.length === 0 ? 0 : pwd.length < 6 ? 1 : pwd.length < 8 ? 2 : pwd.length < 12 ? 3 : 4
  const strengthLabel = ['', 'Too short', 'Weak', 'Good', 'Strong']
  const strengthColor = ['', 'var(--red)', 'var(--orange)', 'var(--yellow)', 'var(--green)']

  const submit = async e => {
    e.preventDefault(); setErr(''); setOk('')
    if (!token) { setErr('Reset token is missing from the URL.'); return }
    if (pwd !== conf) { setErr('Passwords do not match.'); return }
    if (pwd.length < 6) { setErr('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      await api.post('/api/auth/reset-password', null, { params: { token, role, newPassword: pwd } })
      setOk('Password reset! Redirecting to login…')
      setTimeout(() => navigate('/'), 2500)
    } catch (ex) {
      setErr(ex.response?.data || 'Reset failed. The link may have expired.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 38, height: 38, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, color: 'var(--txt1)', lineHeight: 1 }}>TriageAI</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>Password Reset</div>
          </div>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
            <div style={{ width: 42, height: 42, background: 'var(--accent-bg)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--txt1)' }}>Set New Password</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>For your <strong>{role.toLowerCase()}</strong> account</div>
            </div>
          </div>

          {err && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              <ShieldAlert size={14} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13 }}>{err}</span>
            </div>
          )}
          {ok && (
            <div className="alert alert-success" style={{ marginBottom: 16 }}>
              <Check size={14} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13 }}>{ok}</span>
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="lbl">New Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)', pointerEvents: 'none', display: 'flex' }}>
                  <KeyRound size={14} />
                </div>
                <input
                  type={show ? 'text' : 'password'}
                  required
                  value={pwd}
                  onChange={e => setPwd(e.target.value)}
                  className="inp inp-icon"
                  placeholder="Minimum 6 characters"
                  style={{ paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShow(s => !s)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', display: 'flex', padding: 2 }}>
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {/* Strength meter */}
              {pwd.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColor[strength] : 'var(--border)', transition: 'background .2s' }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: strengthColor[strength], fontWeight: 600 }}>{strengthLabel[strength]}</div>
                </div>
              )}
            </div>

            <div>
              <label className="lbl">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)', pointerEvents: 'none', display: 'flex' }}>
                  <KeyRound size={14} />
                </div>
                <input
                  type={show ? 'text' : 'password'}
                  required
                  value={conf}
                  onChange={e => setConf(e.target.value)}
                  className="inp inp-icon"
                  placeholder="Repeat your password"
                  style={{ borderColor: conf && conf !== pwd ? 'var(--red)' : '' }}
                />
              </div>
              {conf && conf !== pwd && (
                <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4, fontWeight: 600 }}>Passwords don't match</div>
              )}
            </div>

            <button type="submit" disabled={loading || !!ok} className="btn btn-primary btn-full btn-lg" style={{ marginTop: 4 }}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <Link to="/" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={13} />Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
