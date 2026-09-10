import './ErrorMessage.css';

export default function ErrorMessage({ message }) {
  if (!message) return null;
  
  return (
    <div className="error-message-banner" role="alert">
      <svg className="error-message-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div className="error-message-text">{message}</div>
    </div>
  );
}
