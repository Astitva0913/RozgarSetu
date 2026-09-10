import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMyApplications, withdrawApplication, getConnection } from './api/worker';
import ApplicationCard from './components/ApplicationCard';
import WorkerWorkflowCard from './components/WorkerWorkflowCard';
import Loading from './components/Loading';
import ErrorMessage from './components/ErrorMessage';
import EmptyState from './components/EmptyState';
import AuthLayout from './components/AuthLayout';

export default function WorkerApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connection, setConnection] = useState(null);
  const [processingAppId, setProcessingAppId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const fetchApps = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const data = await listMyApplications();
      setApplications(data.applications || []);
    } catch (err) {
      setError(err.message || 'Failed to load applications');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => { 
    fetchApps(true); 
  }, []);

  const handleWithdraw = async (applicationId) => {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) return;
    setProcessingAppId(applicationId);
    setError('');
    setSuccessMessage('');
    try {
      await withdrawApplication(applicationId);
      setSuccessMessage('Application withdrawn successfully.');
      // Refresh applications list
      await fetchApps(false);
      // Clear active connection if it belonged to this application
      setConnection(null);
    } catch (err) { 
      setError(err.message || 'Failed to withdraw application.'); 
    } finally { 
      setProcessingAppId(null); 
    }
  };

  const handleViewConnection = async (applicationId) => {
    setProcessingAppId(applicationId);
    setError('');
    try {
      const data = await getConnection(applicationId);
      setConnection(data.connection || null);
      // Scroll to connection card smoothly
      setTimeout(() => {
        document.getElementById('connection-card-view')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) { 
      setError(err.message || 'Failed to load employer connection contact details.'); 
    } finally { 
      setProcessingAppId(null); 
    }
  };

  if (loading) return <Loading message="Loading your applications..." />;

  return (
    <AuthLayout title="My Applications" subtitle="Track and manage your submitted job applications.">
      <div className={`fade-in wapps-layout${connection ? ' wapps-layout--split' : ''}`}>
        
        {/* Left Side: Applications list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {successMessage && (
            <div className="alert alert--success" role="alert">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              <span>{successMessage}</span>
            </div>
          )}

          {error && <ErrorMessage message={error} />}

          {!error && applications.length === 0 ? (
            <EmptyState
              title="No applications yet"
              description="You haven't applied to any jobs. Browse open listings and submit your first application."
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              }
              action={{ label: 'Browse Jobs', onClick: () => navigate('/worker/jobs') }}
            />
          ) : (
            applications.map(a => (
              <ApplicationCard
                key={a.id || a._id}
                application={a}
                onWithdraw={a.status === 'pending' ? handleWithdraw : null}
                onViewConnection={a.status === 'accepted' ? handleViewConnection : null}
                onAccept={null}
                onReject={null}
                showJob
                processingApplicationId={processingAppId}
              />
            ))
          )}
        </div>

        {/* Right Side: Active Connection panel */}
        {connection && (
          <aside id="connection-card-view" className="card fade-in" style={{ 
            border: '2px solid var(--color-success)', 
            backgroundColor: 'var(--color-surface)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <header style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-success-dark)', fontWeight: 700 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                <span>Application Accepted!</span>
              </div>
              <h3 style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--font-size-md)' }}>Employer Contact Card</h3>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Job Summary */}
              <div style={{ backgroundColor: 'var(--color-background)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                <span className="muted" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>For Job Opportunity</span>
                <strong style={{ display: 'block', fontSize: 'var(--font-size-sm)', marginTop: 2 }}>{connection.job.title}</strong>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 'var(--font-size-xs)', lineHeight: 1.4 }}>
                  {connection.job.description}
                </p>
              </div>

              {/* Employer Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 'var(--radius-full)', 
                    backgroundColor: 'var(--color-primary-light)', 
                    color: 'var(--color-primary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 700
                  }}>
                    {connection.customer?.name ? connection.customer.name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase() : 'C'}
                  </div>
                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Employer Name</span>
                    <strong style={{ color: 'var(--color-text)', fontSize: 'var(--font-size-sm)' }}>{connection.customer?.name}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Phone Number</span>
                    <a href={`tel:${connection.customer?.phone}`} style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', textDecoration: 'underline' }}>
                      {connection.customer?.phone}
                    </a>
                  </div>
                </div>

                {connection.customer?.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <div>
                      <span className="muted" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Email Address</span>
                      <a href={`mailto:${connection.customer.email}`} style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', textDecoration: 'underline' }}>
                        {connection.customer.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Workflow Actions (Start / Finish Work) */}
              <WorkerWorkflowCard
                job={connection.job}
                onWorkflowUpdate={(updatedJob) => {
                  setConnection((prev) => (prev ? { ...prev, job: { ...prev.job, ...updatedJob } } : null));
                  fetchApps(false);
                }}
              />
            </div>

            <div style={{ marginTop: 'var(--space-5)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn--ghost btn--sm" onClick={() => setConnection(null)}>
                Hide Contact Details
              </button>
            </div>
          </aside>
        )}

      </div>
    </AuthLayout>
  );
}
