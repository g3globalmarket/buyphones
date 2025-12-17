import { Routes, Route, Link, Navigate } from "react-router-dom";
import PublicBuyRequest from "./pages/PublicBuyRequest";
import PublicBuyRequestForm from "./pages/PublicBuyRequestForm";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import GuidePage from "./pages/GuidePage";
import LoginPage from "./pages/LoginPage";
import MyRequestsPage from "./pages/MyRequestsPage";
import { adminAuth } from "./utils/adminAuth";
import { getAdminAccessToken } from "./auth/adminAuthStorage";
import { useInactivityLogout } from "./hooks/useInactivityLogout";
import "./App.css";

// Protected route component - prioritizes JWT, falls back to legacy token
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const currentUrl = window.location.pathname;

  // Check JWT token first (prioritized)
  const jwt = getAdminAccessToken();
  const hasJwt = !!jwt && jwt.trim().length > 0;

  // Check legacy token as fallback
  const legacyToken = adminAuth.getToken();
  const hasLegacy = !!legacyToken && String(legacyToken).trim().length > 0;

  // Admin is authenticated if either token exists (JWT prioritized)
  const isAuthenticated = hasJwt || hasLegacy;

  console.log("[ProtectedAdminRoute] Auth check:", {
    url: currentUrl,
    hasJWT: hasJwt,
    hasLegacy: hasLegacy,
    isAuthenticated,
    tokenKey: hasJwt
      ? "pb_admin_access_token (JWT)"
      : hasLegacy
      ? "admin_token (legacy)"
      : "NONE",
  });

  if (!isAuthenticated) {
    console.warn(
      "[ProtectedAdminRoute] Not authenticated, redirecting to /admin"
    );
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

function App() {
  // Track user inactivity and auto-logout
  useInactivityLogout();

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            전자제품 매입 서비스
          </Link>
          <div className="nav-links">
            <Link to="/">매입 신청</Link>
            <Link to="/guide">매입 안내</Link>
            <Link to="/my-requests">내 신청 내역</Link>
            <Link to="/admin">관리자</Link>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<PublicBuyRequest />} />
          <Route path="/sell" element={<PublicBuyRequest />} />
          <Route path="/sell/new" element={<PublicBuyRequestForm />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/my-requests" element={<MyRequestsPage />} />
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/token" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedAdminRoute>
                <AdminUsersPage />
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
