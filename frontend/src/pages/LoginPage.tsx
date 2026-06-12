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
        <h1>Вход</h1>

        <label className="field">
          <span>Логин</span>
          <input
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
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
