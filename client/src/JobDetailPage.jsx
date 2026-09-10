import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMyJob, listApplicationsForJob, acceptApplication, rejectApplication, getAcceptedWorker } from './api/customer';
import { getJobPayment } from './api/payment';
import { confirmJobCompletion } from './api/workflow';
import ApplicationCard from './components/ApplicationCard';
import Loading from './components/Loading';
import ErrorMessage from './components/ErrorMessage';
import EmptyState from './components/EmptyState';
import AuthLayout from './components/AuthLayout';
import PaymentSection from './components/PaymentSection';
import './components/job-detail.css';

export default function JobDetailPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [acceptedWorker, setAcceptedWorker] = useState(null);
  const [jobPayment, setJobPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingAppId, setProcessingAppId] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const handleConfirmCompletion = async () => {
    setConfirming(true);
    setConfirmError('');
    setShowConfirmModal(false);
    try {
      const res = await confirmJobCompletion(jobId);
      setJob((prev) => ({ ...prev, ...res.job }));
    } catch (err) {
      setConfirmError(err.message || 'Failed to confirm work completion.');
    } finally {
      setConfirming(false);
    }
  };

  const fetchJobDetails = async (showLoading = true) => {
    if (showLoading) setLoading(true); 
    setError('');
    try {
      const j = await getMyJob(jobId);
      setJob(j.job || j);
      
      const apps = await listApplicationsForJob(jobId);
      setApplications(apps.applications || []);
      
      try {
        const aw = await getAcceptedWorker(jobId);
        setAcceptedWorker(aw.acceptedWorker || null);
      } catch {
        setAcceptedWorker(null);
      }

      try {
        const p = await getJobPayment(jobId);
        setJobPayment(p.payment || null);
      } catch {
        setJobPayment(null);
      }
    } catch (err) { 
      setError(err.message || 'Failed to load details.'); 
    } finally { 
      if (showLoading) setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchJobDetails(true); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const handleAccept = async (appId) => {
    if (!confirm('Are you sure you want to accept this worker? This will close the job and automatically reject all other pending applications.')) return;
    setProcessingAppId(appId);
    setError('');
    try {
      await acceptApplication(jobId, appId);
      await fetchJobDetails(false);
    } catch (err) {
      setError(err.message || 'Failed to accept application.');
    } finally {
      setProcessingAppId(null);
    }
  };

  const handleReject = async (appId) => {
    if (!confirm('Are you sure you want to reject this application?')) return;
    setProcessingAppId(appId);
    setError('');
    try {
      await rejectApplication(jobId, appId);
      await fetchJobDetails(false);
    } catch (err) {
      setError(err.message || 'Failed to reject application.');
    } finally {
      setProcessingAppId(null);
    }
  };

  if (loading) return <Loading message="Loading job details..." />;
  if (error && !job) return (
    <AuthLayout title="Job Posting Details">
      <ErrorMessage message={error} />
      <div style={{ marginTop: 'var(--space-3)' }}>
        <Link to="/customer/jobs" className="btn btn--secondary btn--sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to listings
        </Link>
      </div>
    </AuthLayout>
  );

  return (
    <AuthLayout title="Job Posting Details">
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        
        {/* Navigation & Status header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/customer/jobs" className="btn btn--ghost btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to listings
          </Link>
          <span className={`job-status-badge job-status-badge--${job?.status}`}>
            <span className="status-dot"></span>
            {job?.status}
          </span>
        </div>

        {/* Error message banner */}
        {error && <ErrorMessage message={error} />}

        {/* Details Grid Split */}
        <div className="job-detail__grid">
          
          {/* Left Column: Job Description & Accepted Worker details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="job-detail__section card">
              <h3 className="job-detail__section-title" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                {job?.title}
              </h3>
              
              <h4 style={{ fontSize: 'var(--font-size-md)', marginTop: 'var(--space-4)' }}>Work Overview</h4>
              <p className="muted" style={{ whiteSpace: 'pre-line', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
                {job?.description}
              </p>

              <h4 style={{ fontSize: 'var(--font-size-md)', marginTop: 'var(--space-4)' }}>Skills Required</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {Array.isArray(job?.requiredSkills) && job.requiredSkills.length > 0 ? (
                  job.requiredSkills.map((skill, index) => (
                    <span key={index} className="skill-pill" style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)' }}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="muted" style={{ fontSize: 'var(--font-size-sm)' }}>No specific skills specified</span>
                )}
              </div>
            </div>

            {/* Accepted Worker Contact Panel */}
            {acceptedWorker && (
              <div className="card fade-in" style={{ 
                border: '2px solid var(--color-success)', 
                backgroundColor: 'var(--color-surface)',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <header style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-success-dark)', fontWeight: 700 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    <span>Hired Worker Contact Details</span>
                  </div>
                </header>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 'var(--radius-full)', 
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', 
                      color: 'var(--color-surface)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 'var(--font-size-md)'
                    }}>
                      {acceptedWorker.worker.name ? acceptedWorker.worker.name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase() : 'W'}
                    </div>
                    <div>
                      <strong style={{ color: 'var(--color-text)', fontSize: 'var(--font-size-md)', display: 'block' }}>
                        {acceptedWorker.worker.name}
                      </strong>
                      <span className="muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                        {acceptedWorker.worker.location || 'Location unspecified'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      <div>
                        <span className="muted" style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Direct Phone</span>
                        <a href={`tel:${acceptedWorker.worker.phone}`} style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', textDecoration: 'underline' }}>
                          {acceptedWorker.worker.phone}
                        </a>
                      </div>
                    </div>

                    {acceptedWorker.worker.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        <div>
                          <span className="muted" style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Email Address</span>
                          <a href={`mailto:${acceptedWorker.worker.email}`} style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', textDecoration: 'underline' }}>
                            {acceptedWorker.worker.email}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Customer Workflow & Payment Section */}
            {acceptedWorker && (() => {
              const currentWorkflowStatus = job?.workflowStatus || (jobPayment?.status === 'paid' ? 'paid' : 'worker_accepted');
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {confirmError && (
                    <div className="alert alert--danger" style={{ padding: '8px 12px', fontSize: 'var(--font-size-xs)' }}>
                      {confirmError}
                    </div>
                  )}

                  {/* STATE 1: Waiting for worker to start */}
                  {currentWorkflowStatus === 'worker_accepted' && (
                    <div
                      className="card fade-in"
                      style={{
                        padding: 'var(--space-4)',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '20px' }}>🟡</span>
                        <div>
                          <strong style={{ display: 'block', fontSize: 'var(--font-size-sm)', color: 'var(--color-warning-dark)' }}>
                            Waiting for worker to start
                          </strong>
                          <span className="muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                            Worker {acceptedWorker.worker?.name} has been hired. You will see a live update here once they start the work.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STATE 2: Work in Progress */}
                  {currentWorkflowStatus === 'in_progress' && (
                    <div
                      className="card fade-in"
                      style={{
                        padding: 'var(--space-4)',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-warning)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-3)' }}>
                        <span style={{ fontSize: '20px' }}>🟢</span>
                        <div>
                          <strong style={{ display: 'block', fontSize: 'var(--font-size-md)', color: 'var(--color-warning-dark)' }}>
                            WORK IN PROGRESS
                          </strong>
                          <span className="muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                            Worker has started the work.
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          backgroundColor: 'var(--color-background)',
                          padding: 'var(--space-3)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--font-size-xs)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                      >
                        <div>
                          <span className="muted">Worker: </span>
                          <strong>{acceptedWorker.worker?.name}</strong>
                        </div>
                        <div>
                          <span className="muted">Started: </span>
                          <strong>{job?.workStartedAt ? new Date(job.workStartedAt).toLocaleString() : 'Recently'}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STATE 3: Work Completed -> Customer Confirm */}
                  {currentWorkflowStatus === 'completed' && (
                    <div
                      className="card fade-in"
                      style={{
                        padding: 'var(--space-4)',
                        backgroundColor: 'var(--color-surface)',
                        border: '2px solid var(--color-primary)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-3)' }}>
                        <span style={{ fontSize: '20px' }}>✅</span>
                        <div>
                          <strong style={{ display: 'block', fontSize: 'var(--font-size-md)', color: 'var(--color-text)' }}>
                            WORK COMPLETED
                          </strong>
                          <span className="muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                            The worker has marked this job as completed.
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          backgroundColor: 'var(--color-background)',
                          padding: 'var(--space-3)',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: 'var(--space-4)',
                          fontSize: 'var(--font-size-xs)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <div>
                          <span className="muted">Worker: </span>
                          <strong>{acceptedWorker.worker?.name}</strong>
                        </div>
                        <div>
                          <span className="muted">Job: </span>
                          <strong>{job?.title}</strong>
                        </div>
                        <div>
                          <span className="muted">Amount: </span>
                          <strong style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)' }}>
                            ₹ {job?.salary}
                          </strong>
                        </div>
                        {job?.workCompletedAt && (
                          <div>
                            <span className="muted">Completed: </span>
                            <strong>{new Date(job.workCompletedAt).toLocaleString()}</strong>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => setShowConfirmModal(true)}
                        disabled={confirming}
                        style={{ width: '100%', padding: '12px' }}
                      >
                        {confirming ? 'Confirming...' : 'Confirm Completion'}
                      </button>
                    </div>
                  )}

                  {/* STATE 4 & 5: Customer Confirmed or Paid -> Payment Ready / Receipt */}
                  {(currentWorkflowStatus === 'customer_confirmed' ||
                    currentWorkflowStatus === 'paid' ||
                    jobPayment?.status === 'paid') && (
                    <>
                      {currentWorkflowStatus === 'customer_confirmed' && jobPayment?.status !== 'paid' && (
                        <div
                          className="card fade-in"
                          style={{
                            padding: 'var(--space-3) var(--space-4)',
                            backgroundColor: 'var(--color-success-light)',
                            borderRadius: 'var(--radius-md)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-success-dark)' }}>
                            <span style={{ fontSize: '18px' }}>✅</span>
                            <strong style={{ fontSize: 'var(--font-size-sm)' }}>Work Confirmed</strong>
                          </div>
                          <p className="muted" style={{ fontSize: 'var(--font-size-xs)', margin: '4px 0 0' }}>
                            Work has been verified and confirmed. Payment is now ready to be released to the worker.
                          </p>
                        </div>
                      )}

                      <PaymentSection
                        job={job}
                        acceptedWorker={acceptedWorker}
                        initialPayment={jobPayment}
                        onPaymentSuccess={(newPayment) => {
                          setJobPayment(newPayment);
                          setJob((prev) => ({ ...prev, workflowStatus: 'paid', status: 'closed' }));
                          setApplications([]);
                        }}
                      />
                    </>
                  )}

                  {/* Customer Confirmation Modal */}
                  {showConfirmModal && (
                    <div
                      role="dialog"
                      aria-modal="true"
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: 'var(--space-4)',
                      }}
                    >
                      <div
                        className="card fade-in"
                        style={{
                          maxWidth: 440,
                          width: '100%',
                          backgroundColor: 'var(--color-surface)',
                          boxShadow: 'var(--shadow-xl)',
                          padding: 'var(--space-5)',
                        }}
                      >
                        <h3 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--font-size-lg)' }}>Confirm Work Completion</h3>
                        <p className="muted" style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-sm)', lineHeight: 1.5 }}>
                          Please confirm that the work has been completed satisfactorily.
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={() => setShowConfirmModal(false)}
                            disabled={confirming}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn--primary"
                            onClick={handleConfirmCompletion}
                            disabled={confirming}
                          >
                            {confirming ? 'Confirming...' : 'Confirm & Continue'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Right Column: Details Summary Card & Applicant Submissions */}
          <aside className="job-detail__aside" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="card job-detail__section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="job-detail__salary-highlight text-center" style={{ backgroundColor: 'var(--color-primary-light)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                <span className="muted" style={{ display: 'block', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Offered Salary</span>
                <strong style={{ display: 'block', fontSize: 'var(--font-size-2xl)', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)', marginTop: 'var(--space-1)' }}>
                  ₹ {job?.salary}
                </strong>
                {jobPayment?.status === 'paid' && (
                  <span className="badge badge--success" style={{ marginTop: 'var(--space-2)' }}>
                    ✓ Paid via Razorpay
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--font-size-sm)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2" /></svg>
                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Location</span>
                    <strong style={{ color: 'var(--color-text)' }}>{job?.location}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--font-size-sm)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Work Type</span>
                    <strong style={{ color: 'var(--color-text)' }}>{job?.workType}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Applications List card container */}
            <div className="card job-detail__section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h4 style={{ margin: 0, paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>
                Incoming Applications ({applications.length})
              </h4>
              
              {!applications.length ? (
                <EmptyState 
                  title="No Applications" 
                  description="No worker has applied to this job posting yet. Match alerts are sent automatically." 
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {applications.map(a => (
                    <ApplicationCard 
                      key={a.id || a._id} 
                      application={a} 
                      onAccept={handleAccept} 
                      onReject={handleReject} 
                      showJob={false} 
                      processingApplicationId={processingAppId} 
                    />
                  ))}
                </div>
              )}
            </div>
          </aside>

        </div>
      </div>
    </AuthLayout>
  );
}
