import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from './AuthLayout';

const ROLE_HOME = { worker: '/worker', customer: '/customer', admin: '/admin' };

export default function RoleRoute({ allowedRoles = [], children }) {
  const { user, loading } = useAuth();

  if (loading) return <div />;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    const home = ROLE_HOME[user.role] || '/';
    return (
      <AuthLayout title="Access Denied">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-7) 0', textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="muted" style={{ margin: 0, maxWidth: 360 }}>
            You don't have permission to access this page. This section is restricted to <strong>{allowedRoles.join(' or ')}</strong> accounts.
          </p>
          <Link to={home} className="btn btn--secondary">
            Go to my Dashboard
          </Link>
        </div>
      </AuthLayout>
    );
  }
  return children;
}
