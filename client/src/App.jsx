import { Suspense, lazy, Component } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import NotificationBanner from "./components/NotificationBanner";

// import ProtectedRoute from "./components/ProtectedRoute";

import RoleGuard from "./components/RoleGuard";
import { AuthProvider } from "./store/auth.jsx";

import Services from "./pages/Services";
import About from "./pages/About";
import Contact from "./pages/Contact";

// Lazy-loaded pages to reduce initial bundle size
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const VerifyOTP = lazy(() => import("./pages/VerifyOTP"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const BookAppointment = lazy(() => import("./pages/BookAppointment"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const ManageUsers = lazy(() => import("./pages/ManageUsers"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const Profile = lazy(() => import("./pages/Profile"));
const AvailableSlots = lazy(() => import("./pages/AvailableSlots"));
const TestPage = lazy(() => import("./pages/TestPage"));
const AdvisorManagement = lazy(() => import("./pages/AdvisorManagement"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const FinanceManagerDashboard = lazy(() => import("./pages/finance/FinanceDashboard"));
const InventoryManagerDashboard = lazy(() => import("./pages/InventoryManagerDashboard"));
const StaffManagerDashboard = lazy(() => import("./pages/StaffManagerDashboard"));
const HRManagerDashboard = lazy(() => import("./pages/HRManager/HRManagerDashboard"));
const BookingsManagement = lazy(() => import("./pages/BookingsManagement"));

// Finance pages
const FinanceDashboard = lazy(() => import("./pages/finance/FinanceDashboard"));
const StaffSalaryManagement = lazy(() => import("./pages/finance/StaffSalaryManagement"));
const ServiceCostManagement = lazy(() => import("./pages/finance/ServiceCostManagement"));
const CustomerPaymentManagement = lazy(() => import("./pages/finance/CustomerPaymentManagement"));

const EmailManagement = lazy(() => import("./pages/finance/EmailManagement"));
const InventoryPaymentManagement = lazy(() => import("./pages/finance/InventoryPaymentManagement"));
const ProfitLoss = lazy(() => import("./pages/finance/ProfitLoss"));
const FinalAmount = lazy(() => import("./pages/finance/FinalAmount"));

// Inventory pages
const PartsPage = lazy(() => import("./pages/inventory/PartsPage"));
const SuppliersPage = lazy(() => import("./pages/inventory/SuppliersPage"));
const PurchaseOrdersPage = lazy(() => import("./pages/inventory/PurchaseOrdersPage"));
const PurchaseOrderFormPage = lazy(() => import("./pages/inventory/PurchaseOrderFormPage"));
const LowStockPage = lazy(() => import("./pages/inventory/LowStockPage"));
const InventoryAuditLogsPage = lazy(() => import("./pages/inventory/AuditLogsPage"));
const PartFormPage = lazy(() => import("./pages/inventory/PartFormPage"));
const SupplierFormPage = lazy(() => import("./pages/inventory/SupplierFormPage"));
const InventoryDashboard = lazy(() => import("./pages/inventory/InventoryDashboard"));
const StockSummaryReport = lazy(() => import("./pages/inventory/StockSummaryReport"));
const SupplierSpendReport = lazy(() => import("./pages/inventory/SupplierSpendReport"));
const PartUsageLogReport = lazy(() => import("./pages/inventory/PartUsageLogReport"));
const SupplierPerformanceAnalytics = lazy(() => import("./pages/inventory/SupplierPerformanceAnalytics"));
const AdvisorDashboard = lazy(() => import("./pages/advisor/AdvisorDashboard"));
const AdvisorInspections = lazy(() => import("./pages/advisor/Inspections"));
const AdvisorAssign = lazy(() => import("./pages/advisor/AssignJobs"));
const AdvisorEstimate = lazy(() => import("./pages/advisor/Estimate"));
const AdvisorHistory = lazy(() => import("./pages/advisor/History"));
const FindMechanic = lazy(() => import("./pages/FindMechanic"));
const MechanicSignup = lazy(() => import("./pages/MechanicSignup"));
const MechanicDashboard = lazy(() => import("./pages/mechanic/MechanicDashboard"));
const WaitingRoom = lazy(() => import("./pages/WaitingRoom"));

// Centralized role constants to avoid string drift
const ROLES = {
  USER: "user",
  MANAGER: "manager",
  ADMIN: "admin",
  ADVISOR: "advisor",
  MECHANIC: "mechanic",
  FINANCE_MANAGER: "finance_manager",
  INVENTORY_MANAGER: "inventory_manager",
  STAFF_MANAGER: "staff_manager",
  HR_MANAGER: "hr_manager",
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

function AppContent() {
  return (
    <HashRouter>
      <Navbar />
      <NotificationBanner />
      <div className="w-full min-h-screen bg-app flex flex-col">
        <ErrorBoundary>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/reset-password" element={<ResetPassword />} />

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
                <Route path="/find-mechanic" element={<FindMechanic />} />
                <Route path="/mechanic/signup" element={<MechanicSignup />} />
                <Route path="/mechanic/dashboard" element={<RoleGuard roles={[ROLES.MECHANIC]}><MechanicDashboard /></RoleGuard>} />
                <Route path="/waiting/:requestId" element={<WaitingRoom />} />
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
                
                {/* Finance Management Routes */}
                <Route
                  path="/finance"
                  element={<RoleGuard roles={[ROLES.FINANCE_MANAGER, ROLES.ADMIN]}><FinanceDashboard /></RoleGuard>}
                />
                <Route
                  path="/finance/salaries"
                  element={<RoleGuard roles={[ROLES.FINANCE_MANAGER, ROLES.ADMIN]}><StaffSalaryManagement /></RoleGuard>}
                />
                <Route
                  path="/finance/service-costs"
                  element={<RoleGuard roles={[ROLES.FINANCE_MANAGER, ROLES.ADMIN]}><ServiceCostManagement /></RoleGuard>}
                />
                <Route
                  path="/finance/customer-payments"
                  element={<RoleGuard roles={[ROLES.FINANCE_MANAGER, ROLES.ADMIN]}><CustomerPaymentManagement /></RoleGuard>}
                />

                <Route
                  path="/finance/email"
                  element={<RoleGuard roles={[ROLES.FINANCE_MANAGER, ROLES.ADMIN]}><EmailManagement /></RoleGuard>}
                />
                <Route
                  path="/finance/inventory-payments"
                  element={<RoleGuard roles={[ROLES.FINANCE_MANAGER, ROLES.ADMIN]}><InventoryPaymentManagement /></RoleGuard>}
                />
                <Route
                  path="/finance/profit-loss"
                  element={<RoleGuard roles={[ROLES.FINANCE_MANAGER, ROLES.ADMIN]}><ProfitLoss /></RoleGuard>}
                />
                <Route
                  path="/finance/final-amount"
                  element={<RoleGuard roles={[ROLES.FINANCE_MANAGER, ROLES.ADMIN]}><FinalAmount /></RoleGuard>}
                />
                <Route
                  path="/inventory-dashboard"
                  element={<RoleGuard roles={[ROLES.INVENTORY_MANAGER, ROLES.ADMIN]}><InventoryDashboard /></RoleGuard>}
                />
                <Route
                  path="/reports/stock-summary"
                  element={<RoleGuard roles={[ROLES.INVENTORY_MANAGER, ROLES.MANAGER, ROLES.ADMIN]}><StockSummaryReport /></RoleGuard>}
                />
                <Route
                  path="/reports/supplier-spend"
                  element={<RoleGuard roles={[ROLES.INVENTORY_MANAGER, ROLES.MANAGER, ROLES.ADMIN]}><SupplierSpendReport /></RoleGuard>}
                />
                <Route
                  path="/hr"
                  element={<RoleGuard roles={[ROLES.HR_MANAGER, ROLES.ADMIN]}><HRManagerDashboard /></RoleGuard>}
                />
                <Route
                  path="/staff-dashboard"
                  element={<RoleGuard roles={[ROLES.STAFF_MANAGER, ROLES.ADMIN]}><StaffManagerDashboard /></RoleGuard>}
                />
                <Route
                  path="/advisor-dashboard"
                  element={<RoleGuard roles={[ROLES.ADVISOR, ROLES.MANAGER, ROLES.ADMIN]}><AdvisorDashboard /></RoleGuard>}
                />
                <Route
                  path="/advisor/inspections"
                  element={<RoleGuard roles={[ROLES.ADVISOR, ROLES.MANAGER, ROLES.ADMIN]}><AdvisorInspections /></RoleGuard>}
                />
                <Route
                  path="/advisor/assign"
                  element={<RoleGuard roles={[ROLES.ADVISOR, ROLES.MANAGER, ROLES.ADMIN]}><AdvisorAssign /></RoleGuard>}
                />
                <Route
                  path="/advisor/estimate"
                  element={<RoleGuard roles={[ROLES.ADVISOR, ROLES.MANAGER, ROLES.ADMIN]}><AdvisorEstimate /></RoleGuard>}
                />
                <Route
                  path="/advisor/history"
                  element={<RoleGuard roles={[ROLES.ADVISOR, ROLES.MANAGER, ROLES.ADMIN]}><AdvisorHistory /></RoleGuard>}
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
                <Route
                  path="/inventory/parts-usage-log-report"
                  element={<RoleGuard roles={[ROLES.INVENTORY_MANAGER, ROLES.MANAGER, ROLES.ADMIN]}><PartUsageLogReport /></RoleGuard>}
                />
                <Route
                  path="/inventory/supplier-performance"
                  element={<RoleGuard roles={[ROLES.INVENTORY_MANAGER, ROLES.MANAGER, ROLES.ADMIN]}><SupplierPerformanceAnalytics /></RoleGuard>}
                />

                {/* Fallback 404 route */}
                <Route path="*" element={<div>Not Found</div>} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
      </HashRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
