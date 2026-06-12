import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api/client";

// Заглушка формы входа. Полноценная аутентификация (сессии/токены) — в след. задачах.
export default function LoginPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.login({ login, password });
      setOk(true);
    } catch (err) {
      setError((err as ApiError).message ?? "Не удалось войти");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card" onSubmit={handleLogin}>
      <h1>Вход</h1>

      <label className="field">
        <span>Логин</span>
        <input value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" />
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
      {ok && <div className="success">Вход выполнен (заглушка).</div>}

      <div className="actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Вход…" : "Войти"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => navigate("/register")}>
          Регистрация
        </button>
      </div>
    </form>
  );
}
