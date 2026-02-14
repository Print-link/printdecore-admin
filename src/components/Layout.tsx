import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { superAdmin, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Branches', path: '/branches' },
    { name: 'Managers', path: '/managers' },
    { name: 'Clerks', path: '/clerks' },
    { name: 'Clients', path: '/clients' },
    { name: 'Support Tickets', path: '/support' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Super Admin</h1>
          {superAdmin && (
            <p className="sidebar-email">{superAdmin.email}</p>
          )}
        </div>
        
        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="sidebar-footer">
          <button
            onClick={handleLogout}
            className="logout-button"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="main-content">
        <main className="main-wrapper">{children}</main>
      </div>
    </div>
  );
};
