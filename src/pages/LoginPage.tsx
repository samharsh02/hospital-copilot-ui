import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStore } from '../store/auth';
import { hospitalStore } from '../store/hospital';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authStore.login(username, password);
      await hospitalStore.load();
      navigate('/');
    } catch (err: unknown) {
      setError(
        (err as { data?: { detail?: string } })?.data?.detail ?? 'Invalid credentials.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--page)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--blue)', borderRadius: 14,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
          }}>
            <svg width="26" height="26" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
              <path d="M12 2v20M2 12h20"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>
            Hospital Copilot
          </h1>
          <p style={{ fontSize: 13, color: 'var(--t3)' }}>Clinical decision support platform</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '28px 28px 24px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', marginBottom: 20 }}>
            Sign in to your account
          </h2>

          {error && (
            <div className="error-msg">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 14 }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                    display: 'inline-block',
                  }} />
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--t4)' }}>
          Hospital Copilot &mdash; Authorised users only
        </p>
      </div>
    </div>
  );
}
