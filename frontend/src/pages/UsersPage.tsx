import { useEffect, useState } from "react";
import { api, ApiError, Role, User } from "../api/client";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([api.listUsers(), api.listRoles()]);
      setUsers(u);
      setRoles(r);
      setError(null);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function changeRole(userId: number, value: string) {
    const roleId = value === "" ? null : Number(value);
    try {
      const updated = await api.setUserRole(userId, roleId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (e) {
      setError((e as ApiError).message);
    }
  }

  if (loading) return <div className="page muted">Загрузка…</div>;

  return (
    <div className="page">
      <h1>Пользователи</h1>
      {error && <div className="alert">{error}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>ФИО</th>
            <th>Логин</th>
            <th>Email</th>
            <th>Активен</th>
            <th>Роль</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.full_name}</td>
              <td>{u.login}</td>
              <td>{u.email}</td>
              <td>{u.is_active ? "да" : "нет"}</td>
              <td>
                <select
                  value={u.role?.id ?? ""}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                >
                  <option value="">— без роли —</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
