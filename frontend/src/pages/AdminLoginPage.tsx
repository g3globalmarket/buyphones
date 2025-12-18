import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAuthApi } from "../api/adminAuth";
import { setAdminAccessToken } from "../auth/adminAuthStorage";
import { getErrorMessage } from "../api/errors";
import "./AdminLoginPage.css";

/**
 * Admin login page using JWT authentication (ID + password)
 *
 * This is the main admin login flow using /admin/auth/login endpoint.
 * The legacy token-based login remains available at /admin/token as a backup.
 */
const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log("[AdminLoginPage] Attempting login for:", email);
      const response = await adminAuthApi.login({ email, password });

      // Validate response structure
      if (!response || !response.accessToken) {
        throw new Error("Invalid response: missing accessToken");
      }

      if (!response.admin) {
        throw new Error("Invalid response: missing admin data");
      }

      console.log("[AdminLoginPage] Login response received:", {
        hasToken: !!response.accessToken,
        adminId: response.admin.id,
        adminEmail: response.admin.email,
        adminRole: response.admin.role,
      });

      // Store JWT token
      setAdminAccessToken(response.accessToken);
      console.log(
        "[AdminLoginPage] JWT token saved to localStorage (pb_admin_access_token)"
      );

      // Store admin info
      if (response.admin) {
        try {
          localStorage.setItem("pb_admin_user", JSON.stringify(response.admin));
          console.log("[AdminLoginPage] Admin user info saved to localStorage");
        } catch (storageErr) {
          console.warn(
            "[AdminLoginPage] Failed to store admin info:",
            storageErr
          );
          // Non-critical, continue with login
        }
      }

      // Navigate to admin dashboard
      console.log("[AdminLoginPage] Redirecting to /admin/dashboard");
      navigate("/admin/dashboard", { replace: true });
    } catch (err: unknown) {
      console.error("[AdminLoginPage] Login error:", err);
      // Extract user-friendly error message
      const errorMessage = getErrorMessage(err);
      setError(
        errorMessage ||
          "로그인에 실패했습니다. 아이디 또는 비밀번호를 확인해 주세요."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-page-container">
        <h1>관리자 로그인</h1>
        <p className="admin-login-page-description">
          아이디와 비밀번호로 로그인하세요.
        </p>
        <form onSubmit={handleSubmit} className="admin-login-page-form">
          <div className="form-group">
            <label htmlFor="email">아이디</label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="아이디를 입력하세요"
              required
              autoFocus
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              disabled={loading}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
        <div className="admin-login-page-footer">
          <p className="admin-login-page-note">
            토큰 기반 로그인은 <a href="/admin/token">여기</a>에서 이용할 수
            있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
