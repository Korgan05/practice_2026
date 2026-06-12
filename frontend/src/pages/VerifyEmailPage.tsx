import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../api/client";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // защита от двойного вызова в StrictMode
    started.current = true;

    if (!token) {
      setStatus("error");
      setMessage("Отсутствует токен подтверждения");
      return;
    }
    api
      .verify(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err: ApiError) => {
        setStatus("error");
        setMessage(err.message ?? "Не удалось подтвердить email");
      });
  }, [token]);

  return (
    <div className="app-shell">
    <div className="card">
      <h1>Подтверждение email</h1>
      {status === "loading" && <p className="muted">Проверяем ссылку…</p>}
      {status === "success" && <div className="success">{message}</div>}
      {status === "error" && <div className="alert">{message}</div>}

      {status !== "loading" && (
        <button className="btn-primary" onClick={() => navigate("/login")}>
          Перейти ко входу
        </button>
      )}
    </div>
    </div>
  );
}
