import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(loginValue, password);
      navigate("/app/home");
    } catch (err) {
      setError((err as ApiError).message ?? "Не удалось войти");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <form className="card" onSubmit={handleLogin}>
        <div className="auth-brand">
          <span className="logo-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </span>
          <span className="brand-name">Контур</span>
        </div>
        <h1>Вход в систему</h1>
        <p className="subtitle">Управление договорами, документами и проектами</p>

        <label className="field">
          <span>Логин или почта</span>
          <input
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
            placeholder="sakauovk05 или sakauovk05@gmail.com"
            autoComplete="username"
          />
        </label>

        <label className="field">
          <span>Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {error && <div className="alert">{error}</div>}

        <div className="actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Вход…" : "Войти"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/register")}
          >
            Регистрация
          </button>
        </div>
      </form>
    </div>
  );
}
