import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { extractError } from '../../services/api';
import { Logo } from '../../components/Doodles';
import { IconCheck } from '../../components/Icons';

export default function AdminLogin() {
  const { login, admin, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!loading && admin) {
    return <Navigate to={location.state?.from || '/admin'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back!');
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(extractError(err, 'Invalid email or password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          <Logo size={54} />
          <h1 style={{ fontSize: '1.5rem', color: 'var(--forest)', marginTop: '0.6rem' }}>Admin Login</h1>
          <p className="muted small">The Creative Studio management dashboard</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="a-email">Email</label>
            <input
              id="a-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="a-pass">Password</label>
            <input
              id="a-pass"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
            {submitting ? <span className="spinner" /> : <IconCheck width="18" height="18" />}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="small muted" style={{ textAlign: 'center', marginTop: '1.2rem' }}>
          Admin accounts are created with the secure setup script — never through a public page.
        </p>
      </div>
    </div>
  );
}