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

export interface ClientLastLocation {
  latitude: number;
  longitude: number;
  label?: string;
  /** 'gps' = the app was following the device; 'manual' = the customer pinned it. */
  source?: 'gps' | 'manual';
  updatedAt: string;
}

export interface Client {
  _id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  isActive: boolean;
  lastLogin?: string;
  /** Last location the mobile app reported — ops-only, never shown to other customers. */
  lastLocation?: ClientLastLocation;
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
  operatingHours?: Record<string, { open: string; close: string }>;
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

export type OrderStatus =
  | 'PENDING'
  | 'QUOTED'
  | 'PAID'
  | 'CONFIRMING_AVAILABILITY'
  | 'RECEIVED'
  | 'IN_PROGRESS'
  | 'PRINTING'
  | 'QUALITY_CHECK'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

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
  /** Customer's own comment/description on the order (backend field: comment). */
  comment?: string;
  /** Ops-only production partner assignment — never shown to the customer. */
  assignedVendorId?: string;
  /** Ops-only — resolved display name for assignedVendorId. */
  assignedVendorName?: string;
  /** Ops-only internal note — never shown to the customer. */
  internalNotes?: string;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// Service catalogue — the customer-facing menu Printdecore prices and manages.
export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  branchId?: string;
  isPopular?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type PricingType = 'AREA_BASED' | 'UNIT_BASED' | 'MIXED' | 'CUSTOM_QUOTE';

export interface ServiceSubCategory {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  pricingType: PricingType;
  branchId?: string;
  isPopular?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type FormulaType = 'AREA_FEET' | 'AREA_INCH' | 'UNIT_ONLY' | 'AREA_OR_UNIT' | 'PAGE_BASED';

export interface PricingFormula {
  id: string;
  code: string;
  description?: string;
  formulaType: FormulaType;
  defaultConstant: number;
}

// Scalable, self-service pricing config — a service can define multiple size/base
// presets (or a custom size), a repeatable list of add-on options (one may be the
// default), and free-form custom specifications, each with their own price.
export type BaseConfigurationType = 'PRESET' | 'CUSTOM';

export interface BaseConfiguration {
  id: string;
  name: string;
  type: BaseConfigurationType;
  unitPrice: number;
  customValue?: string | null;
}

export interface PricingOption {
  id: string;
  name: string;
  enabled: boolean;
  default: boolean;
  priceModifier: number;
}

export interface CustomSpecification {
  id: string;
  name: string;
  priceModifier: number;
}

export interface PricingConfig {
  baseConfigurations: BaseConfiguration[];
  options: PricingOption[];
  customSpecifications: CustomSpecification[];
}

export interface ServiceTemplate {
  id: string;
  subCategoryId: string;
  name: string;
  measurementUnit: 'FEET' | 'INCH' | 'UNIT';
  allowsCustomSize: boolean;
  supportsFrontBack: boolean;
  supportsColor: boolean;
  supportsPrintCut: boolean;
  pricingFormulaId: string;
  branchId?: string;
  /** The single, ops-set CUSTOMER price for this service — never a vendor's own rate. */
  pricePerUnit?: number;
  constant?: number;
  colorPriceModifier?: number;
  /** Scalable customizable pricing — presets/options/custom specs, in place of a single flat price. */
  pricingConfig?: PricingConfig | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// The branch↔service link — a branch's own rate/configuration for a service template.
export interface AgentService {
  id: string;
  branchId: string;
  serviceTemplateId: string;
  pricePerUnit?: number;
  constant?: number;
  colorPriceModifier?: number;
  isActive: boolean;
  isPrimary?: boolean;
  supportsPrintCut: boolean;
  supportsColor: boolean;
  supportsFrontBack: boolean;
  supportsFrontOnly: boolean;
  formulaType?: FormulaType;
  pricingConfig?: PricingConfig | null;
  serviceName?: string;
  createdAt?: string;
  updatedAt?: string;
  serviceTemplate?: ServiceTemplate;
  subCategory?: ServiceSubCategory;
  category?: ServiceCategory;
}

// Shape returned by GET /branches/:id — diverges from the list-endpoint `Branch` type.
export interface BranchDetailResponse {
  id: string;
  name: string;
  address?: string;
  operatingHours?: Record<string, { open: string; close: string }>;
  coverImage?: string;
  phoneNumber: string;
  email: string;
  location?: { id: string; latitude: number; longitude: number; address: string };
  agentServices: Array<{
    id: string;
    serviceTemplateId: string;
    serviceName: string;
    categoryName: string;
    pricePerUnit?: number;
    formulaType?: string;
    isActive: boolean;
    hasFlexiblePricing: boolean;
  }>;
  totalServicesCount: number;
  payStackSubAccountId?: string;
  averageRating: number;
  totalRatings: number;
  status?: string;
  isMainBranch?: boolean;
  manager_id?: string;
  activeDiscount?: {
    code: string;
    name: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    currency: string;
  };
  /** Marketplace visibility tier: 'standard' | '2x' | '3x' | '4x' | '5x' | 'diamond' */
  performanceTier?: string;
  clerks?: unknown[];
}

export interface OrderItemFile {
  url: string;
  publicId: string;
  name: string;
  size?: number;
  format?: string;
  [key: string]: unknown;
}

export interface OrderItem {
  id: string;
  orderId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  width?: number;
  height?: number;
  measurementUnit?: string;
  configSummary?: string[];
  files?: OrderItemFile[];
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

// Printer sales catalogue — surfaced on the mobile app's "Print Sales" screen.
export interface PrinterListing {
  id: string;
  name: string;
  price: number;
  description: string | null;
  tags: string[];
  specs: string[];
  images: string[];
  quantity: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PrinterOrderPaymentMethod = 'pay_on_delivery' | 'momo';
export type PrinterOrderStatus = 'PROCESSING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface PrinterOrder {
  id: string;
  clientId: string;
  printerListingId: string;
  quantity: number;
  unitPrice: number;
  deliveryFee: number;
  totalPrice: number;
  paymentMethod: PrinterOrderPaymentMethod;
  paymentReference: string | null;
  status: PrinterOrderStatus;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  recipientPhone: string;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  printerName?: string;
  printerImage?: string;
  printerImages?: string[];
  printerSpecs?: string[];
  printerTags?: string[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

// ==================== Print Assistance ====================

export interface PrintRequestAttachment {
  url: string;
  name: string;
  size?: number;
  type?: string;
}

/**
 * A Print Assistance request — the structured spec (catalog pick, size,
 * quantity, options, files) that sits beside its `Order`. Ops prices it
 * through the quotation flow; nothing here is charged directly.
 */
export interface PrintRequest {
  id: string;
  requestNumber: string;
  orderId: string;
  clientId: string;
  categoryId?: string;
  subCategoryId?: string;
  serviceTemplateId?: string;
  quantity?: number;
  width?: number;
  height?: number;
  measurementUnit?: string;
  selectedBaseConfigId?: string;
  selectedOptions: string[];
  selectedCustomSpecs: string[];
  additionalDetails?: string;
  attachments: PrintRequestAttachment[];
  calculatedPrice?: number;
  fulfilmentType?: 'delivery' | 'pickup';
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  recipientPhone?: string;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
  subCategoryName?: string;
  serviceName?: string;
  orderStatus?: OrderStatus;
  orderTotalPrice?: number;
}
