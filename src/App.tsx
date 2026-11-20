import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./layout/ProtectedRoute";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Managers } from "./pages/Managers";
import { Branches } from "./pages/Branches";
import { BranchCreate } from "./pages/BranchCreate";
import { BranchEdit } from "./pages/BranchEdit";
import { BranchDetail } from "./pages/BranchDetail";
import { Clerks } from "./pages/Clerks";
import { Clients } from "./pages/Clients";
import { Support } from "./pages/Support";
import { Orders } from "./pages/Orders";
import { OrderDetail } from "./pages/OrderDetail";
import { QuotationQueue } from "./pages/QuotationQueue";
import { Services } from "./pages/Services";
import { ProductPricing } from "./pages/ProductPricing";
import { PricingMigration } from "./pages/PricingMigration";
import { Billing } from "./pages/Billing";
import { Reports } from "./pages/Reports";
import { WhatsApp } from "./pages/WhatsApp";
import { ActivityLogs } from "./pages/ActivityLogs";
import { Roles } from "./pages/Roles";
import BlogPosts from "./pages/BlogPosts";
import { Waitlist } from "./pages/Waitlist";
import { Discounts } from "./pages/Discounts";
import { PrinterSales } from "./pages/PrinterSales";
import { PrinterListings } from "./pages/PrinterListings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const protectedRoutes = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/branches", element: <Branches /> },
  { path: "/branches/new", element: <BranchCreate /> },
  { path: "/branches/:id/edit", element: <BranchEdit /> },
  { path: "/branches/:id", element: <BranchDetail /> },
  { path: "/managers", element: <Managers /> },
  { path: "/clerks", element: <Clerks /> },
  { path: "/clients", element: <Clients /> },
  { path: "/orders", element: <Orders /> },
  { path: "/orders/:id", element: <OrderDetail /> },
  { path: "/quotations", element: <QuotationQueue /> },
  { path: "/services", element: <Services /> },
  { path: "/pricing", element: <ProductPricing /> },
  { path: "/pricing/migration", element: <PricingMigration /> },
  { path: "/billing", element: <Billing /> },
  { path: "/reports", element: <Reports /> },
  { path: "/whatsapp", element: <WhatsApp /> },
  { path: "/activity-logs", element: <ActivityLogs /> },
  { path: "/roles", element: <Roles /> },
  { path: "/support", element: <Support /> },
  { path: "/blog", element: <BlogPosts /> },
  { path: "/waitlist", element: <Waitlist /> },
  { path: "/discounts", element: <Discounts /> },
  { path: "/printer-sales", element: <PrinterSales /> },
  { path: "/printer-sales/listings", element: <PrinterListings /> },
];

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            {protectedRoutes.map(({ path, element }) => (
              <Route
                key={path}
                path={path}
                element={<ProtectedRoute>{element}</ProtectedRoute>}
              />
            ))}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { background: "#111827", color: "#fff", fontSize: "14px" },
              success: { style: { background: "#111827", color: "#fff" } },
              error: {
                style: {
                  background: "#fff",
                  color: "#111827",
                  border: "1px solid #E5E7EB",
                },
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
