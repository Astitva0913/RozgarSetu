import './Loading.css';

export default function Loading({ message = 'Loading details...' }) {
  return (
    <div className="loading-container" role="status" aria-live="polite">
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner-circle" />
        <div className="loading-spinner-dot" />
      </div>
      <div className="loading-message">{message}</div>
    </div>
  );
}
