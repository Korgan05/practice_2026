import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

type IconName =
  | "home"
  | "documents"
  | "counteragents"
  | "contracts"
  | "projects"
  | "profile"
  | "users"
  | "roles"
  | "logout"
  | "logo";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, JSX.Element> = {
    home: (
      <>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </>
    ),
    documents: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8M16 17H8M10 9H8" />
      </>
    ),
    counteragents: (
      <>
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
        <path d="M2 22h20M9 6h1M14 6h1M9 10h1M14 10h1M9 14h1M14 14h1" />
      </>
    ),
    contracts: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="m9 15 2 2 4-4" />
      </>
    ),
    projects: (
      <>
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M19 21a7 7 0 0 0-14 0" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    roles: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5M21 12H9" />
      </>
    ),
    logo: (
      <>
        <path d="M3 12a9 9 0 1 0 9-9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function initials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

// Главный экран: боковое меню навигации + контент.
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
        <div className="brand">
          <span className="logo-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </span>
          <span className="brand-text">
            <b>Контур</b>
            <small>Договоры и проекты</small>
          </span>
        </div>

        <nav className="nav">
          <div className="nav-group">
            <div className="nav-group-title">Основной раздел</div>
            <NavLink to="/app/home" className="nav-link">
              <Icon name="home" /> Главная
            </NavLink>
            <NavLink to="/app/documents" className="nav-link">
              <Icon name="documents" /> Документы
            </NavLink>
            <NavLink to="/app/counteragents" className="nav-link">
              <Icon name="counteragents" /> Контрагенты
            </NavLink>
            <NavLink to="/app/contracts" className="nav-link">
              <Icon name="contracts" /> Договоры
            </NavLink>
            <NavLink to="/app/projects" className="nav-link">
              <Icon name="projects" /> Проекты
            </NavLink>
            <NavLink to="/app/profile" className="nav-link">
              <Icon name="profile" /> Профиль
            </NavLink>
          </div>

          {isAdmin && (
            <div className="nav-group">
              <div className="nav-group-title">Настройки</div>
              <NavLink to="/app/users" className="nav-link">
                <Icon name="users" /> Пользователи
              </NavLink>
              <NavLink to="/app/roles" className="nav-link">
                <Icon name="roles" /> Роли
              </NavLink>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-box">
            <span className="avatar">{initials(user?.full_name)}</span>
            <span className="user-meta">
              <div className="user-name">{user?.full_name}</div>
              <div className="user-role">{user?.role?.name ?? "без роли"}</div>
            </span>
          </div>
          <button className="btn-secondary" onClick={handleLogout}>
            <Icon name="logout" /> Выйти
          </button>
        </div>
      </aside>

      <main className="content">
        {user && !user.role && (
          <div className="readonly-banner">
            Вам ещё не назначена роль — доступен только просмотр данных.
            Для получения прав на создание и редактирование обратитесь к администратору.
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
