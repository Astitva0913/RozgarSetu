import { Link } from 'react-router-dom';
import './JobCard.css';

export default function JobCard({ job, onApply, applying, detailPath }) {
  const id = job._id || job.id;
  const skills = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
  const resolvedDetailPath = detailPath || `/worker/jobs/${id}`;

  return (
    <article className="job-card fade-in" aria-labelledby={`job-${id}-title`}>
      <div className="job-card__main">
        {/* Header Section */}
        <header className="job-card__header">
          <div className="job-card__title-area">
            <h3 id={`job-${id}-title`} className="job-card__title">
              {job.title}
            </h3>
            <span className={`job-status-badge job-status-badge--${job.status}`}>
              <span className="status-dot"></span>
              {job.status}
            </span>
          </div>
        </header>

        {/* Description */}
        <p className="job-card__description">{job.description}</p>

        {/* Metadata Details */}
        <div className="job-card__metadata">
          <div className="job-meta-item" title="Location">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2" />
            </svg>
            <span>{job.location}</span>
          </div>
          
          <div className="job-meta-item" title="Work Type">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <span>{job.workType}</span>
          </div>

          <div className="job-meta-item job-meta-item--salary" title="Salary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-8" />
            </svg>
            <strong className="salary-text">₹ {job.salary}</strong>
          </div>
        </div>

        {/* Skills Tag Cloud */}
        {skills.length > 0 && (
          <div className="job-card__skills" aria-label="Required skills">
            {skills.slice(0, 5).map((skill, index) => (
              <span key={index} className="skill-pill">
                {skill}
              </span>
            ))}
            {skills.length > 5 && (
              <span className="skill-pill skill-pill--more">
                +{skills.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Section */}
      <footer className="job-card__footer">
        <div className="job-card__actions">
          {onApply && (
            <button 
              className="btn btn--primary job-apply-btn" 
              type="button" 
              onClick={() => onApply(id)} 
              disabled={applying || job.status !== 'open'}
            >
              {applying ? (
                <>
                  <span className="btn-spinner" style={{ width: 14, height: 14, marginRight: 6 }} aria-hidden="true"></span>
                  Applying...
                </>
              ) : (
                'Apply Now'
              )}
            </button>
          )}
        </div>
        <Link to={resolvedDetailPath} className="job-card__details-link">
          <span>View Details</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </Link>
      </footer>
    </article>
  );
}
