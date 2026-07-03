import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { checkPassword, isPasswordValid } from "../lib/passwordPolicy";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [touched, setTouched] = useState(false);

  const rules = useMemo(() => checkPassword(password), [password]);
  const login = email.includes("@") ? email.split("@")[0] : "";

  function validate(): string | null {
    if (!fullName.trim()) return "Укажите ФИО";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "Укажите корректный email";
    if (!isPasswordValid(password)) return "Пароль не отвечает требованиям безопасности";
    return null;
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.register({ full_name: fullName.trim(), email, password });
      setDone(true);
      setError(null);
      void res;
    } catch (err) {
      setError((err as ApiError).message ?? "Не удалось зарегистрироваться");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="app-shell">
      <div className="card">
        <h1>Проверьте почту</h1>
        <p className="muted">
          На адрес <b>{email}</b> отправлена ссылка для подтверждения регистрации.
          Откройте письмо и перейдите по ссылке.
        </p>
        <p className="muted">
          В режиме разработки письма видны в MailHog:{" "}
          <a href="http://localhost:8025" target="_blank" rel="noreferrer">
            localhost:8025
          </a>
        </p>
        <button className="btn-primary" onClick={() => navigate("/login")}>
          Перейти ко входу
        </button>
      </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
    <form className="card" onSubmit={handleRegister} noValidate>
      <div className="auth-brand">
        <span className="logo-mark">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </span>
        <span className="brand-name">Контур</span>
      </div>
      <h1>Регистрация</h1>
      <p className="subtitle">Создайте аккаунт для доступа к системе</p>

      <label className="field">
        <span>ФИО *</span>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Иванов Иван Иванович"
          autoComplete="name"
        />
      </label>

      <label className="field">
        <span>Почтовый ящик *</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          autoComplete="email"
        />
        {login && (
          <small className="muted">
            Логин: <b>{login}</b>
          </small>
        )}
      </label>

      <label className="field">
        <span>Пароль *</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </label>

      <ul className="rules">
        {rules.map((r) => (
          <li key={r.label} className={r.ok ? "ok" : "bad"}>
            {r.ok ? "✓" : "•"} {r.label}
          </li>
        ))}
      </ul>

      {error && touched && <div className="alert">{error}</div>}

      <div className="actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Отправка…" : "Регистрация"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate("/login")}
        >
          Отмена
        </button>
      </div>
    </form>
    </div>
  );
}
