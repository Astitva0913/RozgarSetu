import { useEffect, useState } from 'react';
import { getProfile, updateProfile } from './api/worker';
import Loading from './components/Loading';
import ErrorMessage from './components/ErrorMessage';
import AuthLayout from './components/AuthLayout';

export default function WorkerProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;
    getProfile()
      .then((data) => { if (mounted) setProfile(data.user); })
      .catch((err) => { if (mounted) setError(err.message || 'Failed to load profile details.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: profile.name,
        location: profile.location,
        skills: profile.skills,
        experience: profile.experience,
        workType: profile.workType,
        availability: profile.availability,
        bio: profile.bio,
      };
      await updateProfile(payload);
      setSuccess('Profile updated successfully!');
      // Scroll to success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading message="Loading profile settings..." />;
  if (error && !profile) return <AuthLayout title="My Profile"><ErrorMessage message={error} /></AuthLayout>;

  // Initials for avatar
  const getInitials = (name) => {
    if (!name) return 'W';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <AuthLayout title="My Profile" subtitle="Manage your worker identity, skills, and availability.">
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        
        {/* Banner with initials avatar */}
        <section className="welcome-banner card">
          <div className="welcome-banner__avatar">
            {getInitials(profile?.name)}
          </div>
          <div className="welcome-banner__text">
            <h2>{profile?.name}</h2>
            <p className="muted">Worker Account • {profile?.phone}</p>
          </div>
        </section>

        {/* Form panel */}
        <form onSubmit={handleSave} className="card card--pad" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ margin: 0, paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>Personal Details</h3>
          
          {success && (
            <div className="alert alert--success" role="alert">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              <span>{success}</span>
            </div>
          )}

          {error && <ErrorMessage message={error} />}

          {/* Form Fields Grid */}
          <div className="grid-layout grid-layout--2">
            <div className="auth-field">
              <label htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                type="text"
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
                disabled={saving}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="profile-location">City / Location</label>
              <input
                id="profile-location"
                type="text"
                value={profile.location || ''}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                required
                disabled={saving}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="profile-experience">Experience (Years)</label>
              <input
                id="profile-experience"
                type="number"
                min={0}
                max={50}
                value={profile.experience ?? 0}
                onChange={(e) => setProfile({ ...profile, experience: Number(e.target.value) })}
                required
                disabled={saving}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="profile-worktype">Preferred Work Type</label>
              <input
                id="profile-worktype"
                type="text"
                placeholder="e.g. Electrician, Plumbing, Full-time"
                value={profile.workType || ''}
                onChange={(e) => setProfile({ ...profile, workType: e.target.value })}
                required
                disabled={saving}
              />
            </div>

            <div className="auth-field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="profile-skills">Skills (Comma separated)</label>
              <input
                id="profile-skills"
                type="text"
                placeholder="e.g. Repair, Wire Fitting, Maintenance"
                value={(profile.skills || []).join(', ')}
                onChange={(e) => setProfile({ ...profile, skills: e.target.value.split(',').map(s => s.trim()) })}
                disabled={saving}
              />
            </div>

            <div className="auth-field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="profile-availability">Availability Schedule</label>
              <input
                id="profile-availability"
                type="text"
                placeholder="e.g. Mon-Fri 9AM-6PM, Weekends Only"
                value={profile.availability || ''}
                onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="auth-field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="profile-bio">Short Biography / Bio</label>
              <textarea
                id="profile-bio"
                placeholder="Write a brief overview of your background, experience, and services..."
                rows={4}
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                disabled={saving}
              />
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn--primary" disabled={saving} style={{ padding: '12px 24px' }}>
              {saving ? (
                <>
                  <span className="btn-spinner" aria-hidden="true"></span>
                  Saving Changes...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>

      </div>
    </AuthLayout>
  );
}
