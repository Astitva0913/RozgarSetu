import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getJobDetail, applyToJob } from './api/worker';
import WorkerWorkflowCard from './components/WorkerWorkflowCard';
import Loading from './components/Loading';
import ErrorMessage from './components/ErrorMessage';
import AuthLayout from './components/AuthLayout';
import './components/job-detail.css';

export default function WorkerJobDetailPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchJob = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const data = await getJobDetail(jobId);
      setJob(data.job || null);
    } catch (err) {
      setError(err.message || 'Failed to load job details');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const handleApply = async () => {
    if (!confirm('Are you sure you want to apply to this job?')) return;
    setApplying(true);
    setError('');
    setSuccess('');
    try {
      await applyToJob(jobId);
      setSuccess('Applied successfully! You can track status under Applications.');
      await fetchJob(false);
    } catch (err) {
      setError(err.message || 'Failed to apply.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <Loading message="Loading job details..." />;
  if (error && !job) return <AuthLayout title="Job Details"><ErrorMessage message={error} /><div style={{ marginTop: 'var(--space-3)' }}><Link to="/worker/jobs" className="btn btn--secondary">← Back to Jobs</Link></div></AuthLayout>;
  if (!job) return <AuthLayout title="Job Details"><ErrorMessage message="Job not found." /><div style={{ marginTop: 12 }}><Link to="/worker/jobs" className="btn btn--secondary">← Back to Jobs</Link></div></AuthLayout>;

  const skills = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];

  return (
    <AuthLayout title="Job Details">
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        
        {/* Navigation & Alert header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/worker/jobs" className="btn btn--ghost btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to jobs
          </Link>
          <span className={`job-status-badge job-status-badge--${job.status}`}>
            <span className="status-dot"></span>
            {job.status}
          </span>
        </div>

        {/* Success / Error Alerts */}
        {success && (
          <div className="alert alert--success" role="alert">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            <span>{success}</span>
          </div>
        )}

        {/* Layout Grid Split */}
        <div className="job-detail__grid">
          
          {/* Left Main details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="job-detail__section card">
              <h3 className="job-detail__section-title" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                {job.title}
              </h3>
              
              <h4 style={{ fontSize: 'var(--font-size-md)', marginTop: 'var(--space-4)' }}>Job Overview</h4>
              <p className="muted" style={{ whiteSpace: 'pre-line', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
                {job.description}
              </p>
            </div>

            {skills.length > 0 && (
              <div className="job-detail__section card">
                <h4 style={{ marginTop: 0, marginBottom: 'var(--space-3)' }}>Required Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {skills.map((skill, index) => (
                    <span key={index} className="skill-pill" style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Action Summary Card */}
          <aside className="job-detail__aside">
            <div className="card job-detail__section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="job-detail__salary-highlight text-center" style={{ backgroundColor: 'var(--color-primary-light)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                <span className="muted" style={{ display: 'block', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Offered Salary</span>
                <strong style={{ display: 'block', fontSize: 'var(--font-size-2xl)', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)', marginTop: 'var(--space-1)' }}>
                  ₹ {job.salary}
                </strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--font-size-sm)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2" /></svg>
                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Location</span>
                    <strong style={{ color: 'var(--color-text)' }}>{job.location}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--font-size-sm)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Work Type</span>
                    <strong style={{ color: 'var(--color-text)' }}>{job.workType}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--font-size-sm)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <div>
                    <span className="muted" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Status</span>
                    <strong style={{ color: 'var(--color-text)', textTransform: 'capitalize' }}>{job.status}</strong>
                  </div>
                </div>
              </div>

              {/* Action Button Area */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                {job.hasApplied ? (
                  <div>
                    <div className="card text-center" style={{ backgroundColor: 'var(--color-primary-light)', border: '1px solid rgba(13, 148, 136, 0.1)', padding: 'var(--space-3)' }}>
                      <span className="muted" style={{ display: 'block', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', fontWeight: 700 }}>Application Status</span>
                      <strong style={{ display: 'block', fontSize: 'var(--font-size-md)', color: 'var(--color-primary-dark)', textTransform: 'uppercase', marginTop: 'var(--space-1)' }}>
                        {job.myApplicationStatus || 'pending'}
                      </strong>
                    </div>

                    {job.myApplicationStatus === 'accepted' && (
                      <WorkerWorkflowCard
                        job={job}
                        onWorkflowUpdate={(updatedJob) => setJob((prev) => ({ ...prev, ...updatedJob }))}
                      />
                    )}
                  </div>
                ) : (
                  job.status === 'open' ? (
                    <button 
                      type="button" 
                      className="btn btn--primary" 
                      onClick={handleApply} 
                      disabled={applying}
                      style={{ width: '100%', padding: '12px' }}
                    >
                      {applying ? 'Submitting Application...' : 'Apply for this Job'}
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      className="btn" 
                      disabled 
                      style={{ width: '100%', padding: '12px', backgroundColor: 'var(--color-border)', color: 'var(--color-text-light)' }}
                    >
                      Job Closed
                    </button>
                  )
                )}
              </div>
            </div>
          </aside>

        </div>
      </div>
    </AuthLayout>
  );
}
