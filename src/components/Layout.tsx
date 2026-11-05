import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
  Tags,
  ArrowRightLeft,
  Printer,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { printerOrderService } from '../services/superAdminService';
import logoArt from '../assets/images/LogoArt.png';
import { useNewOrderAlerts } from '../hooks/useNewOrderAlerts';

interface LayoutProps {
  children: React.ReactNode;
}

type NavIcon = ComponentType<{ className?: string }>;

interface NavItem {
  name: string;
  path: string;
  icon: NavIcon;
}

interface NavGroup {
  id: string;
  label: string;
  icon: NavIcon;
  items: NavItem[];
}

// Standalone links shown above the collapsible groups.
const topLevel: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
];

const groups: NavGroup[] = [
  {
    id: 'operations',
    label: 'Operations',
    icon: ShoppingBag,
    items: [
      { name: 'Orders', path: '/orders', icon: ShoppingBag },
      { name: 'Quotation Queue', path: '/quotations', icon: FileText },
      { name: 'Printer Sales', path: '/printer-sales', icon: Printer },
      { name: 'Services', path: '/services', icon: Layers },
      { name: 'Product Pricing', path: '/pricing', icon: Tags },
      { name: 'Pricing Migration', path: '/pricing/migration', icon: ArrowRightLeft },
      { name: 'Discounts', path: '/discounts', icon: Percent },
    ],
  },
  {
    id: 'organization',
    label: 'Organization',
    icon: Building2,
    items: [
      { name: 'Branches', path: '/branches', icon: Building2 },
      { name: 'Managers', path: '/managers', icon: UserCog },
      { name: 'Clerks', path: '/clerks', icon: Users },
      { name: 'Clients', path: '/clients', icon: Users },
    ],
  },
  {
    id: 'engagement',
    label: 'Engagement',
    icon: MessageCircle,
    items: [
      { name: 'WhatsApp', path: '/whatsapp', icon: MessageCircle },
      { name: 'Support Tickets', path: '/support', icon: LifeBuoy },
      { name: 'Blog Posts', path: '/blog', icon: Newspaper },
      { name: 'Waitlist', path: '/waitlist', icon: ListPlus },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: ShieldCheck,
    items: [
      { name: 'Billing & Plans', path: '/billing', icon: CreditCard },
      { name: 'Reports', path: '/reports', icon: BarChart3 },
      { name: 'Activity Logs', path: '/activity-logs', icon: History },
      { name: 'Roles & Permissions', path: '/roles', icon: ShieldCheck },
    ],
  },
];

const OPEN_GROUPS_KEY = 'admin-nav-open-groups';

const readStoredOpenGroups = (): string[] | null => {
  try {
    const raw = localStorage.getItem(OPEN_GROUPS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
};

const groupForPath = (pathname: string) =>
  groups.find((g) => g.items.some((item) => pathname.startsWith(item.path)));

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Powers the "new order" badge on the Printer Sales tab — kept fresh without
  // requiring ops to open the page to notice a new order came in.
  const { data: printerOrdersData } = useQuery({
    queryKey: ['printer-orders', 'badge', 'PROCESSING'],
    queryFn: () => printerOrderService.getAll({ status: 'PROCESSING', limit: 1 }),
    refetchInterval: 30000,
  });
  const newPrinterOrderCount = printerOrdersData?.total ?? 0;
  const ordersNeedingPrice = useNewOrderAlerts();

  const badgeFor = (path: string) =>
    path === '/printer-sales' ? newPrinterOrderCount : path === '/quotations' ? ordersNeedingPrice : 0;

  // Open groups: restored from storage, and always include the group that owns
  // the current route so the active link is never hidden.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const stored = readStoredOpenGroups();
    const initial = new Set(stored ?? groups.map((g) => g.id));
    const active = groupForPath(location.pathname);
    if (active) initial.add(active.id);
    return initial;
  });

  useEffect(() => {
    const active = groupForPath(location.pathname);
    if (active && !openGroups.has(active.id)) {
      setOpenGroups((prev) => new Set(prev).add(active.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify([...openGroups]));
    } catch {
      /* storage unavailable — ignore */
    }
  }, [openGroups]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderLink = (item: NavItem, nested = false) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;
    const badgeCount = badgeFor(item.path);
    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center gap-2.5 py-2 rounded-xl text-sm font-medium transition-colors ${
          nested ? 'pl-9 pr-3' : 'px-3'
        } ${
          isActive
            ? 'bg-white shadow-ios text-ios-label'
            : 'text-ios-secondary-label hover:bg-black/5'
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1 truncate">{item.name}</span>
        {badgeCount > 0 && <Badge count={badgeCount} />}
      </Link>
    );
  };

  return (
    <div className="h-screen bg-ios-grouped-bg flex justify-center">
      <div className="w-full max-w-330 flex">
        {/* Sidebar */}
        <div className="w-60 shrink-0 flex flex-col px-5 py-7">
          <div>
            <img src={logoArt} alt="PrintDecore" className="h-28 w-auto" />
          </div>

          <nav className="flex-1 overflow-y-auto space-y-6 pr-1">
            <div className="space-y-1">{topLevel.map((item) => renderLink(item))}</div>

            {groups.map((group) => {
              const isOpen = openGroups.has(group.id);
              const containsActive = group.items.some((item) => item.path === location.pathname);
              const hiddenBadge = isOpen
                ? 0
                : group.items.reduce((sum, item) => sum + badgeFor(item.path), 0);
              const GroupIcon = group.icon;
              return (
                <div key={group.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isOpen}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-black/5 ${
                      containsActive && !isOpen ? 'text-ios-label' : 'text-ios-secondary-label'
                    }`}
                  >
                    <GroupIcon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{group.label}</span>
                    {hiddenBadge > 0 && <Badge count={hiddenBadge} />}
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? '' : '-rotate-90'}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="space-y-1">
                      {group.items.map((item) => renderLink(item, true))}
                    </div>
                  )}
                </div>
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

const Badge = ({ count }: { count: number }) => (
  <span className="min-w-4.5 h-4.5 px-1 flex items-center justify-center rounded-full bg-ios-red text-white text-[10px] font-semibold">
    {count > 99 ? '99+' : count}
  </span>
);
