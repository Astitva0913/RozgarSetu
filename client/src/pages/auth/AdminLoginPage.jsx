import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { adminLogin } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in as admin, redirect to admin dashboard immediately
  if (user && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanedEmail = email.trim();
    if (!cleanedEmail) {
      setError('Please enter your admin email address.');
      return;
    }

    if (!password) {
      setError('Please enter your admin password.');
      return;
    }

    setLoading(true);

    try {
      const data = await adminLogin({
        email: cleanedEmail,
        password,
      });

      // Update AuthContext with authenticated admin user returned by backend
      login(data.user);

      // Navigate to /admin dashboard
      navigate('/admin');
    } catch (err) {
      console.error('[Admin Login Error]:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page fade-in">
      <div className="auth-container" style={{ maxWidth: 480, margin: '0 auto' }}>
        <div className="auth-card card" style={{ width: '100%', padding: 'var(--space-6)' }}>
          {/* Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-primary)', textDecoration: 'none', marginBottom: 'var(--space-3)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="var(--color-primary)" />
                <path d="M2 17L12 22L22 17" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'var(--font-size-xl)', color: 'var(--color-text)' }}>
                Rozgaar<span style={{ color: 'var(--color-primary)' }}>Setu</span>
              </span>
            </Link>

            <div style={{ display: 'inline-block', background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-xs)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>
              ADMIN CONSOLE
            </div>

            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: '0 0 var(--space-1)' }}>
              RozgaarSetu Admin Login
            </h1>
            <p className="muted" style={{ fontSize: 'var(--font-size-sm)', margin: 0 }}>
              Enter administrator credentials to access platform controls.
            </p>
          </div>

          {/* Login Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="admin-email">Admin Email</label>
              <input
                id="admin-email"
                type="email"
                placeholder="astitvayeotikar@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn--primary auth-submit" disabled={loading} style={{ width: '100%', marginTop: 'var(--space-2)' }}>
              {loading ? (
                <>
                  <span className="auth-spinner" aria-hidden="true"></span>
                  Signing In...
                </>
              ) : (
                'Sign In as Admin'
              )}
            </button>
          </form>

          <footer className="auth-card__footer" style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
            <Link to="/" className="btn btn--ghost back-home-btn" style={{ fontSize: 'var(--font-size-sm)' }}>
              ← Back to Home
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;
