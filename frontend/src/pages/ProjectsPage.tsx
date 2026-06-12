import { FormEvent, useEffect, useState } from "react";
import {
  api,
  ApiError,
  Contract,
  Project,
  ProjectInput,
  ProjectStatus,
  PROJECT_STATUS_LABELS,
  UserBrief,
} from "../api/client";

const EMPTY: ProjectInput = {
  name: "",
  code: "",
  description: "",
  status: "planned",
  start_date: null,
  end_date: null,
  manager_id: null,
  contract_ids: [],
};

export default function ProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserBrief[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [form, setForm] = useState<ProjectInput>(EMPTY);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load(q = "") {
    try {
      const [projects, brief, cons] = await Promise.all([
        api.listProjects(q),
        api.listUsersBrief(),
        api.listContracts(),
      ]);
      setItems(projects);
      setUsers(brief);
      setContracts(cons);
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

  function startEdit(p: Project) {
    setForm({
      name: p.name,
      code: p.code ?? "",
      description: p.description ?? "",
      status: p.status,
      start_date: p.start_date,
      end_date: p.end_date,
      manager_id: p.manager_id,
      contract_ids: p.contracts.map((c) => c.id),
    });
    setEditId(p.id);
    setShowForm(true);
  }

  function toggleContract(id: number) {
    setForm((f) => ({
      ...f,
      contract_ids: f.contract_ids.includes(id)
        ? f.contract_ids.filter((x) => x !== id)
        : [...f.contract_ids, id],
    }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Укажите наименование проекта");
    try {
      if (editId === null) {
        await api.createProject(form);
        flash("Проект создан");
      } else {
        await api.updateProject(editId, form);
        flash("Проект обновлён");
      }
      setShowForm(false);
      setError(null);
      await load(search);
    } catch (e) {
      setError((e as ApiError).message);
    }
  }

  async function handleDelete(p: Project) {
    if (!confirm(`Удалить проект «${p.name}»?`)) return;
    try {
      await api.deleteProject(p.id);
      flash("Проект удалён");
      await load(search);
    } catch (e) {
      setError((e as ApiError).message);
    }
  }

  const set =
    (k: keyof ProjectInput) =>
    (e: { target: { value: string } }) =>
      setForm((f) => ({ ...f, [k]: e.target.value === "" ? null : e.target.value }));

  return (
    <div className="page">
      <h1>Проекты</h1>
      {error && <div className="alert">{error}</div>}
      {info && <div className="success">{info}</div>}

      <div className="toolbar">
        <input
          placeholder="Поиск по наименованию / коду"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(search)}
        />
        <button className="btn-secondary" onClick={() => load(search)}>
          Найти
        </button>
        <button className="btn-primary" onClick={startCreate}>
          + Добавить
        </button>
      </div>

      {showForm && (
        <form className="panel" onSubmit={handleSave}>
          <h2>{editId === null ? "Новый проект" : "Редактирование проекта"}</h2>
          <div className="form-grid">
            <label className="field">
              <span>Наименование *</span>
              <input value={form.name} onChange={set("name")} />
            </label>
            <label className="field">
              <span>Код / Шифр</span>
              <input value={form.code ?? ""} onChange={set("code")} />
            </label>
            <label className="field">
              <span>Руководитель</span>
              <select
                value={form.manager_id ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    manager_id: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              >
                <option value="">— не выбран —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Статус</span>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))
                }
              >
                {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {PROJECT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Дата начала</span>
              <input type="date" value={form.start_date ?? ""} onChange={set("start_date")} />
            </label>
            <label className="field">
              <span>Дата окончания</span>
              <input type="date" value={form.end_date ?? ""} onChange={set("end_date")} />
            </label>
            <label className="field full">
              <span>Описание</span>
              <input value={form.description ?? ""} onChange={set("description")} />
            </label>
          </div>

          {/* Связь с договорами (Задача 10) */}
          <div className="doc-section">
            <div className="field-label">Договоры проекта:</div>
            <div className="chips">
              {contracts.map((c) => (
                <label
                  key={c.id}
                  className={`chip ${form.contract_ids.includes(c.id) ? "on" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={form.contract_ids.includes(c.id)}
                    onChange={() => toggleContract(c.id)}
                  />
                  {c.number}
                </label>
              ))}
              {contracts.length === 0 && <span className="muted">Нет договоров</span>}
            </div>
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
            <th>Код</th>
            <th>Статус</th>
            <th>Руководитель</th>
            <th>Договоры</th>
            <th>Срок</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.code || "—"}</td>
              <td>
                <span className={`status status-${p.status}`}>
                  {PROJECT_STATUS_LABELS[p.status]}
                </span>
              </td>
              <td>{p.manager?.full_name ?? "—"}</td>
              <td>
                {p.contracts.length === 0
                  ? "—"
                  : p.contracts.map((c) => (
                      <span key={c.id} className="tag-badge">
                        {c.number}
                      </span>
                    ))}
              </td>
              <td>
                {p.start_date || "—"} … {p.end_date || "—"}
              </td>
              <td className="row-actions">
                <button className="btn-link" onClick={() => startEdit(p)}>
                  Редактировать
                </button>
                <button className="btn-link danger" onClick={() => handleDelete(p)}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={7} className="muted">
                Проектов нет
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
