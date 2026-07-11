import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ComponentType } from 'react';
import {
  LayoutDashboard,
  Building2,
  UserCog,
  Users,
  ShoppingBag,
  FileText,
  Layers,
  CreditCard,
  BarChart3,
  MessageCircle,
  History,
  ShieldCheck,
  LifeBuoy,
  Newspaper,
  ListPlus,
  Percent,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logoArt from '../assets/images/LogoArt.png';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation: { name: string; path: string; icon: ComponentType<{ className?: string }> }[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Branches', path: '/branches', icon: Building2 },
  { name: 'Managers', path: '/managers', icon: UserCog },
  { name: 'Clerks', path: '/clerks', icon: Users },
  { name: 'Clients', path: '/clients', icon: Users },
  { name: 'Orders', path: '/orders', icon: ShoppingBag },
  { name: 'Quotation Queue', path: '/quotations', icon: FileText },
  { name: 'Services', path: '/services', icon: Layers },
  { name: 'Billing & Plans', path: '/billing', icon: CreditCard },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'WhatsApp', path: '/whatsapp', icon: MessageCircle },
  { name: 'Activity Logs', path: '/activity-logs', icon: History },
  { name: 'Roles & Permissions', path: '/roles', icon: ShieldCheck },
  { name: 'Support Tickets', path: '/support', icon: LifeBuoy },
  { name: 'Blog Posts', path: '/blog', icon: Newspaper },
  { name: 'Waitlist', path: '/waitlist', icon: ListPlus },
  { name: 'Discounts', path: '/discounts', icon: Percent },
];

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen bg-ios-grouped-bg flex justify-center">
      <div className="w-full max-w-330 flex">
        {/* Sidebar */}
        <div className="w-60 shrink-0 flex flex-col px-5 py-7">
          <div>
            <img src={logoArt} alt="PrintDecore" className="h-28 w-auto" />
          </div>

          <nav className="flex-1 overflow-y-auto space-y-0.5">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isActive
                      ? 'bg-white shadow-ios text-ios-label'
                      : 'text-ios-secondary-label hover:bg-black/5'
                    }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-ios-secondary-label hover:bg-black/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <main className="p-8 pl-4">{children}</main>
        </div>
      </div>
    </div>
  );
};
