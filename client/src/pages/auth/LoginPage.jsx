import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { sendOtp } from '../../api/auth';
import workerImg from '../../assets/worker-login.jpg';
import customerImg from '../../assets/customer-login.jpg';
import './Auth.css';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize role state based on navigation state, defaulting to 'worker'
  const initialRole = location.state?.preferredRole || 'worker';
  const [role, setRole] = useState(initialRole);
  
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate phone number format (10 digit check)
    const cleanedPhone = phone.trim().replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanedPhone)) {
      setError('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    setLoading(true);

    try {
      const data = await sendOtp({ phone: cleanedPhone, role });
      navigate('/verify-otp', {
        state: { phone: cleanedPhone, preferredRole: role, isExistingUser: data.isExistingUser },
      });
    } catch (err) {
      console.error('[Login Send OTP Error]:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page fade-in">
      <div className="auth-container">
        {/* Left column: Visual Panel (Dynamic based on selected role) */}
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
              <h2>{role === 'worker' ? 'Find Local Work Easily' : 'Hire Skilled Local Labor'}</h2>
              <p>
                {role === 'worker' 
                  ? 'Connect with customers looking for your skills in your neighborhood.' 
                  : 'Post jobs and connect directly with verified workers in minutes.'}
              </p>
            </div>
          </div>
        </aside>

        {/* Right column: Form Card */}
        <div className="auth-card card">
          <header className="auth-card__header">
            <h1>Welcome to RozgaarSetu</h1>
            <p className="muted">Enter your phone number to sign in or register.</p>
          </header>

          {/* Role selector inside the form */}
          <div className="auth-role-switch">
            <span className="auth-role-label">Signing in as:</span>
            <div className="role-options" role="radiogroup" aria-label="Select role">
              <button
                type="button"
                role="radio"
                aria-checked={role === 'worker'}
                className={`role-option ${role === 'worker' ? 'role-option--active' : ''}`}
                onClick={() => setRole('worker')}
              >
                Worker
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={role === 'customer'}
                className={`role-option ${role === 'customer' ? 'role-option--active' : ''}`}
                onClick={() => setRole('customer')}
              >
                Customer
              </button>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="phone">Phone Number</label>
              <div className="phone-input-wrapper">
                <span className="phone-prefix">+91</span>
                <input
                  id="phone"
                  type="tel"
                  placeholder="98765 43210"
                  maxLength={10}
                  pattern="\d*"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn--primary auth-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="auth-spinner" aria-hidden="true"></span>
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>

          <footer className="auth-card__footer">
            <Link to="/" className="btn btn--ghost back-home-btn">
              ← Back to Home
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
