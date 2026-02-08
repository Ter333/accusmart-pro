import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import ChangePassword from "./pages/ChangePassword";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPeriods from "./pages/admin/AdminPeriods";
import AdminLogs from "./pages/admin/AdminLogs";
import Journal from "./pages/Journal";
import ReportBalance from "./pages/reports/ReportBalance";
import ReportIncome from "./pages/reports/ReportIncome";
import ReportBalanceSheet from "./pages/reports/ReportBalanceSheet";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/change-password" element={<ChangePassword />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/periods"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPeriods />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminLogs />
                </ProtectedRoute>
              }
            />

            {/* Comptable Routes */}
            <Route
              path="/journal"
              element={
                <ProtectedRoute allowedRoles={["comptable"]}>
                  <Journal />
                </ProtectedRoute>
              }
            />

            {/* Chef Routes */}
            <Route
              path="/reports/balance"
              element={
                <ProtectedRoute allowedRoles={["chef"]}>
                  <ReportBalance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/income"
              element={
                <ProtectedRoute allowedRoles={["chef"]}>
                  <ReportIncome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/balance-sheet"
              element={
                <ProtectedRoute allowedRoles={["chef"]}>
                  <ReportBalanceSheet />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
