import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthLayout from './components/AuthLayout';
import { listMyJobs } from './api/customer';
import { getMyPayments } from './api/payment';
import Loading from './components/Loading';
import ErrorMessage from './components/ErrorMessage';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myJobsCount, setMyJobsCount] = useState(0);
  const [paymentSummary, setPaymentSummary] = useState({ totalPaid: 0, pendingCount: 0, paidCount: 0 });
  const [recentPayments, setRecentPayments] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [jobsRes, paymentsRes] = await Promise.all([
          listMyJobs({ page: 1, limit: 1 }),
          getMyPayments().catch(() => ({ payments: [], summary: { totalPaid: 0, pendingCount: 0, paidCount: 0 } })),
        ]);
        if (!mounted) return;
        setMyJobsCount(jobsRes.pagination?.total || 0);
        setPaymentSummary(paymentsRes.summary || { totalPaid: 0, pendingCount: 0, paidCount: 0 });
        setRecentPayments(paymentsRes.payments ? paymentsRes.payments.slice(0, 5) : []);
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load dashboard data.');
      } finally { 
        if (mounted) setLoading(false); 
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <Loading message="Loading customer dashboard..." />;
  if (error) return (
    <AuthLayout title="Customer Dashboard">
      <ErrorMessage message={error} />
    </AuthLayout>
  );

  const getInitials = (name) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <AuthLayout title="Customer Dashboard">
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        
        {/* Welcome Greeting Banner */}
        <section className="welcome-banner card">
          <div className="welcome-banner__avatar" style={{ background: 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))' }}>
            {getInitials(user?.name)}
          </div>
          <div className="welcome-banner__text">
            <h2>Welcome back, {user?.name}!</h2>
            <p className="muted">Customer Account • Manage your active job postings and hire skilled workers near you.</p>
          </div>
        </section>

        {/* Stats & Navigation Grid */}
        <section className="dashboard-stats-grid">
          <div className="card dashboard-stat-card card--interactive">
            <div className="stat-card__icon" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
            </div>
            <div className="stat-card__details">
              <span className="stat-card__label muted">My Job Postings</span>
              <span className="stat-card__value">{myJobsCount} Active</span>
            </div>
            <div className="stat-card__action">
              <Link to="/customer/jobs" className="btn btn--primary btn--sm">View Postings</Link>
            </div>
          </div>

          <div className="card dashboard-stat-card card--interactive">
            <div className="stat-card__icon" style={{ backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-secondary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <div className="stat-card__details">
              <span className="stat-card__label muted">Hire Services</span>
              <span className="stat-card__value">Find Talent</span>
            </div>
            <div className="stat-card__action">
              <Link to="/customer/workers" className="btn btn--secondary btn--sm">Find Workers</Link>
            </div>
          </div>

          <div className="card dashboard-stat-card card--interactive">
            <div className="stat-card__icon" style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            <div className="stat-card__details">
              <span className="stat-card__label muted">New Posting</span>
              <span className="stat-card__value">Create Job</span>
            </div>
            <div className="stat-card__action">
              <Link to="/customer/jobs" className="btn btn--ghost btn--sm">Post a Job</Link>
            </div>
          </div>
        </section>

        {/* Payment Overview Section */}
        <section className="dashboard-payments">
          <div className="section-header-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={{ margin: 0 }}>Payments Overview</h3>
              <p className="muted" style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                Track worker settlements and transaction records via Razorpay.
              </p>
            </div>
          </div>

          <div className="dashboard-stats-grid" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="card dashboard-stat-card">
              <div className="stat-card__icon" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-dark)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-8" />
                </svg>
              </div>
              <div className="stat-card__details">
                <span className="stat-card__label muted">Total Paid</span>
                <span className="stat-card__value">₹ {paymentSummary.totalPaid}</span>
              </div>
            </div>

            <div className="card dashboard-stat-card">
              <div className="stat-card__icon" style={{ backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning-dark)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="stat-card__details">
                <span className="stat-card__label muted">Pending Payments</span>
                <span className="stat-card__value">{paymentSummary.pendingCount}</span>
              </div>
            </div>

            <div className="card dashboard-stat-card">
              <div className="stat-card__icon" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="stat-card__details">
                <span className="stat-card__label muted">Completed Payments</span>
                <span className="stat-card__value">{paymentSummary.paidCount}</span>
              </div>
            </div>
          </div>

          {/* Recent Payments List */}
          {recentPayments.length > 0 && (
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)' }}>Recent Payments</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {recentPayments.map((p) => (
                  <div
                    key={p._id || p.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-3)',
                      backgroundColor: 'var(--color-background)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 'var(--font-size-sm)', display: 'block' }}>
                        {p.job?.title || 'Job Payment'}
                      </strong>
                      <span className="muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                        Worker: {p.worker?.name || 'Assigned Worker'} • {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <strong style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text)' }}>
                        ₹ {p.amount}
                      </strong>
                      <span className={`badge ${p.status === 'paid' ? 'badge--success' : p.status === 'failed' ? 'badge--danger' : 'badge--warning'}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Dashboard guidelines */}
        <section className="dashboard-recommendations">
          <div className="section-header-block" style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ margin: 0 }}>Hiring Guidelines</h3>
            <p className="muted" style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Follow these quick steps to get things done effectively on RozgaarSetu.</p>
          </div>

          <div className="grid-layout grid-layout--3">
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)', marginBottom: 6 }}>01</div>
              <h4 style={{ margin: '0 0 6px', fontSize: 'var(--font-size-sm)' }}>Post a Detailed Job</h4>
              <p className="muted" style={{ margin: 0, fontSize: 'var(--font-size-xs)', lineHeight: 1.5 }}>
                Describe requirements, salary, and location clearly so matching labor can apply to your project.
              </p>
            </div>

            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', color: 'var(--color-secondary)', marginBottom: 6 }}>02</div>
              <h4 style={{ margin: '0 0 6px', fontSize: 'var(--font-size-sm)' }}>Review Worker Bios</h4>
              <p className="muted" style={{ margin: 0, fontSize: 'var(--font-size-xs)', lineHeight: 1.5 }}>
                Inspect bio descriptions, locations, skills tag clouds, and experience before clicking accept.
              </p>
            </div>

            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <div style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)', color: '#f59e0b', marginBottom: 6 }}>03</div>
              <h4 style={{ margin: '0 0 6px', fontSize: 'var(--font-size-sm)' }}>Coordinate Directly</h4>
              <p className="muted" style={{ margin: 0, fontSize: 'var(--font-size-xs)', lineHeight: 1.5 }}>
                Once accepted, get instant access to phone numbers to discuss timings, materials, and work details.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AuthLayout>
  );
}
