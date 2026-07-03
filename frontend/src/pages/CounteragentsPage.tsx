import { FormEvent, useEffect, useState } from "react";
import { api, ApiError, Counteragent, CounteragentInput } from "../api/client";
import { useAuth } from "../auth/AuthContext";

const EMPTY: CounteragentInput = {
  name: "",
  inn_bin: "",
  kpp: "",
  address: "",
  contact_person: "",
  phone: "",
  email: "",
  bank_details: "",
};

export default function CounteragentsPage() {
  const { user, isAdmin, hasRole } = useAuth();
  const [items, setItems] = useState<Counteragent[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [form, setForm] = useState<CounteragentInput>(EMPTY);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load(q = "") {
    try {
      setItems(await api.listCounteragents(q));
      setError(null);
    } catch (e) {
      setError((e as ApiError).message);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const flash = (m: string) => {
    setInfo(m);
    setTimeout(() => setInfo(null), 2500);
  };

  function startCreate() {
    setForm(EMPTY);
    setEditId(null);
    setShowForm(true);
  }

  function startEdit(c: Counteragent) {
    setForm({
      name: c.name,
      inn_bin: c.inn_bin ?? "",
      kpp: c.kpp ?? "",
      address: c.address ?? "",
      contact_person: c.contact_person ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      bank_details: c.bank_details ?? "",
    });
    setEditId(c.id);
    setShowForm(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Укажите наименование");
    try {
      if (editId === null) {
        await api.createCounteragent(form);
        flash("Контрагент создан");
      } else {
        await api.updateCounteragent(editId, form);
        flash("Контрагент обновлён");
      }
      setShowForm(false);
      setError(null);
      await load(search);
    } catch (e) {
      setError((e as ApiError).message);
    }
  }

  async function handleDelete(c: Counteragent) {
    if (!confirm(`Удалить контрагента «${c.name}»?`)) return;
    try {
      await api.deleteCounteragent(c.id);
      flash("Контрагент удалён");
      await load(search);
    } catch (e) {
      setError((e as ApiError).message);
    }
  }

  const set = (k: keyof CounteragentInput) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Права: редактировать/удалять могут автор записи и администратор.
  const canEdit = (c: Counteragent) =>
    isAdmin || (c.created_by_id != null && c.created_by_id === user?.id);

  return (
    <div className="page">
      <h1>Контрагенты</h1>
      {error && <div className="alert">{error}</div>}
      {info && <div className="success">{info}</div>}

      <div className="toolbar">
        <input
          placeholder="Поиск по наименованию / ИНН"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(search)}
        />
        <button className="btn-secondary" onClick={() => load(search)}>
          Найти
        </button>
        {hasRole && (
          <button className="btn-primary" onClick={startCreate}>
            + Добавить
          </button>
        )}
      </div>

      {showForm && (
        <form className="panel" onSubmit={handleSave}>
          <h2>{editId === null ? "Новый контрагент" : "Редактирование контрагента"}</h2>
          <div className="form-grid">
            <label className="field">
              <span>Наименование *</span>
              <input value={form.name} onChange={set("name")} />
            </label>
            <label className="field">
              <span>ИНН / БИН</span>
              <input value={form.inn_bin ?? ""} onChange={set("inn_bin")} />
            </label>
            <label className="field">
              <span>КПП</span>
              <input value={form.kpp ?? ""} onChange={set("kpp")} />
            </label>
            <label className="field">
              <span>Контактное лицо</span>
              <input value={form.contact_person ?? ""} onChange={set("contact_person")} />
            </label>
            <label className="field">
              <span>Телефон</span>
              <input value={form.phone ?? ""} onChange={set("phone")} />
            </label>
            <label className="field">
              <span>Email</span>
              <input value={form.email ?? ""} onChange={set("email")} />
            </label>
            <label className="field full">
              <span>Адрес</span>
              <input value={form.address ?? ""} onChange={set("address")} />
            </label>
            <label className="field full">
              <span>Банковские реквизиты</span>
              <input value={form.bank_details ?? ""} onChange={set("bank_details")} />
            </label>
          </div>
          <div className="actions">
            <button className="btn-primary" type="submit">
              Сохранить
            </button>
            <button className="btn-secondary" type="button" onClick={() => setShowForm(false)}>
              Отмена
            </button>
          </div>
        </form>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Наименование</th>
            <th>ИНН/БИН</th>
            <th>Контактное лицо</th>
            <th>Телефон</th>
            <th>Email</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.inn_bin || "—"}</td>
              <td>{c.contact_person || "—"}</td>
              <td>{c.phone || "—"}</td>
              <td>{c.email || "—"}</td>
              <td className="row-actions">
                {canEdit(c) && (
                  <>
                    <button className="btn-link" onClick={() => startEdit(c)}>
                      Редактировать
                    </button>
                    <button className="btn-link danger" onClick={() => handleDelete(c)}>
                      Удалить
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                Контрагентов нет
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
