import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMyJobs, createJob, deleteMyJob } from './api/customer';
import JobCard from './components/JobCard';
import Loading from './components/Loading';
import ErrorMessage from './components/ErrorMessage';
import EmptyState from './components/EmptyState';
import AuthLayout from './components/AuthLayout';

export default function CustomerJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newJob, setNewJob] = useState({ title: '', description: '', requiredSkills: '', location: '', salary: 0, workType: '' });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchJobs = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const data = await listMyJobs();
      setJobs(data.jobs || []);
    } catch (err) { 
      setError(err.message || 'Failed to load job listings.'); 
    } finally { 
      if (showLoading) setLoading(false); 
    }
  };

  const navigate = useNavigate();

  useEffect(() => { 
    fetchJobs(true); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); 
    setSuccess('');

    if (!newJob.title.trim()) {
      setError('Please provide a job title.');
      return;
    }
    if (!newJob.description.trim()) {
      setError('Please provide a description of the work.');
      return;
    }
    if (!newJob.location.trim()) {
      setError('Please specify a job location.');
      return;
    }
    if (newJob.salary <= 0) {
      setError('Please enter a valid salary amount.');
      return;
    }
    if (newJob.salary > 10000) {
      setError('Salary cannot exceed the payment limit of ₹10,000.');
      return;
    }
    if (!newJob.workType.trim()) {
      setError('Please specify a work type (e.g. plumbing, full-time).');
      return;
    }

    setCreating(true);
    try {
      const payload = { 
        ...newJob, 
        requiredSkills: newJob.requiredSkills.split(',').map(s => s.trim()).filter(Boolean) 
      };
      await createJob(payload);
      setNewJob({ title: '', description: '', requiredSkills: '', location: '', salary: 0, workType: '' });
      setSuccess('Job posting created successfully!');
      await fetchJobs(false);
      // Scroll to list header
      document.getElementById('postings-header')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) { 
      setError(err.message || 'Failed to create job posting.'); 
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this job posting? This will remove all applications associated with it.')) return;
    setError(''); 
    setSuccess('');
    setDeleting(true);
    try { 
      await deleteMyJob(id); 
      setSuccess('Job posting deleted successfully.'); 
      await fetchJobs(false); 
    } catch (err) { 
      setError(err.message || 'Failed to delete job posting.'); 
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loading message="Loading jobs..." />;

  return (
    <AuthLayout title="Job Postings" subtitle="Post new local project opportunities or manage active listings.">
      <div className="fade-in cjobs-layout">
        
        {/* Left Side: Create Job form */}
        <section className="card card--pad" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ margin: 0, paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>Post a New Job</h3>
          
          {success && (
            <div className="alert alert--success" role="alert">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              <span>{success}</span>
            </div>
          )}

          {error && <ErrorMessage message={error} />}

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="auth-field">
              <label htmlFor="job-title">Job Title</label>
              <input 
                id="job-title"
                placeholder="e.g. Repair Kitchen Sink Leak" 
                value={newJob.title} 
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} 
                disabled={creating}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="job-desc">Work Description</label>
              <textarea 
                id="job-desc"
                placeholder="Describe the tasks, timings, tools required, etc..." 
                rows={4}
                value={newJob.description} 
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} 
                disabled={creating}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="job-skills">Required Skills (Comma separated)</label>
              <input 
                id="job-skills"
                placeholder="e.g. Plumbing, Sink Repair, Maintenance" 
                value={newJob.requiredSkills} 
                onChange={(e) => setNewJob({ ...newJob, requiredSkills: e.target.value })} 
                disabled={creating}
              />
            </div>

            <div className="grid-layout grid-layout--2">
              <div className="auth-field">
                <label htmlFor="job-location">Location / Area</label>
                <input 
                  id="job-location"
                  placeholder="e.g. Sector 15, Noida" 
                  value={newJob.location} 
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} 
                  disabled={creating}
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="job-worktype">Work Type / Frequency</label>
                <input 
                  id="job-worktype"
                  placeholder="e.g. One-time job, Hourly" 
                  value={newJob.workType} 
                  onChange={(e) => setNewJob({ ...newJob, workType: e.target.value })} 
                  disabled={creating}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="job-salary">Offered Salary (₹ or rate, max ₹10,000)</label>
              <input 
                id="job-salary"
                type="number" 
                min={0}
                max={10000}
                placeholder="e.g. 1500 (max 10,000)" 
                value={newJob.salary || ''} 
                onChange={(e) => setNewJob({ ...newJob, salary: Number(e.target.value) })} 
                disabled={creating}
                required
              />
            </div>

            <div style={{ marginTop: 'var(--space-2)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn--primary" disabled={creating} style={{ width: '100%', padding: '12px' }}>
                {creating ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true"></span>
                    Creating Job Posting...
                  </>
                ) : (
                  'Create Job'
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Right Side: Active Listings list */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 id="postings-header" style={{ margin: 0, paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>
            My Active Listings
          </h3>

          {jobs.length === 0 ? (
            <EmptyState
              title="No job postings yet"
              description="You haven't posted any jobs. Use the form on the left to create your first listing and find skilled workers."
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              }
              action={{
                label: 'Post a Job',
                onClick: () => document.getElementById('job-title')?.focus()
              }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {jobs.map(j => (
                <div key={j._id || j.id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <JobCard job={j} detailPath={`/customer/jobs/${j._id || j.id}`} />
                  
                  {/* Action panel underneath card */}
                  <div style={{ display: 'flex', gap: 'var(--space-3)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
                    <button 
                      className="btn btn--secondary" 
                      onClick={() => navigate(`/customer/jobs/${j._id || j.id}`)}
                      disabled={deleting}
                      style={{ flex: 1, padding: '8px 16px', fontSize: 'var(--font-size-xs)' }}
                    >
                      View Applications
                    </button>
                    <button 
                      className="btn btn--danger" 
                      onClick={() => handleDelete(j._id || j.id)}
                      disabled={deleting || creating}
                      style={{ flex: 0.5, padding: '8px 16px', fontSize: 'var(--font-size-xs)' }}
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </AuthLayout>
  );
}
