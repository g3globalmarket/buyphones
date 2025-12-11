import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAuth } from "../utils/adminAuth";
import "./AdminLogin.css";

const AdminLogin = () => {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError("토큰을 입력해주세요.");
      return;
    }

    // Store token (trimmed to avoid whitespace issues)
    const trimmedToken = token.trim();
    adminAuth.setToken(trimmedToken);

    // Redirect to admin dashboard
    navigate("/admin/dashboard");
  };

  return (
    <div className="admin-login">
      <div className="admin-login-container">
        <h1>관리자 로그인</h1>
        <p className="admin-login-description">
          관리자 토큰을 입력하여 관리자 페이지에 접근하세요.
        </p>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="token">관리자 토큰</label>
            <input
              type="password"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="토큰을 입력하세요"
              autoFocus
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="submit-button">
            로그인
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
