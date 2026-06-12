import { useAuth } from "../auth/AuthContext";

export default function HomePage() {
  const { user } = useAuth();
  return (
    <div className="page">
      <h1>Главная</h1>
      <p className="muted">
        Добро пожаловать, <b>{user?.full_name}</b>!
      </p>
      <p>
        Это основной раздел приложения, доступный всем авторизованным
        пользователям.
      </p>
    </div>
  );
}
