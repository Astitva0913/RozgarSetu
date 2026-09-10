import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthLayout from './components/AuthLayout';
import { listOpenJobs, listMyApplications, applyToJob } from './api/worker';
import { getMyPayments } from './api/payment';
import JobCard from './components/JobCard';
import Loading from './components/Loading';
import ErrorMessage from './components/ErrorMessage';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openJobsCount, setOpenJobsCount] = useState(0);
  const [appsCount, setAppsCount] = useState(0);
  const [recentJobs, setRecentJobs] = useState([]);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [earningsSummary, setEarningsSummary] = useState({
    totalEarnings: 0,
    pendingPayments: 0,
    completedPayments: 0,
  });
  const [recentEarnings, setRecentEarnings] = useState([]);

  const loadDashboardData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    if (showLoading) setError('');
    try {
      const [jobsRes, appsRes, paymentsRes] = await Promise.all([
        listOpenJobs(1, 3),
        listMyApplications({ page: 1, limit: 1 }),
        getMyPayments().catch(() => ({
          payments: [],
          summary: { totalEarnings: 0, pendingPayments: 0, completedPayments: 0 },
        })),
      ]);
      
      setOpenJobsCount(jobsRes.pagination?.total || 0);
      setAppsCount(appsRes.pagination?.total || 0);
      setRecentJobs(jobsRes.jobs ? jobsRes.jobs.slice(0, 3) : []);
      setEarningsSummary(
        paymentsRes.summary || { totalEarnings: 0, pendingPayments: 0, completedPayments: 0 }
      );
      setRecentEarnings(paymentsRes.payments ? paymentsRes.payments.slice(0, 5) : []);
    } catch (e) {
      if (showLoading) setError(e.message || 'Failed to load dashboard data.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      loadDashboardData(true);
    }
    return () => { mounted = false; };
  }, []);

  const handleApply = async (jobId) => {
    setApplyingJobId(jobId);
    setMessage({ text: '', type: '' });
    try {
      await applyToJob(jobId);
      setMessage({ text: 'Application submitted successfully!', type: 'success' });
      // Refresh dashboard counts and lists without a full page loader spinner
      await loadDashboardData(false);
    } catch (err) {
      setMessage({ text: err.message || 'Failed to submit application.', type: 'danger' });
    } finally {
      setApplyingJobId(null);
    }
  };

  if (loading) return <Loading message="Loading your dashboard..." />;
  if (error && !openJobsCount && !recentJobs.length) return (
    <AuthLayout title="Worker Dashboard">
      <ErrorMessage message={error} />
    </AuthLayout>
  );

  const getInitials = (name) => {
    if (!name) return 'W';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <AuthLayout title="Worker Dashboard">
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        
        {/* Welcome Greeting Banner */}
        <section className="welcome-banner card">
          <div className="welcome-banner__avatar">
            {getInitials(user?.name)}
          </div>
          <div className="welcome-banner__text">
            <h2>Welcome back, {user?.name}!</h2>
            <p className="muted">You are logged in as a Worker. Browse jobs and manage your submissions below.</p>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="dashboard-stats-grid">
          <div className="card dashboard-stat-card card--interactive">
            <div className="stat-card__icon" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
            </div>
            <div className="stat-card__details">
              <span className="stat-card__label muted">Available Jobs</span>
              <span className="stat-card__value">{openJobsCount}</span>
            </div>
            <div className="stat-card__action">
              <Link to="/worker/jobs" className="btn btn--primary btn--sm">Find Jobs</Link>
            </div>
          </div>

          <div className="card dashboard-stat-card card--interactive">
            <div className="stat-card__icon" style={{ backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-secondary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            </div>
            <div className="stat-card__details">
              <span className="stat-card__label muted">My Applications</span>
              <span className="stat-card__value">{appsCount}</span>
            </div>
            <div className="stat-card__action">
              <Link to="/worker/applications" className="btn btn--secondary btn--sm">View Applications</Link>
            </div>
          </div>

          <div className="card dashboard-stat-card card--interactive">
            <div className="stat-card__icon" style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <div className="stat-card__details">
              <span className="stat-card__label muted">My Profile</span>
              <span className="stat-card__value">Active</span>
            </div>
            <div className="stat-card__action">
              <Link to="/worker/profile" className="btn btn--ghost btn--sm">Edit Profile</Link>
            </div>
          </div>
        </section>

        {/* Payment Summary / Earnings Section */}
        <section className="dashboard-earnings">
          <div className="section-header-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={{ margin: 0 }}>Payment Summary</h3>
              <p className="muted" style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                Track your job earnings and completed settlements.
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
                <span className="stat-card__label muted">Total Earnings</span>
                <span className="stat-card__value">₹ {earningsSummary.totalEarnings}</span>
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
                <span className="stat-card__value">₹ {earningsSummary.pendingPayments}</span>
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
                <span className="stat-card__value">₹ {earningsSummary.completedPayments}</span>
              </div>
            </div>
          </div>

          {/* Recent Earnings List */}
          {recentEarnings.length > 0 && (
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)' }}>Recent Earnings</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {recentEarnings.map((p) => (
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
                        Customer: {p.customer?.name || 'Customer'} • {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <strong style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-success-dark)' }}>
                        + ₹ {p.workerAmount}
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

        {/* Dashboard load error (partial) */}
        {error && <ErrorMessage message={error} />}

        {/* Feedback Alert */}
        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert--success' : 'alert--danger'}`} role="alert">
            {message.type === 'success' ? (
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Recommended Openings */}
        <section className="dashboard-recommendations">
          <div className="section-header-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={{ margin: 0 }}>Recent Opportunities</h3>
              <p className="muted" style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Explore and apply to jobs that match your skills.</p>
            </div>
            <Link to="/worker/jobs" className="btn btn--ghost btn--sm">View All</Link>
          </div>

          {recentJobs.length === 0 ? (
            <div className="card text-center" style={{ padding: 'var(--space-6)' }}>
              <p className="muted" style={{ margin: 0 }}>No open opportunities available right now. Check back soon!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {recentJobs.map((job) => (
                <JobCard 
                  key={job._id || job.id} 
                  job={job} 
                  onApply={handleApply} 
                  applying={applyingJobId === (job._id || job.id)} 
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </AuthLayout>
  );
}
