import { FormEvent, useEffect, useRef, useState } from "react";
import {
  api,
  ApiError,
  Contract,
  ContractApproval,
  ContractInput,
  ContractStatus,
  CONTRACT_STATUS_LABELS,
  Counteragent,
  DocumentItem,
  UserBrief,
} from "../api/client";
import { useAuth } from "../auth/AuthContext";

const CONTRACT_TAG = "Договор";

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
  document_ids: [],
  participant_ids: [],
};

export default function ContractsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Contract[]>([]);
  const [counteragents, setCounteragents] = useState<Counteragent[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [form, setForm] = useState<ContractInput>(EMPTY);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Документы с тегом «Договор» (Задача 9)
  const [dogovorTagId, setDogovorTagId] = useState<number | null>(null);
  const [dogovorDocs, setDogovorDocs] = useState<DocumentItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Участники и согласование (Задача 11)
  const [users, setUsers] = useState<UserBrief[]>([]);
  const [approval, setApproval] = useState<ContractApproval | null>(null);
  const [approvalNumber, setApprovalNumber] = useState<string>("");

  async function reloadDogovorDocs(tagId: number | null) {
    if (tagId == null) return;
    setDogovorDocs(await api.searchDocuments([tagId]));
  }

  async function load(q = "") {
    try {
      const [contracts, cas, tags, brief] = await Promise.all([
        api.listContracts(q),
        api.listCounteragents(),
        api.listTags(),
        api.listUsersBrief(),
      ]);
      setItems(contracts);
      setCounteragents(cas);
      setUsers(brief);
      const tag = tags.find((t) => t.name === CONTRACT_TAG) ?? null;
      setDogovorTagId(tag?.id ?? null);
      await reloadDogovorDocs(tag?.id ?? null);
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
      document_ids: c.documents.map((d) => d.id),
      participant_ids: c.participants.map((p) => p.id),
    });
    setEditId(c.id);
    setShowForm(true);
  }

  function toggleParticipant(id: number) {
    setForm((f) => ({
      ...f,
      participant_ids: f.participant_ids.includes(id)
        ? f.participant_ids.filter((x) => x !== id)
        : [...f.participant_ids, id],
    }));
  }

  async function openApprovals(c: Contract) {
    try {
      setApprovalNumber(c.number);
      setApproval(await api.getContractApprovals(c.id));
      setError(null);
    } catch (e) {
      setError((e as ApiError).message);
    }
  }

  async function approveDoc(docId: number) {
    if (approval == null) return;
    try {
      setApproval(await api.approveDocument(approval.contract_id, docId));
    } catch (e) {
      setError((e as ApiError).message);
    }
  }

  function toggleDoc(id: number) {
    setForm((f) => ({
      ...f,
      document_ids: f.document_ids.includes(id)
        ? f.document_ids.filter((x) => x !== id)
        : [...f.document_ids, id],
    }));
  }

  // Загрузить новый файл с тегом «Договор» и сразу прикрепить к договору.
  async function handleUploadAndAttach() {
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Выберите файл");
    if (dogovorTagId == null) return setError("Тег «Договор» не найден");
    setUploading(true);
    try {
      const doc = await api.uploadDocument(file, [dogovorTagId]);
      if (fileRef.current) fileRef.current.value = "";
      await reloadDogovorDocs(dogovorTagId);
      setForm((f) => ({ ...f, document_ids: [...f.document_ids, doc.id] }));
      flash(`Файл «${doc.original_filename}» загружен и прикреплён`);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setUploading(false);
    }
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

          {/* Документы договора (Задача 9) — файлы с тегом «Договор» */}
          <div className="doc-section">
            <div className="field-label">Документы (тег «Договор»):</div>
            <div className="chips">
              {dogovorDocs.map((d) => (
                <label
                  key={d.id}
                  className={`chip ${form.document_ids.includes(d.id) ? "on" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={form.document_ids.includes(d.id)}
                    onChange={() => toggleDoc(d.id)}
                  />
                  {d.original_filename}
                </label>
              ))}
              {dogovorDocs.length === 0 && (
                <span className="muted">Нет файлов с тегом «Договор»</span>
              )}
            </div>

            <div className="upload-row">
              <input
                ref={fileRef}
                type="file"
                accept=".doc,.docx,.xls,.xlsx,.pdf,.zip,.rar,.7z,.tar,.gz"
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={handleUploadAndAttach}
                disabled={uploading}
              >
                {uploading ? "Загрузка…" : "Загрузить и прикрепить"}
              </button>
            </div>
          </div>

          {/* Участники договора (Задача 11) */}
          <div className="doc-section">
            <div className="field-label">Участники договора:</div>
            <div className="chips">
              {users.map((u) => (
                <label
                  key={u.id}
                  className={`chip ${form.participant_ids.includes(u.id) ? "on" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={form.participant_ids.includes(u.id)}
                    onChange={() => toggleParticipant(u.id)}
                  />
                  {u.full_name}
                </label>
              ))}
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

      {approval && (
        <div className="modal-overlay" onClick={() => setApproval(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Согласование документов — {approvalNumber}</h2>
            {!approval.current_user_is_participant && (
              <div className="muted">
                Вы не участник этого договора — согласование недоступно (только просмотр).
              </div>
            )}
            {approval.documents.length === 0 && (
              <div className="muted">К договору не прикреплены документы.</div>
            )}
            {approval.documents.map((doc) => {
              const myApproved = doc.participants.some(
                (p) => p.user.id === user?.id && p.approved
              );
              return (
                <div key={doc.document.id} className="approval-doc">
                  <div className="approval-doc-head">
                    <b>{doc.document.original_filename}</b>
                    <span className="muted">
                      согласовали {doc.approved_count} из {doc.total}
                    </span>
                  </div>
                  <ul className="approval-list">
                    {doc.participants.map((p) => (
                      <li key={p.user.id} className={p.approved ? "ok" : ""}>
                        {p.approved ? "✓" : "•"} {p.user.full_name}
                        {p.approved_at && (
                          <span className="muted">
                            {" "}
                            ({new Date(p.approved_at).toLocaleString("ru-RU")})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {approval.current_user_is_participant && (
                    <button
                      className="btn-primary"
                      disabled={myApproved}
                      onClick={() => approveDoc(doc.document.id)}
                    >
                      {myApproved ? "Вы согласовали" : "Согласовать"}
                    </button>
                  )}
                </div>
              );
            })}
            <div className="actions">
              <button className="btn-secondary" onClick={() => setApproval(null)}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
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
            <th>Документы</th>
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
              <td>
                {c.documents.length === 0
                  ? "—"
                  : c.documents.map((d) => (
                      <span key={d.id} className="tag-badge">
                        {d.original_filename}
                      </span>
                    ))}
              </td>
              <td className="row-actions">
                <button className="btn-link" onClick={() => openApprovals(c)}>
                  Согласование
                </button>
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
