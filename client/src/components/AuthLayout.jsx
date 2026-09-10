import './AuthLayout.css';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__container">
        {title && (
          <header className="auth-layout__header">
            <h1>{title}</h1>
            {subtitle && <p className="muted">{subtitle}</p>}
          </header>
        )}

        <div className="auth-layout__content">{children}</div>
      </div>
    </div>
  );
}
