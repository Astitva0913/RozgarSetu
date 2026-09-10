import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { searchWorkers, listMyJobs } from './api/customer';
import WorkerCard from './components/WorkerCard';
import Loading from './components/Loading';
import ErrorMessage from './components/ErrorMessage';
import EmptyState from './components/EmptyState';
import AuthLayout from './components/AuthLayout';

export default function CustomerWorkersPage() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('');
  
  // Selected worker state for modal
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [myJobs, setMyJobs] = useState([]);

  const fetchWorkers = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setSearching(true);
    setError('');
    try {
      const params = {};
      if (skills) params.skills = skills;
      if (location) params.location = location;
      const data = await searchWorkers(params);
      setWorkers(data.workers || []);
    } catch (err) {
      setError(err.message || 'Failed to load workers');
    } finally {
      if (showLoading) setLoading(false);
      else setSearching(false);
    }
  };

  const fetchCustomerJobs = async () => {
    try {
      const data = await listMyJobs({ limit: 10 });
      setMyJobs(data.jobs || []);
    } catch {
      // Non-critical, ignore error
    }
  };

  useEffect(() => {
    fetchWorkers(true);
    fetchCustomerJobs();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchWorkers(true);
  };

  const getInitials = (name) => {
    if (!name) return 'W';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  if (loading) return <Loading message="Searching for workers..." />;

  const cleanSelectedPhone = selectedWorker?.phone ? selectedWorker.phone.replace(/\D/g, '').slice(-10) : '';

  return (
    <AuthLayout title="Find Workers" subtitle="Search skilled local workers by profession and location.">
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

        {/* Search Panel */}
        <form onSubmit={handleSearch} className="card" style={{ padding: 'var(--space-5)' }}>
          <div className="search-grid">
            <div className="auth-field" style={{ margin: 0 }}>
              <label htmlFor="search-skills">Skills</label>
              <input
                id="search-skills"
                type="text"
                placeholder="e.g. Plumbing, Electrician"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </div>
            <div className="auth-field" style={{ margin: 0 }}>
              <label htmlFor="search-location">Location</label>
              <input
                id="search-location"
                type="text"
                placeholder="e.g. Delhi, Noida"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn--primary" disabled={loading || searching} style={{ padding: '12px 24px' }}>
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {error && <ErrorMessage message={error} />}

        {!loading && !error && workers.length === 0 ? (
          <EmptyState
            title="No workers found"
            description="No workers match your current filters. Try different skills or a broader location to find available workers."
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            }
            action={{ label: 'Clear Filters', onClick: () => { setSkills(''); setLocation(''); fetchWorkers(true); } }}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            {workers.map(w => (
              <WorkerCard
                key={w.id || w._id}
                worker={w}
                onSelect={(worker) => setSelectedWorker(worker)}
              />
            ))}
          </div>
        )}

        {/* Selected Worker & Hire Modal */}
        {selectedWorker && (
          <div
            className="worker-modal-backdrop"
            onClick={() => setSelectedWorker(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="selected-worker-name"
          >
            <div
              className="worker-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="worker-modal__header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div className="worker-card__avatar" style={{ width: 44, height: 44, fontSize: 'var(--font-size-md)' }}>
                    {getInitials(selectedWorker.name)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <h3 id="selected-worker-name" style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
                        {selectedWorker.name}
                      </h3>
                      {selectedWorker.isVerified && (
                        <span className="worker-verified-badge">✓ Verified</span>
                      )}
                    </div>
                    <span className="muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                      {selectedWorker.location || 'Location unspecified'} • {selectedWorker.experience ?? 0} Years Experience
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="worker-modal__close"
                  onClick={() => setSelectedWorker(null)}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="worker-modal__body">
                {/* Direct Contact Card */}
                {cleanSelectedPhone ? (
                  <div className="worker-modal__contact-box">
                    <div className="worker-modal__contact-info">
                      <span className="muted" style={{ fontSize: 'var(--font-size-xs)' }}>Direct Phone Contact</span>
                      <span className="worker-modal__contact-number">+91 {cleanSelectedPhone}</span>
                    </div>
                    <div className="worker-modal__contact-buttons">
                      <a
                        href={`tel:+91${cleanSelectedPhone}`}
                        className="btn btn--primary btn--sm"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        Call Now
                      </a>
                      <a
                        href={`https://wa.me/91${cleanSelectedPhone}?text=${encodeURIComponent(`Hello ${selectedWorker.name}, I found your profile on RozgaarSetu and would like to hire you for work.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn--secondary btn--sm"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        WhatsApp
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="card" style={{ padding: 'var(--space-3)', background: 'var(--color-background)' }}>
                    <span className="muted" style={{ fontSize: 'var(--font-size-sm)' }}>
                      Phone contact available once connection is accepted.
                    </span>
                  </div>
                )}

                {/* Bio / Summary */}
                {selectedWorker.bio && (
                  <div>
                    <h4 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--font-size-sm)' }}>About Worker</h4>
                    <p className="muted" style={{ margin: 0, fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
                      {selectedWorker.bio}
                    </p>
                  </div>
                )}

                {/* Skills */}
                {Array.isArray(selectedWorker.skills) && selectedWorker.skills.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--font-size-sm)' }}>Skills & Specialties</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {selectedWorker.skills.map((skill, index) => (
                        <span key={index} className="skill-tag" style={{ fontSize: 'var(--font-size-xs)', padding: '6px 12px' }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                  <div className="card" style={{ padding: 'var(--space-3)', background: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                    <span className="muted" style={{ fontSize: 'var(--font-size-xs)' }}>Work Type</span>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginTop: 2, textTransform: 'capitalize' }}>
                      {selectedWorker.workType || 'Flexible / Full-Time'}
                    </div>
                  </div>
                  <div className="card" style={{ padding: 'var(--space-3)', background: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                    <span className="muted" style={{ fontSize: 'var(--font-size-xs)' }}>Availability</span>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginTop: 2, textTransform: 'capitalize' }}>
                      {selectedWorker.availability || 'Available Now'}
                    </div>
                  </div>
                </div>

                {/* Post a Job CTA */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Have a specific job for {selectedWorker.name}?</div>
                    <div className="muted" style={{ fontSize: 'var(--font-size-xs)' }}>Post a job requirement so skilled workers can apply.</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={() => {
                      setSelectedWorker(null);
                      navigate('/customer/jobs');
                    }}
                  >
                    Post / Manage Jobs →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
