// Barrel re-export — the actual service implementations live in their own
// files under src/services/. Kept so the ~25 existing call sites across the
// app don't all need their import paths rewritten; new code should prefer
// importing directly from the specific service file below.
export * from './authService';
export * from './dashboardService';
export * from './managerService';
export * from './clerkService';
export * from './clientService';
export * from './supportService';
export * from './branchService';
export * from './billingService';
export * from './orderService';
export * from './marketplaceService';
export * from './pricingService';
export * from './activityLogService';
export * from './roleService';
export * from './reportService';
export * from './whatsappService';
export * from './discountService';
export * from './waitlistService';
export * from './blogService';
export * from './serviceCatalogService';
export * from './printerService';
