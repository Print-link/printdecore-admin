export interface SuperAdmin {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  businessName?: string;
  businessPhone?: string;
  paystackSubaccountCode?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Clerk {
  _id: string;
  email: string;
  name: string;
  isActive: boolean;
  adminId: string | User;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  _id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  _id: string;
  message: string;
  response?: string;
  status?: string;
  clientId: string | Client;
  adminId: string | User;
  jobId?: string | {
    _id: string;
    status: string;
    printerName: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalClerks: number;
  totalClients: number;
  totalOrders: number;
  totalBranches: number;
  activeUsers: number;
  activeClerks: number;
  recentOrders: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface Branch {
  id: string;
  name: string;
  manager_id: string;
  phoneNumber: string;
  branchEmailAddress: string;
  branchCoverImage?: string;
  isMainBranch?: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  payStackSubAccountId?: string;
  distance?: number;
}

export interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
  role: "manager";
  createdAt: string;
  updatedAt: string;
}

// --- New types for backend features ---

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  previousMonthlyPrice?: number;
  previousYearlyPrice?: number;
  currency: string;
  maxBranches: number;
  maxClerks: number;
  maxOrdersPerMonth: number;
  maxServices: number;
  maxBroadcastsPerMonth: number;
  hasWhatsapp: boolean;
  hasWhatsappBroadcast: boolean;
  hasWhatsappLabels: boolean;
  hasAnalytics: boolean;
  hasCrm: boolean;
  hasCustomRoles: boolean;
  commissionPercent: number;
  paystackMonthlyPlanCode?: string;
  paystackYearlyPlanCode?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  managerId: string;
  planId: string;
  plan?: Plan;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  paystackSubscriptionCode?: string;
  paystackCustomerCode?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'PENDING' | 'QUOTED' | 'PAID' | 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Order {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  branchId: string;
  branchName?: string;
  managerId: string;
  status: OrderStatus;
  totalPrice: number;
  currency?: string;
  paymentReference?: string;
  commissionAmount?: number;
  notes?: string;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications?: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userRole: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  managerId: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  category: string;
}

export interface WhatsAppConnection {
  managerId: string;
  branchId: string;
  branchName?: string;
  status: 'connected' | 'disconnected' | 'connecting';
  phoneNumber?: string;
  lastSeen?: string;
}

export interface WhatsAppBroadcast {
  id: string;
  managerId: string;
  branchId: string;
  name: string;
  message: string;
  mediaUrl?: string;
  targetType: 'all' | 'label' | 'manual';
  targetLabelId?: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduledAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  userType: 'customer' | 'vendor';
  country: string;
  city: string | null;
  referralSource: string | null;
  createdAt: string;
}

export interface Discount {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  currency: string;
  scope: 'platform' | 'manager';
  managerId?: string;
  branchId?: string;
  targetType: 'all' | 'customer' | 'waitlist' | 'branch';
  maxUses?: number;
  maxUsesPerCustomer: number;
  currentUses: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startsAt: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueReport {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  completedRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  dailyTrends: { date: string; revenue: number; orders: number }[];
  categoryPerformance: { category: string; revenue: number; orders: number; items: number }[];
  topServices: { name: string; revenue: number; orders: number }[];
}
