import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { verifyOtp, sendOtp } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import workerImg from '../../assets/worker-login.jpg';
import customerImg from '../../assets/customer-login.jpg';
import './Auth.css';

function OtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const phone = location.state?.phone || '';
  const isExistingUser = location.state?.isExistingUser ?? false;
  const preferredRole = location.state?.preferredRole || 'worker';
  
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState(preferredRole);
  const [error, setError] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!phone) {
    return (
      <div className="auth-page fade-in">
        <div className="auth-card card text-center" style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', color: 'var(--color-primary)', marginBottom: 'var(--space-5)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'var(--font-size-lg)', color: 'var(--color-text)' }}>RozgaarSetu</span>
          </div>
          <h1>Session Expired</h1>
          <p className="muted">We couldn't find your phone details. Please request a new OTP to continue.</p>
          <div style={{ marginTop: 'var(--space-5)' }}>
            <Link to="/login" className="btn btn--primary" style={{ width: '100%' }}>Go to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleResendOtp = async () => {
    setError('');
    setResendStatus('');
    setResending(true);

    try {
      await sendOtp({ phone, role });
      setResendStatus('A new OTP has been generated: 123456');
    } catch (err) {
      console.error('[Resend OTP Error]:', err);
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResendStatus('');

    const cleanedOtp = otp.trim();
    if (!/^\d{6}$/.test(cleanedOtp)) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }

    if (!isExistingUser && !name.trim()) {
      setError('Please enter your full name to complete registration.');
      return;
    }

    setLoading(true);

    try {
      const data = await verifyOtp({
        phone,
        otp: cleanedOtp,
        role,
        name: name.trim() || undefined,
      });

      // Update client auth state
      login(data.user);
      
      // Redirect based on returned user's verified role
      const userRole = data.user?.role;
      if (userRole === 'worker') navigate('/worker');
      else if (userRole === 'customer') navigate('/customer');
      else if (userRole === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      console.error('[OTP Verification Error]:', err);
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page fade-in">
      <div className="auth-container">
        {/* Left column: Visual Panel */}
        <aside className="auth-visual">
          <div className="auth-visual__overlay"></div>
          <img 
            src={role === 'customer' ? customerImg : workerImg} 
            alt={role === 'customer' ? 'Customer on RozgaarSetu' : 'Worker on RozgaarSetu'} 
            className="auth-visual__img"
          />
          <div className="auth-visual__content">
            <Link to="/" className="auth-visual__logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="var(--color-surface)" />
                <path d="M2 17L12 22L22 17" stroke="var(--color-surface)" strokeWidth="2" strokeLinecap="round" />
                <path d="M2 12L12 17L22 12" stroke="var(--color-surface)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>RozgaarSetu</span>
            </Link>
            <div className="auth-visual__text">
              <h2>Verify your number</h2>
              <p>Just one step away from connecting with your local marketplace community.</p>
              <div className="auth-visual__role-tag">
                {isExistingUser ? `Signing in as ${role}` : `Creating a new ${role} profile`}
              </div>
            </div>
          </div>
        </aside>

        {/* Right column: Form Card */}
        <div className="auth-card card">
          <header className="auth-card__header">
            <h1>Enter OTP</h1>
            <p className="muted">
              We've sent a 6-digit verification code to <strong style={{ color: 'var(--color-text)' }}>+91 {phone}</strong>
            </p>
          </header>

          <div style={{
            background: 'var(--color-primary-light, #e0f2fe)',
            border: '1px solid var(--color-primary, #0284c7)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: 'var(--space-3, 12px)',
            marginBottom: 'var(--space-4, 16px)',
            fontSize: 'var(--font-size-sm, 14px)',
            color: '#0369a1',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>💡 <strong>Development Mock Mode:</strong> Use OTP <strong>123456</strong></span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="otp">One-Time Password</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                maxLength={6}
                pattern="\d*"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                disabled={loading || resending}
                className="otp-input-field"
              />
            </div>

            {/* Registration fields for new users */}
            {!isExistingUser && (
              <div className="auth-registration-fields">
                <div className="auth-field">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading || resending}
                  />
                </div>

                <div className="auth-field">
                  <label>I want to use RozgaarSetu as a:</label>
                  <div className="role-options" role="radiogroup" aria-label="Select role">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={role === 'worker'}
                      className={`role-option ${role === 'worker' ? 'role-option--active' : ''}`}
                      onClick={() => setRole('worker')}
                      disabled={loading || resending}
                    >
                      Worker
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={role === 'customer'}
                      className={`role-option ${role === 'customer' ? 'role-option--active' : ''}`}
                      onClick={() => setRole('customer')}
                      disabled={loading || resending}
                    >
                      Customer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {resendStatus && (
              <div style={{ color: 'var(--color-success, #10b981)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}>
                ✓ {resendStatus}
              </div>
            )}

            {error && (
              <div className="auth-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn--primary auth-submit" disabled={loading || resending}>
              {loading ? (
                <>
                  <span className="auth-spinner" aria-hidden="true"></span>
                  Verifying OTP...
                </>
              ) : (
                'Verify & Continue'
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
              <button
                type="button"
                className="btn btn--ghost"
                style={{ fontSize: 'var(--font-size-sm)', padding: 'var(--space-2)' }}
                onClick={handleResendOtp}
                disabled={loading || resending}
              >
                {resending ? 'Generating code...' : "Didn't receive code? Resend OTP"}
              </button>
            </div>
          </form>

          <footer className="auth-card__footer">
            <Link to="/login" className="btn btn--ghost back-home-btn">
              ← Change phone number
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default OtpPage;
