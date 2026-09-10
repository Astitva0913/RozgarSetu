import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/');
  };

  const handleNavClick = () => setOpen(false);

  // Get user initials for the avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar__container">
        <div className="navbar__left">
          <Link to="/" className="navbar__brand" onClick={handleNavClick}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="navbar__logo" aria-hidden="true">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="var(--color-primary)" />
              <path d="M2 17L12 22L22 17" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Rozgaar<span className="navbar__brand--accent">Setu</span></span>
          </Link>
        </div>

        {/* Mobile Actions: Hamburger and optional Profile Initials */}
        <div className="navbar__mobile-actions">
          {user && (
            <div className="navbar__avatar-badge navbar__avatar-badge--mobile" aria-hidden="true">
              {getInitials(user.name)}
            </div>
          )}
          <button
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
            className={`navbar__hamburger ${open ? 'navbar__hamburger--open' : ''}`}
            onClick={() => setOpen((v) => !v)}
            type="button"
          >
            <span className="hamburger__bar" />
            <span className="hamburger__bar" />
            <span className="hamburger__bar" />
          </button>
        </div>

        {/* Navbar links & actions wrapper */}
        <div className={`navbar__menu ${open ? 'navbar__menu--open' : ''}`}>
          <div className="navbar__links">
            {user && user.role === 'worker' && (
              <>
                <NavLink to="/worker" end className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`} onClick={handleNavClick}>Dashboard</NavLink>
                <NavLink to="/worker/jobs" className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`} onClick={handleNavClick}>Find Jobs</NavLink>
                <NavLink to="/worker/applications" className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`} onClick={handleNavClick}>Applications</NavLink>
                <NavLink to="/worker/profile" className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`} onClick={handleNavClick}>Profile</NavLink>
              </>
            )}

            {user && user.role === 'customer' && (
              <>
                <NavLink to="/customer" end className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`} onClick={handleNavClick}>Dashboard</NavLink>
                <NavLink to="/customer/jobs" className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`} onClick={handleNavClick}>My Jobs</NavLink>
                <NavLink to="/customer/workers" className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`} onClick={handleNavClick}>Find Workers</NavLink>
              </>
            )}

            {user && user.role === 'admin' && (
              <>
                <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`} onClick={handleNavClick}>Dashboard</NavLink>
              </>
            )}

            {!user && (
              <>
                <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`} onClick={handleNavClick}>Home</NavLink>
                <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`} onClick={handleNavClick}>Login / Register</NavLink>
              </>
            )}
          </div>

          <div className="navbar__actions">
            {user ? (
              <div className="navbar__user-profile">
                <div className="navbar__user-info">
                  <span className="navbar__user-name">{user.name}</span>
                  <span className="navbar__user-role">{user.role}</span>
                </div>
                <div className="navbar__avatar-badge navbar__avatar-badge--desktop" aria-hidden="true">
                  {getInitials(user.name)}
                </div>
                <button type="button" className="btn btn--ghost btn--logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn--primary" onClick={handleNavClick}>Sign In</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
