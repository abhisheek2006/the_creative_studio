import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../Doodles';
import {
  IconGrid,
  IconPackage,
  IconClipboard,
  IconUsers,
  IconSettings,
  IconLogout,
  IconFlower,
  IconMail,
} from '../Icons';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: IconGrid, end: true },
  { to: '/admin/products', label: 'Products', icon: IconPackage },
  { to: '/admin/categories', label: 'Categories', icon: IconFlower },
  { to: '/admin/orders', label: 'Orders', icon: IconClipboard },
  { to: '/admin/custom-orders', label: 'Custom orders', icon: IconFlower },
  { to: '/admin/contacts', label: 'Messages', icon: IconMail },
  { to: '/admin/jobs', label: 'Recruitment', icon: IconUsers },
  { to: '/admin/settings', label: 'Settings', icon: IconSettings },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-wrap">
      <aside className="admin-side">
        <div className="brand">
          <Logo size={32} />
          <span>
            TCS <b>Admin</b>
          </span>
        </div>
        <nav className="admin-nav">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <span className="muted small">Signed in as</span>
            <h1 style={{ fontSize: '1.25rem' }}>{admin?.name || 'Admin'}</h1>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
            <IconLogout width="16" height="16" /> Log out
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}