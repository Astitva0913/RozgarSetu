import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="footer-container">
        {/* Brand & Tagline */}
        <div className="footer-section footer-brand-section">
          <Link to="/" className="footer-brand-title" aria-label="RozgaarSetu Home">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="footer-logo"
              aria-hidden="true"
            >
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="var(--color-primary)" />
              <path d="M2 17L12 22L22 17" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Rozgaar<span className="footer-brand-accent">Setu</span></span>
          </Link>
          <p className="footer-tagline">
            A platform connecting workers and customers
          </p>
        </div>

        {/* Developer Attribution Card */}
        <div className="footer-section footer-dev-section">
          <span className="footer-dev-label">DEVELOPED BY</span>
          <h4 className="footer-dev-name">Astitva Yeotikar</h4>
          <p className="footer-dev-detail">B.Tech CSE | VIT Bhopal University</p>
          <p className="footer-dev-spec">Cybersecurity &amp; Digital Forensics</p>
          
          <a
            href="mailto:astitvayeotikar1309@gmail.com"
            className="footer-email-link"
            aria-label="Send email to Astitva Yeotikar at astitvayeotikar1309@gmail.com"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="footer-mail-icon"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <span>astitvayeotikar1309@gmail.com</span>
          </a>
        </div>

        {/* Copyright */}
        <div className="footer-section footer-bottom-section">
          <p className="footer-copyright">
            &copy; 2026 RozgaarSetu
          </p>
        </div>
      </div>
    </footer>
  );
}
