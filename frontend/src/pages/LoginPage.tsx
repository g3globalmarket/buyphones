import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/auth";
import { saveUserToken } from "../auth/authStore";
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const [isCooldownActive, setIsCooldownActive] = useState(false);

  // Countdown effect for cooldown
  useEffect(() => {
    if (!isCooldownActive || cooldownSeconds === null) return;

    if (cooldownSeconds <= 0) {
      setIsCooldownActive(false);
      setCooldownSeconds(null);
      return;
    }

    const timer = setTimeout(() => {
      setCooldownSeconds((prev) => (prev !== null ? prev - 1 : prev));
    }, 1000);

    return () => clearTimeout(timer);
  }, [isCooldownActive, cooldownSeconds]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      await authApi.requestCode(email);
      setMessage("입력하신 이메일로 인증 코드가 발송되었습니다.");
      setStep("code");
      // Clear cooldown on success
      setIsCooldownActive(false);
      setCooldownSeconds(null);
    } catch (err: any) {
      // Check if it's a 429 Too Many Requests error
      if (err?.response?.status === 429) {
        const errorMessage = err?.response?.data?.message || "";
        // Parse remaining seconds from message (e.g., "You can request a new login code after 37 seconds.")
        const match =
          typeof errorMessage === "string"
            ? errorMessage.match(/(\d+)\s*seconds?/)
            : null;
        const remaining = match ? parseInt(match[1], 10) : 60; // fallback to 60

        setCooldownSeconds(remaining);
        setIsCooldownActive(true);
        setError(`코드 재발송은 ${remaining}초 후에 가능합니다.`);
      } else {
        // Handle other errors normally
        setError(
          err?.response?.data?.message ||
            "코드 발송에 실패했습니다. 다시 시도해주세요."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await authApi.verifyCode(email, code);
      saveUserToken(response.accessToken);

      // Read redirect param BEFORE navigation
      // Use searchParams.get() directly - it should persist across the component lifecycle
      const redirect = searchParams.get("redirect");

      // Validate redirect path (must start with / and not be empty)
      const redirectPath =
        redirect && redirect.startsWith("/") && redirect.length > 1
          ? redirect
          : "/my-requests";

      // Use replace: true to avoid back button issues
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "인증 코드가 올바르지 않거나 만료되었습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>로그인</h1>
        <p className="login-description">
          이메일로 발송된 인증 코드를 입력하여 로그인하세요.
        </p>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        {step === "email" ? (
          <form onSubmit={handleRequestCode} className="login-form">
            <div className="form-group">
              <label htmlFor="email">이메일</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                disabled={loading}
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="submit-button"
              disabled={loading || !email.trim() || isCooldownActive}
            >
              {loading
                ? "발송 중..."
                : isCooldownActive && cooldownSeconds !== null
                ? `재발송 가능 (${cooldownSeconds}초)`
                : "코드 보내기"}
            </button>
            {isCooldownActive && cooldownSeconds !== null && (
              <p className="cooldown-message">
                코드 재발송은 {cooldownSeconds}초 후에 가능합니다.
              </p>
            )}
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="login-form">
            <div className="form-group">
              <label htmlFor="code">인증 코드</label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="6자리 숫자"
                maxLength={6}
                required
                disabled={loading}
                autoFocus
              />
              <p className="field-helper">
                {email}로 발송된 6자리 코드를 입력하세요.
              </p>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                  setMessage(null);
                }}
                disabled={loading}
              >
                이메일 다시 입력
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={loading || code.length !== 6}
              >
                {loading ? "확인 중..." : "로그인"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
