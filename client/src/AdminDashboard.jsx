import { useEffect, useState } from 'react';
import { getStats, listUsers, listJobs, listApplications, listPayments } from './api/admin';
import Loading from './components/Loading';
import ErrorMessage from './components/ErrorMessage';
import EmptyState from './components/EmptyState';
import AuthLayout from './components/AuthLayout';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [s, u, j, a, p] = await Promise.all([
          getStats(),
          listUsers(),
          listJobs(),
          listApplications(),
          listPayments().catch(() => ({ payments: [] })),
        ]);
        if (!mounted) return;
        setStats(s.stats || {});
        setUsers(u.users || []);
        setJobs(j.jobs || []);
        setApplications(a.applications || []);
        setPayments(p.payments || []);
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load admin data');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return (
    <AuthLayout title="Admin Dashboard" subtitle="Platform overview and management.">
      <Loading message="Loading admin data..." />
    </AuthLayout>
  );

  return (
    <AuthLayout title="Admin Dashboard" subtitle="Platform overview and management.">
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

        {error && <ErrorMessage message={error} />}

        {/* Stats */}
        {stats && (
          <section className="dashboard-stats-grid">
            {Object.entries(stats).map(([key, val]) => {
              const isMoney = ['totalTransactionValue', 'totalPlatformCommission', 'totalWorkerEarnings'].includes(key);
              const formattedVal = isMoney ? `₹ ${Number(val).toLocaleString()}` : String(val);
              return (
                <div key={key} className="card dashboard-stat-card">
                  <div className="stat-card__details">
                    <span className="stat-card__label muted">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="stat-card__value">{formattedVal}</span>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Users */}
        <section>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Users ({users.length})</h3>
          {users.length === 0 ? (
            <EmptyState
              title="No users registered"
              description="No users have signed up on the platform yet."
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {users.map(u => (
              <div key={u._id || u.id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{u.name}</strong>
                  <span className="muted" style={{ marginLeft: 8, fontSize: 'var(--font-size-sm)' }}>{u.phone || u.email}</span>
                </div>
                <span className="badge">{u.role}</span>
              </div>
            ))}
          </div>
          )}
        </section>

        {/* Jobs */}
        <section>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Jobs ({jobs.length})</h3>
          {jobs.length === 0 ? (
            <EmptyState
              title="No jobs posted"
              description="No job listings have been created on the platform yet."
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                </svg>
              }
            />
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {jobs.map(j => (
              <div key={j._id || j.id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{j.title}</strong>
                  <span className="muted" style={{ marginLeft: 8, fontSize: 'var(--font-size-sm)' }}>{j.customer?.name}</span>
                </div>
                <span className={`badge ${j.status === 'open' ? 'badge--success' : 'badge--danger'}`}>{j.status}</span>
              </div>
            ))}
          </div>
          )}
        </section>

        {/* Applications */}
        <section>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Applications ({applications.length})</h3>
          {applications.length === 0 ? (
            <EmptyState
              title="No applications yet"
              description="No workers have applied to any jobs on the platform yet."
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              }
            />
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {applications.map(a => (
              <div key={a.id || a._id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted" style={{ fontSize: 'var(--font-size-sm)' }}>Application {a.id || a._id}</span>
                <span className={`badge ${a.status === 'accepted' ? 'badge--success' : a.status === 'rejected' ? 'badge--danger' : 'badge--warning'}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
          )}
        </section>

        {/* Payment Records */}
        <section>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Payment Records ({payments.length})</h3>
          {payments.length === 0 ? (
            <EmptyState
              title="No payments recorded"
              description="No payments have been processed on the platform yet."
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              }
            />
          ) : (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}>
                    <th style={{ padding: '12px 16px' }}>Payment ID</th>
                    <th style={{ padding: '12px 16px' }}>Customer</th>
                    <th style={{ padding: '12px 16px' }}>Worker</th>
                    <th style={{ padding: '12px 16px' }}>Job</th>
                    <th style={{ padding: '12px 16px' }}>Amount</th>
                    <th style={{ padding: '12px 16px' }}>Commission</th>
                    <th style={{ padding: '12px 16px' }}>Worker Amount</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id || p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 'var(--font-size-xs)' }}>
                        {p.razorpayPaymentId || p.razorpayOrderId || (p._id || p.id).slice(-8)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>{p.customer?.name || 'Customer'}</td>
                      <td style={{ padding: '12px 16px' }}>{p.worker?.name || 'Worker'}</td>
                      <td style={{ padding: '12px 16px' }}>{p.job?.title || 'Job'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>₹ {p.amount}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>₹ {p.platformCommission}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-primary)', fontWeight: 600 }}>₹ {p.workerAmount}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${p.status === 'paid' ? 'badge--success' : p.status === 'failed' ? 'badge--danger' : 'badge--warning'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </AuthLayout>
  );
}
