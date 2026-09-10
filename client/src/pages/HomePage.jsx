import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import workerImg from '../assets/worker-login.jpg';
import customerImg from '../assets/customer-login.jpg';
import './HomePage.css';

function HomePage() {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('/api/v1/health')
      .then((res) => {
        if (!res.ok) throw new Error('Health check failed');
        return res.json();
      })
      .then((data) => setHealth(data))
      .catch((err) => console.error('Health check failed:', err.message));
  }, []);

  // Redirect already-authenticated users straight to their dashboard
  if (user) {
    if (user.role === 'worker') return <Navigate to="/worker" replace />;
    if (user.role === 'customer') return <Navigate to="/customer" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
  }

  return (
    <div className="landing fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        {/* Background decorative dots */}
        <div className="hero-deco-dots hero-deco-dots--top" aria-hidden="true"></div>
        <div className="hero-deco-dots hero-deco-dots--bottom" aria-hidden="true"></div>
        
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="hero-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              LOCAL LABOUR MARKETPLACE
            </span>

            <h1 className="hero-title">
              <span className="brand-rozgaar">Rozgaar</span><span className="brand-accent">Setu</span>
            </h1>

            <p className="hero-subtitle">
              <span className="sub-blue">Find work.</span> <span className="sub-green">Find workers.</span> <span className="sub-orange">Get things done.</span>
            </p>

            <p className="hero-desc">
              RozgaarSetu bridges the gap between local customers and skilled workers. Post projects, find opportunities, and connect directly in your community—all protected by secure logins.
            </p>
            
            <div className="hero-ctas">
              <Link to="/login" state={{ preferredRole: 'worker' }} className="btn btn--hero-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                Find Work
              </Link>
              <Link to="/login" state={{ preferredRole: 'customer' }} className="btn btn--hero-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Hire a Worker
              </Link>
            </div>
          </div>
          
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-image-stack">
              <div className="hero-image-wrapper hero-image-wrapper--worker">
                <img src={workerImg} alt="Worker on RozgaarSetu" className="hero-image" />
                <span className="image-label image-label--worker">Worker Portal</span>
              </div>
              <div className="hero-image-wrapper hero-image-wrapper--customer">
                <img src={customerImg} alt="Customer on RozgaarSetu" className="hero-image" />
                <span className="image-label image-label--customer">Client Portal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title text-center">Why use RozgaarSetu?</h2>
          <p className="section-desc text-center muted">A safe, simple, and effective way to connect with community services.</p>
          
          <div className="features-grid">
            {/* Card 1: Blue - Secure & Trusted */}
            <div className="feature-card feature-card--blue card">
              <div className="feature-card__icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <h4>Secure &amp; Trusted</h4>
              <p className="muted">Verified users and secure logins ensure a safe experience for all.</p>
            </div>

            {/* Card 2: Green - Local Connections */}
            <div className="feature-card feature-card--green card">
              <div className="feature-card__icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h4>Local Connections</h4>
              <p className="muted">Connect with trusted workers and clients in your community.</p>
            </div>

            {/* Card 3: Orange/Yellow - Fast & Efficient */}
            <div className="feature-card feature-card--orange card">
              <div className="feature-card__icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h4>Fast &amp; Efficient</h4>
              <p className="muted">Post tasks, find matches, and get things done quickly.</p>
            </div>

            {/* Card 4: Purple - Wide Opportunities */}
            <div className="feature-card feature-card--purple card">
              <div className="feature-card__icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
              </div>
              <h4>Wide Opportunities</h4>
              <p className="muted">From small jobs to big projects, opportunities for everyone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selection Cards */}
      <section className="role-section">
        <div className="container">
          <h2 className="section-title text-center">How do you want to use RozgaarSetu?</h2>
          <p className="section-desc text-center muted text-center-sub">Select your path below to login or create your profile.</p>
          
          <div className="role-cards-grid">
            {/* Worker Card */}
            <Link to="/login" state={{ preferredRole: 'worker' }} className="role-card-item card" aria-label="Find Work as Worker">
              <div className="role-card-media">
                <img src={workerImg} alt="Worker holding tools" className="role-card-img" />
              </div>
              <div className="role-card-body">
                <h3>Find Work</h3>
                <p className="muted">Discover local jobs, apply to customers, and track accepted responses near you.</p>
                <ul className="role-features-list" aria-label="Worker benefits">
                  <li>
                    <svg className="bullet-check" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Find local openings instantly
                  </li>
                  <li>
                    <svg className="bullet-check" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Apply in a single click
                  </li>
                  <li>
                    <svg className="bullet-check" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Manage pending details &amp; status
                  </li>
                </ul>
                <div className="role-card-cta">
                  <span>Find Work</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </div>
              </div>
            </Link>

            {/* Customer Card */}
            <Link to="/login" state={{ preferredRole: 'customer' }} className="role-card-item card" aria-label="Hire a Worker as Customer">
              <div className="role-card-media">
                <img src={customerImg} alt="Customer discussing job" className="role-card-img" />
              </div>
              <div className="role-card-body">
                <h3>Hire a Worker</h3>
                <p className="muted">Find skilled local labor for repairs, constructions, or domestic services.</p>
                <ul className="role-features-list" aria-label="Customer benefits">
                  <li>
                    <svg className="bullet-check" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Post local listings for free
                  </li>
                  <li>
                    <svg className="bullet-check" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Review incoming application details
                  </li>
                  <li>
                    <svg className="bullet-check" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Accept providers and coordinate
                  </li>
                </ul>
                <div className="role-card-cta">
                  <span>Hire a Worker</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </div>
              </div>
            </Link>
          </div>

          <div className="sign-in-prompt card">
            <span className="muted">Already have an account on RozgaarSetu?</span>
            <Link to="/login" className="btn btn--secondary">
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
