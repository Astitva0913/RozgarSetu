import './WorkerCard.css';

export default function WorkerCard({ worker, onSelect }) {
  const getInitials = (name) => {
    if (!name) return 'W';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const skills = Array.isArray(worker.skills) ? worker.skills : [];
  const cleanPhone = worker.phone ? worker.phone.replace(/\D/g, '').slice(-10) : '';

  return (
    <article className="worker-card fade-in" aria-label={`Worker ${worker.name}`}>
      <div className="worker-card__header">
        <div className="worker-card__avatar" aria-hidden="true">
          {getInitials(worker.name)}
        </div>
        <div className="worker-card__identity">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h3 className="worker-card__name">{worker.name}</h3>
            {worker.isVerified && (
              <span className="worker-verified-badge" title="Verified Worker">
                ✓ Verified
              </span>
            )}
          </div>
          
          <div className="worker-card__meta">
            <span className="worker-meta-item" title="Location">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2" />
              </svg>
              {worker.location || 'Location unspecified'}
            </span>

            <span className="worker-meta-item worker-meta-item--exp" title="Experience">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {worker.experience ?? 0} Yrs Exp
            </span>

            {worker.workType && (
              <span className="worker-meta-item worker-meta-item--worktype" title="Work Type">
                {worker.workType}
              </span>
            )}
          </div>
        </div>
      </div>

      {worker.bio && <p className="worker-card__bio">{worker.bio}</p>}

      {skills.length > 0 && (
        <div className="worker-card__skills" aria-label="Skills">
          {skills.slice(0, 6).map((skill, index) => (
            <span key={index} className="skill-tag">
              {skill}
            </span>
          ))}
          {skills.length > 6 && (
            <span className="skill-tag skill-tag--more">
              +{skills.length - 6} more
            </span>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="worker-card__actions">
        <button
          type="button"
          className="btn btn--primary btn--sm worker-select-btn"
          onClick={() => onSelect && onSelect(worker)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Select & Hire
        </button>

        {cleanPhone && (
          <div className="worker-card__quick-contact">
            <a
              href={`tel:+91${cleanPhone}`}
              className="btn btn--secondary btn--sm worker-contact-icon-btn"
              title={`Call ${worker.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Call
            </a>
            <a
              href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${worker.name}, I found your profile on RozgaarSetu and would like to discuss work opportunities.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost btn--sm worker-contact-icon-btn"
              title="Message on WhatsApp"
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              WhatsApp
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
