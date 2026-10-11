import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './Loader';

export default function ProtectedAdminRoute({ children }) {
  const { admin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader full />;
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
}