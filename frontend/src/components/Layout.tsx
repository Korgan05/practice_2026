import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// Главный экран: боковое меню навигации + контент (Задача 4).
export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">practice_2026</div>

        <nav className="nav">
          {/* Основной раздел — видят все */}
          <div className="nav-group">
            <div className="nav-group-title">Основной раздел</div>
            <NavLink to="/app/home" className="nav-link">
              Главная
            </NavLink>
            <NavLink to="/app/documents" className="nav-link">
              Документы
            </NavLink>
          </div>

          {/* Настройки — только Администратор */}
          {isAdmin && (
            <div className="nav-group">
              <div className="nav-group-title">Настройки</div>
              <NavLink to="/app/users" className="nav-link">
                Пользователи
              </NavLink>
              <NavLink to="/app/roles" className="nav-link">
                Роли
              </NavLink>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-box">
            <div className="user-name">{user?.full_name}</div>
            <div className="user-role muted">{user?.role?.name ?? "без роли"}</div>
          </div>
          <button className="btn-secondary" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
