import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./layout/ProtectedRoute";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Managers } from "./pages/Managers";
import { Branches } from "./pages/Branches";
import { Clerks } from "./pages/Clerks";
import { Clients } from "./pages/Clients";
import { Support } from "./pages/Support";
import { Orders } from "./pages/Orders";
import { Billing } from "./pages/Billing";
import { Reports } from "./pages/Reports";
import { WhatsApp } from "./pages/WhatsApp";
import { ActivityLogs } from "./pages/ActivityLogs";
import { Roles } from "./pages/Roles";
import BlogPosts from "./pages/BlogPosts";
import { Waitlist } from "./pages/Waitlist";
import { Discounts } from "./pages/Discounts";

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
  { path: "/managers", element: <Managers /> },
  { path: "/clerks", element: <Clerks /> },
  { path: "/clients", element: <Clients /> },
  { path: "/orders", element: <Orders /> },
  { path: "/billing", element: <Billing /> },
  { path: "/reports", element: <Reports /> },
  { path: "/whatsapp", element: <WhatsApp /> },
  { path: "/activity-logs", element: <ActivityLogs /> },
  { path: "/roles", element: <Roles /> },
  { path: "/support", element: <Support /> },
  { path: "/blog", element: <BlogPosts /> },
  { path: "/waitlist", element: <Waitlist /> },
  { path: "/discounts", element: <Discounts /> },
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
