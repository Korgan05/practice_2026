import { FormEvent, useState } from "react";
import { api, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function ProfilePage() {
  const { user, refresh } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [position, setPosition] = useState(user?.position ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [birthDate, setBirthDate] = useState(user?.birth_date ?? "");

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      await api.updateProfile({
        full_name: fullName.trim(),
        position: position.trim() || null,
        department: department.trim() || null,
        phone: phone.trim() || null,
        birth_date: birthDate || null,
      });
      await refresh();
      setInfo("Профиль сохранён");
    } catch (err) {
      setError((err as ApiError).message ?? "Не удалось сохранить профиль");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <h1>Профиль</h1>
      {error && <div className="alert">{error}</div>}
      {info && <div className="success">{info}</div>}

      <form className="panel" onSubmit={handleSave} style={{ maxWidth: 520 }}>
        {/* Только для чтения */}
        <label className="field">
          <span>Логин</span>
          <input value={user?.login ?? ""} disabled />
        </label>
        <label className="field">
          <span>Email</span>
          <input value={user?.email ?? ""} disabled />
        </label>
        <label className="field">
          <span>Роль</span>
          <input value={user?.role?.name ?? "без роли"} disabled />
        </label>

        {/* Редактируемые поля профиля (Задача 6) */}
        <label className="field">
          <span>ФИО</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label className="field">
          <span>Должность</span>
          <input value={position} onChange={(e) => setPosition(e.target.value)} />
        </label>
        <label className="field">
          <span>Подразделение / Отдел</span>
          <input value={department} onChange={(e) => setDepartment(e.target.value)} />
        </label>
        <label className="field">
          <span>Телефон</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7-700-000-00-00" />
        </label>
        <label className="field">
          <span>Дата рождения</span>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </label>

        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
      </form>
    </div>
  );
}
