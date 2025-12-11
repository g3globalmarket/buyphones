import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAuthApi } from "../api/adminAuth";
import { saveAdminAccessToken } from "../auth/adminAuthStorage";
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
      const response = await adminAuthApi.login({ email, password });

      // Store JWT token
      saveAdminAccessToken(response.accessToken);

      // TODO: Optionally store admin info globally if needed for future use
      // For now, we just store the token

      // Navigate to admin dashboard
      navigate("/admin/dashboard");
    } catch (err: unknown) {
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
