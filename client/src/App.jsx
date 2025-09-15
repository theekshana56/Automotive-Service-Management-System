import { Suspense, lazy, Component } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

import ForgotPassword from "./pages/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/ResetPassword";

import BookAppointment from "./pages/BookAppointment";
import MyBookings from "./pages/MyBookings";
import ManageUsers from "./pages/ManageUsers";
import AuditLogs from "./pages/AuditLogs";
import Profile from "./pages/Profile";
import AvailableSlots from "./pages/AvailableSlots";
import TestPage from "./pages/TestPage";
import AdvisorManagement from "./pages/AdvisorManagement";
import AdminDashboard from "./pages/AdminDashboard";
import FinanceManagerDashboard from "./pages/FinanceManagerDashboard";
import InventoryManagerDashboard from "./pages/InventoryManagerDashboard";
import StaffManagerDashboard from "./pages/StaffManagerDashboard";
import BookingsManagement from "./pages/BookingsManagement";
import ProtectedRoute from "./components/ProtectedRoute";

import RoleGuard from "./components/RoleGuard";
import { AuthProvider } from "./store/auth.jsx";

// Lazy-loaded pages to reduce initial bundle size
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const BookAppointment = lazy(() => import("./pages/BookAppointment"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const ManageUsers = lazy(() => import("./pages/ManageUsers"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const Profile = lazy(() => import("./pages/Profile"));
const AvailableSlots = lazy(() => import("./pages/AvailableSlots"));
const TestPage = lazy(() => import("./pages/TestPage"));
const AdvisorManagement = lazy(() => import("./pages/AdvisorManagement"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const FinanceManagerDashboard = lazy(() => import("./pages/FinanceManagerDashboard"));
const InventoryManagerDashboard = lazy(() => import("./pages/InventoryManagerDashboard"));
const StaffManagerDashboard = lazy(() => import("./pages/StaffManagerDashboard"));
const BookingsManagement = lazy(() => import("./pages/BookingsManagement"));

// Inventory pages
const PartsPage = lazy(() => import("./pages/inventory/PartsPage"));
const SuppliersPage = lazy(() => import("./pages/inventory/SuppliersPage"));
const PurchaseOrdersPage = lazy(() => import("./pages/inventory/PurchaseOrdersPage"));
const PurchaseOrderFormPage = lazy(() => import("./pages/inventory/PurchaseOrderFormPage"));
const LowStockPage = lazy(() => import("./pages/inventory/LowStockPage"));
const InventoryAuditLogsPage = lazy(() => import("./pages/inventory/AuditLogsPage"));
const PartFormPage = lazy(() => import("./pages/inventory/PartFormPage"));
const SupplierFormPage = lazy(() => import("./pages/inventory/SupplierFormPage"));

// Centralized role constants to avoid string drift
const ROLES = {
  USER: "user",
  MANAGER: "manager",
  ADMIN: "admin",
  ADVISOR: "advisor",
  FINANCE_MANAGER: "finance_manager",
  INVENTORY_MANAGER: "inventory_manager",
  STAFF_MANAGER: "staff_manager",
};

// Simple error boundary to prevent the whole app from crashing on render errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught an error', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Navbar />
 Mayadunna
        <div className="w-full min-h-screen bg-app flex flex-col">
          <ErrorBoundary>
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route
                  path="/book"
                  element={<RoleGuard roles={[ROLES.USER]}><BookAppointment /></RoleGuard>}
                />
                <Route
                  path="/bookings"
                  element={<RoleGuard roles={[ROLES.USER]}><MyBookings /></RoleGuard>}
                />
                <Route
                  path="/available-slots"
                  element={<RoleGuard roles={[ROLES.USER]}><AvailableSlots /></RoleGuard>}
                />
                <Route
                  path="/manage-users"
                  element={<RoleGuard roles={[ROLES.MANAGER, ROLES.ADMIN]}><ManageUsers /></RoleGuard>}
                />
                <Route
                  path="/audit-logs"
                  element={<RoleGuard roles={[ROLES.MANAGER, ROLES.ADMIN]}><AuditLogs /></RoleGuard>}
                />
                <Route
                  path="/profile"
                  element={<RoleGuard roles={[ROLES.USER]}><Profile /></RoleGuard>}
                />
                <Route path="/test" element={<TestPage />} />
                <Route
                  path="/advisor-management"
                  element={<RoleGuard roles={[ROLES.MANAGER, ROLES.ADMIN]}><AdvisorManagement /></RoleGuard>}
                />
                <Route
                  path="/bookings-management"
                  element={<RoleGuard roles={[ROLES.MANAGER, ROLES.ADMIN, ROLES.ADVISOR]}><BookingsManagement /></RoleGuard>}
                />
                <Route
                  path="/admin-dashboard"
                  element={<RoleGuard roles={[ROLES.ADMIN]}><AdminDashboard /></RoleGuard>}
                />
                <Route
                  path="/finance-dashboard"
                  element={<RoleGuard roles={[ROLES.FINANCE_MANAGER, ROLES.ADMIN]}><FinanceManagerDashboard /></RoleGuard>}
                />
                <Route
                  path="/inventory-dashboard"
                  element={<RoleGuard roles={[ROLES.INVENTORY_MANAGER, ROLES.ADMIN]}><InventoryManagerDashboard /></RoleGuard>}
                />
                <Route
                  path="/staff-dashboard"
                  element={<RoleGuard roles={[ROLES.STAFF_MANAGER, ROLES.ADMIN]}><StaffManagerDashboard /></RoleGuard>}
                />

                {/* Inventory routes */}
                <Route
                  path="/parts"
                  element={<RoleGuard roles={[ROLES.INVENTORY_MANAGER, ROLES.MANAGER, ROLES.ADMIN]}><PartsPage /></RoleGuard>}
                />
                <Route
                  path="/parts/new"
                  element={<RoleGuard roles={[ROLES.INVENTORY_MANAGER, ROLES.MANAGER, ROLES.ADMIN]}><PartFormPage /></RoleGuard>}
                />
                <Route
                  path="/parts/:id/edit"
                  element={<RoleGuard roles={[ROLES.INVENTORY_MANAGER, ROLES.MANAGER, ROLES.ADMIN]}><PartFormPage /></RoleGuard>}
                />
                <Route
                  path="/suppliers"
                  element={<RoleGuard roles={[ROLES.INVENTORY_MANAGER, ROLES.MANAGER, ROLES.ADMIN]}><SuppliersPage /></RoleGuard>}
                />
                <Route
                  path="/suppliers/new"
                  element={<RoleGuard roles={[ROLES.INVENTORY_MANAGER, ROLES.MANAGER, ROLES.ADMIN]}><SupplierFormPage /></RoleGuard>}
                />
                <Route
                  path="/suppliers/:id/edit"
                  element={<RoleGuard roles={[ROLES.INVENTORY_MANAGER, ROLES.MANAGER, ROLES.ADMIN]}><SupplierFormPage /></RoleGuard>}
                />
                <Route
                  path="/low-stock"
                  element={<RoleGuard roles={[ROLES.INVENTORY_MANAGER, ROLES.MANAGER, ROLES.ADMIN]}><LowStockPage /></RoleGuard>}
                />
                <Route
                  path="/purchase-orders"
                  element={<RoleGuard roles={[ROLES.INVENTORY_MANAGER, ROLES.MANAGER, ROLES.ADMIN]}><PurchaseOrdersPage /></RoleGuard>}
                />
                <Route
                  path="/purchase-orders/new"
                  element={<RoleGuard roles={[ROLES.INVENTORY_MANAGER, ROLES.MANAGER, ROLES.ADMIN]}><PurchaseOrderFormPage /></RoleGuard>}
                />
                <Route
                  path="/purchase-orders/:id"
                  element={<RoleGuard roles={[ROLES.INVENTORY_MANAGER, ROLES.MANAGER, ROLES.ADMIN]}><PurchaseOrderFormPage /></RoleGuard>}
                />
                <Route
                  path="/inventory/audit"
                  element={<RoleGuard roles={[ROLES.INVENTORY_MANAGER, ROLES.MANAGER, ROLES.ADMIN]}><InventoryAuditLogsPage /></RoleGuard>}
                />

                {/* Fallback 404 route */}
                <Route path="*" element={<div>Not Found</div>} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        <div className="max-w-5xl mx-auto p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/book" element={<RoleGuard roles={["user"]}><BookAppointment /></RoleGuard>} />
            <Route path="/bookings" element={<RoleGuard roles={["user"]}><MyBookings /></RoleGuard>} />
            <Route path="/available-slots" element={<RoleGuard roles={["user"]}><AvailableSlots /></RoleGuard>} />
            <Route path="/manage-users" element={<RoleGuard roles={["manager", "admin"]}><ManageUsers /></RoleGuard>} />
            <Route path="/audit-logs" element={<RoleGuard roles={["manager", "admin"]}><AuditLogs /></RoleGuard>} />
            <Route path="/profile" element={<RoleGuard roles={["user"]}><Profile /></RoleGuard>} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/advisor-management" element={<RoleGuard roles={["manager", "admin"]}><AdvisorManagement /></RoleGuard>} />
            <Route path="/bookings-management" element={<RoleGuard roles={["manager", "admin", "advisor"]}><BookingsManagement /></RoleGuard>} />
            <Route path="/admin-dashboard" element={<RoleGuard roles={["admin"]}><AdminDashboard /></RoleGuard>} />
            <Route path="/finance-dashboard" element={<RoleGuard roles={["finance_manager", "admin"]}><FinanceManagerDashboard /></RoleGuard>} />
            <Route path="/inventory-dashboard" element={<RoleGuard roles={["inventory_manager", "admin"]}><InventoryManagerDashboard /></RoleGuard>} />
            <Route path="/staff-dashboard" element={<RoleGuard roles={["staff_manager", "admin"]}><StaffManagerDashboard /></RoleGuard>} />
          </Routes>
        </div>
      </HashRouter>
    </AuthProvider>
  );
}
