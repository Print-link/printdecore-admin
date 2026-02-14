export interface SuperAdmin {
  _id: string;
  email: string;
  name: string;
  isActive: boolean;
  lastLogin?: string;
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
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  clerks: {
    total: number;
    active: number;
    inactive: number;
  };
  clients: {
    total: number;
    active: number;
    inactive: number;
  };
  supportTickets: {
    total: number;
  };
  printJobs: {
    total: number;
    pending: number;
    completed: number;
  };
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
  manager_id: string; // ID of the manager
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
  distance?: number; // Optional if we ever reuse for nearMe, but primarily for admin list it might not be there or needed
}

export interface Manager {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    avatar?: string;
    role: "manager";
    createdAt: string; // Frontend usually gets string dates from JSON
    updatedAt: string;
}
