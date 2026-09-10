import { useState } from 'react';
import { startJobWork, finishJobWork } from '../api/workflow';

export default function WorkerWorkflowCard({ job, onWorkflowUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (!job) return null;

  const jobId = job.id || job._id;
  const workflowStatus = job.workflowStatus || 'worker_accepted';

  const handleStartWork = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await startJobWork(jobId);
      if (onWorkflowUpdate) onWorkflowUpdate(res.job);
    } catch (err) {
      setError(err.message || 'Failed to start work.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishWork = async () => {
    setLoading(true);
    setError('');
    setShowConfirmModal(false);
    try {
      const res = await finishJobWork(jobId);
      if (onWorkflowUpdate) onWorkflowUpdate(res.job);
    } catch (err) {
      setError(err.message || 'Failed to mark work as finished.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="card fade-in"
      style={{
        padding: 'var(--space-4)',
        border: '2px solid var(--color-primary)',
        backgroundColor: 'var(--color-surface)',
        boxShadow: 'var(--shadow-md)',
        marginTop: 'var(--space-3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary-dark)' }}>
          Job Execution Workflow
        </h4>
        <span
          className={`badge ${
            workflowStatus === 'paid'
              ? 'badge--success'
              : workflowStatus === 'completed' || workflowStatus === 'customer_confirmed'
              ? 'badge--success'
              : workflowStatus === 'in_progress'
              ? 'badge--warning'
              : 'badge--default'
          }`}
          style={{ textTransform: 'capitalize' }}
        >
          {workflowStatus.replace(/_/g, ' ')}
        </span>
      </div>

      {error && (
        <div className="alert alert--danger" style={{ padding: '8px 12px', fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-3)' }}>
          {error}
        </div>
      )}

      {/* STATE 1: Worker Accepted -> Start Work */}
      {workflowStatus === 'worker_accepted' && (
        <div>
          <p className="muted" style={{ fontSize: 'var(--font-size-xs)', margin: '0 0 var(--space-3)' }}>
            Your application was accepted by the employer! Click below once you arrive or start working on this job.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleStartWork}
            disabled={loading}
            style={{ width: '100%', padding: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {loading ? 'Starting Work...' : 'Start Work'}
          </button>
        </div>
      )}

      {/* STATE 2: Work In Progress -> Finish Work */}
      {workflowStatus === 'in_progress' && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'var(--color-warning-light)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <span style={{ fontSize: '18px' }}>🟢</span>
            <div>
              <strong style={{ display: 'block', fontSize: 'var(--font-size-sm)', color: 'var(--color-warning-dark)' }}>
                Work in Progress
              </strong>
              <span className="muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                Started: {formatDate(job.workStartedAt)}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setShowConfirmModal(true)}
            disabled={loading}
            style={{ width: '100%', padding: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {loading ? 'Submitting...' : 'Finish Work'}
          </button>
        </div>
      )}

      {/* STATE 3: Work Completed -> Waiting for customer confirmation */}
      {workflowStatus === 'completed' && (
        <div
          style={{
            backgroundColor: 'var(--color-background)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-success-dark)', marginBottom: 4 }}>
            <span style={{ fontSize: '18px' }}>✅</span>
            <strong style={{ fontSize: 'var(--font-size-sm)' }}>Work Completed</strong>
          </div>
          <p className="muted" style={{ fontSize: 'var(--font-size-xs)', margin: 0 }}>
            Completed on: {formatDate(job.workCompletedAt)}. Waiting for customer confirmation and payment.
          </p>
        </div>
      )}

      {/* STATE 4: Customer Confirmed -> Waiting for payment */}
      {workflowStatus === 'customer_confirmed' && (
        <div
          style={{
            backgroundColor: 'var(--color-success-light)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-success-dark)', marginBottom: 4 }}>
            <span style={{ fontSize: '18px' }}>✅</span>
            <strong style={{ fontSize: 'var(--font-size-sm)' }}>Work Confirmed by Customer</strong>
          </div>
          <p className="muted" style={{ fontSize: 'var(--font-size-xs)', margin: 0 }}>
            Customer has verified and confirmed the work. Waiting for Razorpay payment release.
          </p>
        </div>
      )}

      {/* STATE 5: Paid -> Payment Released */}
      {workflowStatus === 'paid' && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-success)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-success-dark)', marginBottom: 4 }}>
            <span style={{ fontSize: '18px' }}>💰</span>
            <strong style={{ fontSize: 'var(--font-size-sm)' }}>Payment Released</strong>
          </div>
          <p className="muted" style={{ fontSize: 'var(--font-size-xs)', margin: 0 }}>
            Payment has been successfully verified on {formatDate(job.paidAt)} and credited to your earnings summary.
          </p>
        </div>
      )}

      {/* Finish Work Confirmation Modal */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-4)',
          }}
        >
          <div
            className="card fade-in"
            style={{
              maxWidth: 420,
              width: '100%',
              backgroundColor: 'var(--color-surface)',
              boxShadow: 'var(--shadow-xl)',
              padding: 'var(--space-5)',
            }}
          >
            <h3 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--font-size-lg)' }}>Confirm Completion</h3>
            <p className="muted" style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-sm)', lineHeight: 1.5 }}>
              Are you sure you have completed this work?
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleFinishWork}
                disabled={loading}
              >
                {loading ? 'Confirming...' : 'Confirm Completion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
