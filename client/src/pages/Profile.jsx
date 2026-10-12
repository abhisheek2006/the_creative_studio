import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserAuth } from '../context/UserAuthContext';
import api, { extractError } from '../services/api';
import { useToast } from '../context/ToastContext';
import { PageLoader } from '../components/Loader';
import { Squiggle } from '../components/Doodles';
import Seo from '../components/Seo';

const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_APP_ID
);

function GoogleG({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 36.7 44 33 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

export default function Profile() {
  const {
    admin,
    loading: adminLoading,
    login: adminLogin,
    loginWithGoogle: adminLoginGoogle,
    logout: adminLogout,
  } = useAuth();
  const {
    user,
    loading: userLoading,
    loginWithGoogle,
    logout: userLogout,
    refreshMe,
  } = useUserAuth();
  const toast = useToast();

  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);

  // Admin email/password form
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminError, setAdminError] = useState('');

  const [userBusy, setUserBusy] = useState(false);
  const [adminBusy, setAdminBusy] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '' });
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/auth/me', { name: form.name, phone: form.phone });
      await refreshMe();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUserGoogle = async () => {
    setUserBusy(true);
    try {
      await loginWithGoogle();
      toast.success('Signed in with Google');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setUserBusy(false);
    }
  };

  const handleUserLogout = async () => {
    await userLogout();
    toast.success('Signed out');
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError('');
    setAdminSubmitting(true);
    try {
      await adminLogin(adminEmail.trim(), adminPassword);
      toast.success('Logged in to admin');
    } catch (err) {
      setAdminError(extractError(err, 'Invalid email or password.'));
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleAdminGoogle = async () => {
    setAdminBusy(true);
    setAdminError('');
    try {
      await adminLoginGoogle();
      toast.success('Logged in to admin');
    } catch (err) {
      setAdminError(extractError(err));
    } finally {
      setAdminBusy(false);
    }
  };

  const handleAdminLogout = async () => {
    await adminLogout();
    toast.success('Logged out of admin');
  };

  if (adminLoading || userLoading) return <PageLoader full />;

  return (
    <>
      <Seo title="My Profile — The Creative Studio" path="/profile" />
      <div className="container">
        <div className="page-head">
          <span className="kicker hand">your space</span>
          <h1>My Profile</h1>
          <Squiggle color="#C6A0F5" />
        </div>

        <div className="profile-grid">
          {/* ---- Customer account ---- */}
          <div className="form-card profile-card">
            <h2 className="profile-title">Account</h2>
            {user ? (
              <>
                {user.photoUrl && (
                  <img className="profile-avatar" src={user.photoUrl} alt={user.name} referrerPolicy="no-referrer" />
                )}
                <form onSubmit={handleSave}>
                  <div className="field">
                    <label htmlFor="name">Full name</label>
                    <input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="phone">Phone</label>
                    <input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="email">Email</label>
                    <input id="email" value={user.email || ''} readOnly disabled />
                  </div>
                  <div className="profile-actions">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                    <Link to="/orders" className="btn btn-outline">My Orders</Link>
                    <button type="button" onClick={handleUserLogout} className="btn btn-outline">
                      Sign out
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <p className="muted small" style={{ marginBottom: '1rem' }}>
                  Sign in to save your details and manage your account. We use Google for a quick, secure sign-in.
                </p>
                {!isFirebaseConfigured && (
                  <p className="error-banner">
                    Google sign-in isn't configured yet — add VITE_FIREBASE_* values to the environment.
                  </p>
                )}
                <button type="button" onClick={handleUserGoogle} className="btn btn-google btn-lg btn-block" disabled={userBusy || !isFirebaseConfigured}>
                  {userBusy ? <span className="spinner" /> : <GoogleG />}
                  {userBusy ? 'Signing in…' : 'Continue with Google'}
                </button>
                <p className="small muted" style={{ textAlign: 'center', marginTop: '1rem' }}>
                  New here? You get an account automatically on first sign-in.
                </p>
              </>
            )}
          </div>

          {/* ---- Admin panel ---- */}
          <div className="form-card profile-card">
            <h2 className="profile-title">Admin</h2>
            {admin ? (
              <>
                <p className="muted small" style={{ margin: '0 0 1rem' }}>
                  Signed in as <strong>{admin.name}</strong> ({admin.email}) · {admin.role}
                </p>
                <div className="profile-actions">
                  <Link to="/admin" className="btn btn-primary">Open dashboard</Link>
                  <button type="button" onClick={handleAdminLogout} className="btn btn-outline">
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="muted small" style={{ marginBottom: '1rem' }}>
                  Dashboard access for studio staff.
                </p>
                {adminError && <div className="error-banner">{adminError}</div>}
                <form onSubmit={handleAdminLogin} noValidate>
                  <div className="field">
                    <label htmlFor="a-email">Email</label>
                    <input id="a-email" type="email" autoComplete="username" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label htmlFor="a-pass">Password</label>
                    <input id="a-pass" type="password" autoComplete="current-password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={adminSubmitting}>
                    {adminSubmitting ? <span className="spinner" /> : 'Sign in'}
                    {adminSubmitting ? ' Signing in…' : ''}
                  </button>
                </form>

                <div className="auth-divider"><span>or</span></div>

                {!isFirebaseConfigured && (
                  <p className="error-banner">Google sign-in isn't configured yet — add VITE_FIREBASE_* values to the environment.</p>
                )}
                <button type="button" onClick={handleAdminGoogle} className="btn btn-google btn-lg btn-block" disabled={adminBusy || !isFirebaseConfigured}>
                  {adminBusy ? <span className="spinner" /> : <GoogleG />}
                  {adminBusy ? 'Signing in…' : 'Continue with Google'}
                </button>
                <p className="small muted" style={{ textAlign: 'center', marginTop: '1rem' }}>
                  Google sign-in works only for studio admin emails.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}