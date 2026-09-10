import './ApplicationCard.css';

export default function ApplicationCard({ 
  application, 
  onWithdraw, 
  onAccept, 
  onReject, 
  onViewConnection,
  showJob = false, 
  processingApplicationId 
}) {
  const appId = application.id || application._id;
  const isProcessing = processingApplicationId && (processingApplicationId === appId);
  
  // Format status badge class
  const status = application.status || 'pending';
  const statusBadgeClass = `app-status-badge app-status-badge--${status}`;

  // Get job details safely
  const job = application.job;

  // Get worker details safely
  const worker = application.worker;

  const handleAcceptClick = () => {
    onAccept(appId);
  };

  const handleRejectClick = () => {
    onReject(appId);
  };

  return (
    <div className="app-card fade-in" role="group" aria-label={`Application ${status}`}>
      <div className="app-card__header">
        <span className={statusBadgeClass}>
          <span className="status-dot"></span>
          {status}
        </span>
        <span className="app-card__date muted">
          {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : ''}
        </span>
      </div>

      <div className="app-card__body">
        {/* If showing Job details (Worker View) */}
        {showJob && job && (
          <div className="app-card__job-details">
            <h4 className="app-card__job-title">{job.title}</h4>
            <p className="app-card__job-desc muted">{job.description}</p>
            <div className="app-card__job-meta">
              <span className="job-meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /></svg>
                {job.location}
              </span>
              <span className="job-meta-item job-meta-item--salary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: 4 }}>
                  <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-8" />
                </svg>
                <strong>₹ {job.salary}</strong>
              </span>
            </div>
          </div>
        )}

        {/* If showing Worker details (Customer View) */}
        {worker && (
          <div className="app-card__worker-details">
            <div className="app-card__worker-header">
              <div className="app-card__worker-avatar">
                {worker.name ? worker.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'W'}
              </div>
              <div>
                <h4 className="app-card__worker-name">{worker.name}</h4>
                <div className="app-card__worker-meta muted">
                  <span>{worker.location || 'Location unspecified'}</span>
                  <span>•</span>
                  <span className="experience-badge">{worker.experience ?? 0} Years Exp</span>
                </div>
              </div>
            </div>

            {worker.bio && <p className="app-card__worker-bio muted">{worker.bio}</p>}

            {Array.isArray(worker.skills) && worker.skills.length > 0 && (
              <div className="app-card__worker-skills">
                {worker.skills.slice(0, 5).map((skill, i) => (
                  <span key={i} className="skill-pill">{skill}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="app-card__actions">
        {/* Withdraw Action (Worker view) */}
        {onWithdraw && status === 'pending' && (
          <button 
            className="btn btn--danger app-action-btn" 
            onClick={() => onWithdraw(appId)} 
            disabled={isProcessing}
          >
            {isProcessing ? 'Withdrawing...' : 'Withdraw Application'}
          </button>
        )}

        {/* View Contact Details (Worker view for accepted applications) */}
        {onViewConnection && status === 'accepted' && (
          <button 
            className="btn btn--primary app-action-btn" 
            onClick={() => onViewConnection(appId)} 
            disabled={isProcessing}
          >
            {isProcessing ? 'Loading Details...' : 'View Contact Info'}
          </button>
        )}

        {/* Accept/Reject Actions (Customer view) */}
        {onAccept && status === 'pending' && (
          <button 
            className="btn btn--primary app-action-btn" 
            onClick={handleAcceptClick} 
            disabled={isProcessing}
          >
            {isProcessing ? 'Accepting...' : 'Accept'}
          </button>
        )}
        
        {onReject && status === 'pending' && (
          <button 
            className="btn btn--ghost app-action-btn" 
            onClick={handleRejectClick} 
            disabled={isProcessing}
          >
            {isProcessing ? 'Rejecting...' : 'Reject'}
          </button>
        )}
      </div>
    </div>
  );
}
