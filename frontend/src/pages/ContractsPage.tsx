import { FormEvent, useEffect, useState } from "react";
import {
  api,
  ApiError,
  Contract,
  ContractInput,
  ContractStatus,
  CONTRACT_STATUS_LABELS,
  Counteragent,
} from "../api/client";

const EMPTY: ContractInput = {
  number: "",
  subject: "",
  counteragent_id: null,
  amount: null,
  currency: "KZT",
  status: "draft",
  conclusion_date: null,
  start_date: null,
  end_date: null,
  comment: "",
};

export default function ContractsPage() {
  const [items, setItems] = useState<Contract[]>([]);
  const [counteragents, setCounteragents] = useState<Counteragent[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [form, setForm] = useState<ContractInput>(EMPTY);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load(q = "") {
    try {
      const [contracts, cas] = await Promise.all([
        api.listContracts(q),
        api.listCounteragents(),
      ]);
      setItems(contracts);
      setCounteragents(cas);
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

  function startEdit(c: Contract) {
    setForm({
      number: c.number,
      subject: c.subject ?? "",
      counteragent_id: c.counteragent_id,
      amount: c.amount === null ? null : Number(c.amount),
      currency: c.currency ?? "KZT",
      status: c.status,
      conclusion_date: c.conclusion_date,
      start_date: c.start_date,
      end_date: c.end_date,
      comment: c.comment ?? "",
    });
    setEditId(c.id);
    setShowForm(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.number.trim()) return setError("Укажите номер договора");
    try {
      if (editId === null) {
        await api.createContract(form);
        flash("Договор создан");
      } else {
        await api.updateContract(editId, form);
        flash("Договор обновлён");
      }
      setShowForm(false);
      setError(null);
      await load(search);
    } catch (e) {
      setError((e as ApiError).message);
    }
  }

  async function handleDelete(c: Contract) {
    if (!confirm(`Удалить договор «${c.number}»?`)) return;
    try {
      await api.deleteContract(c.id);
      flash("Договор удалён");
      await load(search);
    } catch (e) {
      setError((e as ApiError).message);
    }
  }

  const set =
    (k: keyof ContractInput) =>
    (e: { target: { value: string } }) =>
      setForm((f) => ({ ...f, [k]: e.target.value === "" ? null : e.target.value }));

  return (
    <div className="page">
      <h1>Договоры</h1>
      {error && <div className="alert">{error}</div>}
      {info && <div className="success">{info}</div>}

      <div className="toolbar">
        <input
          placeholder="Поиск по номеру / предмету"
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
          <h2>{editId === null ? "Новый договор" : "Редактирование договора"}</h2>
          <div className="form-grid">
            <label className="field">
              <span>Номер *</span>
              <input value={form.number} onChange={set("number")} />
            </label>
            <label className="field">
              <span>Контрагент</span>
              <select
                value={form.counteragent_id ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    counteragent_id: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              >
                <option value="">— не выбран —</option>
                {counteragents.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field full">
              <span>Предмет договора</span>
              <input value={form.subject ?? ""} onChange={set("subject")} />
            </label>
            <label className="field">
              <span>Сумма</span>
              <input
                type="number"
                step="0.01"
                value={form.amount ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    amount: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
            </label>
            <label className="field">
              <span>Валюта</span>
              <input value={form.currency ?? ""} onChange={set("currency")} />
            </label>
            <label className="field">
              <span>Статус</span>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as ContractStatus }))
                }
              >
                {(Object.keys(CONTRACT_STATUS_LABELS) as ContractStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {CONTRACT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Дата заключения</span>
              <input type="date" value={form.conclusion_date ?? ""} onChange={set("conclusion_date")} />
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
              <span>Комментарий</span>
              <input value={form.comment ?? ""} onChange={set("comment")} />
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
            <th>Номер</th>
            <th>Предмет</th>
            <th>Контрагент</th>
            <th>Сумма</th>
            <th>Статус</th>
            <th>Заключён</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td>{c.number}</td>
              <td>{c.subject || "—"}</td>
              <td>{c.counteragent?.name ?? "—"}</td>
              <td>
                {c.amount !== null ? `${Number(c.amount).toLocaleString("ru-RU")} ${c.currency ?? ""}` : "—"}
              </td>
              <td>
                <span className={`status status-${c.status}`}>
                  {CONTRACT_STATUS_LABELS[c.status]}
                </span>
              </td>
              <td>{c.conclusion_date ?? "—"}</td>
              <td className="row-actions">
                <button className="btn-link" onClick={() => startEdit(c)}>
                  Редактировать
                </button>
                <button className="btn-link danger" onClick={() => handleDelete(c)}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={7} className="muted">
                Договоров нет
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
