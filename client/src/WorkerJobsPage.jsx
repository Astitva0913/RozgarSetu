import { useEffect, useState } from 'react';
import { listOpenJobs, applyToJob } from './api/worker';
import JobCard from './components/JobCard';
import Loading from './components/Loading';
import ErrorMessage from './components/ErrorMessage';
import EmptyState from './components/EmptyState';
import AuthLayout from './components/AuthLayout';

export default function WorkerJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page] = useState(1);
  const [applyingJobId, setApplyingJobId] = useState(null);

  const fetchJobs = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const data = await listOpenJobs(page, 20);
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err.message || 'Failed to load open jobs');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => { 
    fetchJobs(true); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = async (jobId) => {
    setApplyingJobId(jobId);
    setError('');
    setSuccess('');
    try {
      await applyToJob(jobId);
      setSuccess('Applied to job successfully!');
      // Refresh jobs list to sync the hasApplied status
      await fetchJobs(false);
    } catch (err) {
      setError(err.message || 'Failed to apply to this job.');
    } finally {
      setApplyingJobId(null);
    }
  };

  if (loading) return <Loading message="Loading open jobs..." />;

  return (
    <AuthLayout title="Available Jobs" subtitle="Explore work opportunities in your area.">
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        
        {/* Success Banner */}
        {success && (
          <div className="alert alert--success" role="alert">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            <span>{success}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && <ErrorMessage message={error} />}

        {/* Empty State — only when no error and no jobs */}
        {!error && jobs.length === 0 ? (
          <EmptyState
            title="No jobs available right now"
            description="All openings are currently filled. Check back soon or update your profile skills to get better matches."
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                <line x1="12" y1="12" x2="12" y2="16" />
                <line x1="10" y1="14" x2="14" y2="14" />
              </svg>
            }
          />
        ) : (
          /* Jobs Grid Layout */
          <div className="grid-layout" style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {jobs.map(j => (
              <JobCard 
                key={j._id || j.id} 
                job={j} 
                onApply={handleApply} 
                applying={applyingJobId === (j._id || j.id)} 
              />
            ))}
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
