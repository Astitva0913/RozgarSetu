import { useState, useEffect } from 'react';
import { createPaymentOrder, verifyPayment } from '../api/payment';
import { loadRazorpayScript } from '../utils/loadRazorpay';
import { useAuth } from '../context/AuthContext';

export const PAYMENT_LIMIT = 10000;

export default function PaymentSection({
  job,
  acceptedWorker,
  initialPayment = null,
  onPaymentSuccess,
}) {
  const { user } = useAuth();
  const [payment, setPayment] = useState(initialPayment);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(initialPayment?.status || 'unpaid'); // 'unpaid' | 'processing' | 'failed' | 'paid'
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  useEffect(() => {
    if (initialPayment) {
      setPayment(initialPayment);
      setPaymentStatus(initialPayment.status || 'paid');
    }
  }, [initialPayment]);

  if (!job || !acceptedWorker) return null;

  const jobSalary = Number(job.salary) || 0;
  const isOverLimit = jobSalary > PAYMENT_LIMIT;
  const commissionRate = 0.10; // 10% transparent platform fee
  const calculatedCommission = Math.round(jobSalary * commissionRate * 100) / 100;
  const calculatedWorkerAmount = Math.round((jobSalary - calculatedCommission) * 100) / 100;

  const handlePayNow = async () => {
    if (isOverLimit) {
      setErrorMessage(`Payment amount exceeds the maximum limit of ₹${PAYMENT_LIMIT.toLocaleString('en-IN')}.`);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setShowConfigHelp(false);

    try {
      // 1. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Could not load Razorpay payment SDK. Please check your network connection.');
      }

      // 2. Create Razorpay order on the backend
      const res = await createPaymentOrder({
        jobId: job.id || job._id,
      });

      const { order, keyId, breakdown } = res;

      // 3. Configure Razorpay Checkout options supporting UPI, Cards, Netbanking, Wallets
      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'RozgaarSetu',
        description: `Payment for: ${job.title}`,
        order_id: order.id,
        prefill: {
          name: user?.name || '',
          contact: user?.phone || '',
          email: user?.email || '',
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay via UPI',
                instruments: [{ method: 'upi' }],
              },
              card: {
                name: 'Cards',
                instruments: [{ method: 'card' }],
              },
              netbanking: {
                name: 'Netbanking',
                instruments: [{ method: 'netbanking' }],
              },
              wallet: {
                name: 'Wallets',
                instruments: [{ method: 'wallet' }],
              },
            },
            sequence: ['block.upi', 'block.card', 'block.netbanking', 'block.wallet'],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        theme: {
          color: '#2563eb', // Royal Blue matching RozgaarSetu brand
        },
        handler: async (response) => {
          setLoading(true);
          try {
            // 4. Cryptographic backend verification
            const verifyRes = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            const verifiedPayment = verifyRes.payment || {
              ...verifyRes,
              amount: jobSalary,
              paymentMethod: verifyRes.payment?.paymentMethod || 'upi',
              platformCommission: breakdown?.platformCommission || calculatedCommission,
              workerAmount: breakdown?.workerAmount || calculatedWorkerAmount,
              razorpayPaymentId: response.razorpay_payment_id,
            };

            setPayment(verifiedPayment);
            setPaymentStatus('paid');
            if (onPaymentSuccess) {
              onPaymentSuccess(verifiedPayment);
            }
          } catch (verifyErr) {
            console.error('Verification failed:', verifyErr);
            setPaymentStatus('failed');
            setErrorMessage(verifyErr.message || 'Payment verification failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setPaymentStatus('failed');
            setErrorMessage('Payment was not completed.');
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (resp) => {
        setLoading(false);
        setPaymentStatus('failed');
        setErrorMessage(resp.error?.description || 'Payment was not completed.');
      });

      rzp.open();
    } catch (err) {
      setLoading(false);
      setPaymentStatus('failed');
      const isMissingConfig = err.message && (
        err.message.includes('Razorpay credentials are not configured') ||
        err.message.includes('503')
      );
      if (isMissingConfig) {
        setShowConfigHelp(true);
      }
      setErrorMessage(err.message || 'Payment initiation failed.');
    }
  };

  // SUCCESS STATE (Rendered when payment is verified or already paid)
  if (paymentStatus === 'paid' && payment) {
    return (
      <div
        className="card fade-in"
        style={{
          border: '2px solid var(--color-success)',
          backgroundColor: 'var(--color-surface)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <header
          style={{
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--color-success-dark)',
              fontWeight: 700,
              fontSize: 'var(--font-size-md)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Payment Successful</span>
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div
            style={{
              backgroundColor: 'var(--color-success-light)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="muted" style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', fontWeight: 700 }}>
                Payment ID
              </span>
              <strong style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}>
                {payment.razorpayPaymentId || payment.razorpayOrderId || 'Verified'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="muted" style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', fontWeight: 700 }}>
                Amount Paid
              </span>
              <strong style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-success-dark)' }}>
                ₹ {payment.amount || jobSalary}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 'var(--font-size-xs)' }}>
              <span className="muted">Payment Method:</span>
              <strong style={{ textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                {payment.paymentMethod === 'card'
                  ? '💳 Card'
                  : payment.paymentMethod === 'netbanking'
                  ? '🏦 Netbanking'
                  : payment.paymentMethod === 'wallet'
                  ? '👛 Wallet'
                  : '⚡ UPI'}
              </strong>
            </div>

            <div style={{ borderTop: '1px dashed rgba(16, 185, 129, 0.3)', margin: '8px 0', paddingTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: 4 }}>
                <span className="muted">Worker:</span>
                <strong>{acceptedWorker.worker?.name || 'Assigned Worker'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: 4 }}>
                <span className="muted">Job:</span>
                <strong>{job.title}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', marginBottom: 4 }}>
                <span className="muted">RozgaarSetu Commission (10%):</span>
                <span>₹ {payment.platformCommission ?? calculatedCommission}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
                <span className="muted">Worker Amount:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  ₹ {payment.workerAmount ?? calculatedWorkerAmount}
                </span>
              </div>
            </div>
          </div>

          <p className="muted" style={{ fontSize: 'var(--font-size-xs)', margin: 'var(--space-2) 0 0', textAlign: 'center' }}>
            Payment completed via Razorpay. A receipt has been recorded on RozgaarSetu.
          </p>

          <div
            style={{
              marginTop: 'var(--space-3)',
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--color-success-light)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success-dark)', fontWeight: 600 }}>
              ✓ Work completed & payment finalized. The application has been closed and removed automatically.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // PENDING / CHECKOUT STATE
  return (
    <div
      className="card fade-in"
      style={{
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <header
        style={{
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary)', fontWeight: 700 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          <span style={{ fontSize: 'var(--font-size-md)' }}>Payment Summary</span>
        </div>
      </header>

      {/* Config Guide Alert if keys are missing */}
      {showConfigHelp && (
        <div
          className="alert alert--warning"
          role="alert"
          style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-xs)', lineHeight: 1.5 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <strong>Razorpay TEST MODE Setup Required:</strong>
            <p style={{ margin: '4px 0 0' }}>
              Add your test keys in <code>server/.env</code>:
              <br />
              <code>RAZORPAY_KEY_ID=rzp_test_...</code>
              <br />
              <code>RAZORPAY_KEY_SECRET=...</code>
            </p>
          </div>
        </div>
      )}

      {/* Error / Cancellation Feedback */}
      {errorMessage && (
        <div
          className="alert alert--danger"
          role="alert"
          style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Transparent Breakdown Box */}
      <div
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
          <span className="muted">Job Amount</span>
          <strong>₹ {jobSalary}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
          <span className="muted">RozgaarSetu Commission (10%)</span>
          <span className="muted">₹ {calculatedCommission}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
          <span className="muted">Worker Amount</span>
          <strong style={{ color: 'var(--color-primary)' }}>₹ {calculatedWorkerAmount}</strong>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: 'var(--space-3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <strong style={{ fontSize: 'var(--font-size-md)' }}>Total to Pay</strong>
          <strong style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
            ₹ {jobSalary}
          </strong>
        </div>
      </div>

      {isOverLimit && (
        <div
          className="alert alert--error"
          role="alert"
          style={{ marginBottom: 'var(--space-3)' }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Payment amount exceeds the maximum limit of ₹{PAYMENT_LIMIT.toLocaleString('en-IN')}. Please adjust the job salary to proceed.</span>
        </div>
      )}

      {/* Accepted Payment Methods Note */}
      <div
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3)',
          border: '1px solid var(--color-border)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
          Accepted Payment Methods (Razorpay Checkout)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: 'var(--font-size-xs)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, backgroundColor: 'rgba(37, 99, 235, 0.08)', color: 'var(--color-primary)', fontWeight: 600 }}>
            ⚡ UPI (GPay, PhonePe, Paytm, QR)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
            💳 Cards
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
            🏦 Netbanking
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
            👛 Wallets
          </span>
        </div>
      </div>

      {/* Pay / Retry Button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <button
          className="btn btn--primary btn--lg"
          onClick={handlePayNow}
          disabled={loading || jobSalary <= 0 || isOverLimit}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {isOverLimit ? (
            <span>Amount Exceeds ₹10,000 Limit</span>
          ) : loading ? (
            <>
              <span className="btn-spinner" />
              <span>Opening Razorpay Checkout...</span>
            </>
          ) : paymentStatus === 'failed' ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>Try Again (Pay ₹{jobSalary})</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              <span>Pay ₹{jobSalary}</span>
            </>
          )}
        </button>

        <span className="muted text-center" style={{ fontSize: '11px' }}>
          🔒 Powered by Razorpay (Test Mode). Supports UPI, Cards, Netbanking & Wallets.
        </span>
      </div>
    </div>
  );
}
