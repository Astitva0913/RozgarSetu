import './EmptyState.css';

const DefaultIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
    <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function EmptyState({ title, description, icon, action }) {
  return (
    <div className="empty-state-container" role="status">
      <div className="empty-state-illustration" aria-hidden="true">
        {icon ?? <DefaultIcon />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && (
        <button className="btn btn--secondary btn--sm empty-state-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
