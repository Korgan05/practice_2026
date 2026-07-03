import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError, Category, DocTag, DocumentItem } from "../api/client";
import { useAuth } from "../auth/AuthContext";

type Tab = "files" | "upload" | "dicts";

function toggle(arr: number[], id: number): number[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export default function DocumentsPage() {
  const { hasRole } = useAuth();
  const [tab, setTab] = useState<Tab>("files");

  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<DocTag[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // поиск: выбранные категории фильтруют список тегов (зависимость)
  const [searchCategoryIds, setSearchCategoryIds] = useState<number[]>([]);
  const [searchTagOptions, setSearchTagOptions] = useState<DocTag[]>([]);
  const [searchTagIds, setSearchTagIds] = useState<number[]>([]);

  // загрузка
  const [uploadTagIds, setUploadTagIds] = useState<number[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // справочники
  const [newCategory, setNewCategory] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagCategoryIds, setNewTagCategoryIds] = useState<number[]>([]);

  async function loadBase() {
    try {
      const [cats, tags, docs] = await Promise.all([
        api.listCategories(),
        api.listTags(),
        api.searchDocuments(),
      ]);
      setCategories(cats);
      setAllTags(tags);
      setDocuments(docs);
    } catch (e) {
      setError((e as ApiError).message);
    }
  }

  useEffect(() => {
    void loadBase();
  }, []);

  // Зависимость категория→теги: при изменении выбранных категорий обновляем
  // доступные теги в поиске.
  useEffect(() => {
    api
      .listTags(searchCategoryIds)
      .then((tags) => {
        setSearchTagOptions(tags);
        // оставить выбранными только те теги, что ещё доступны
        setSearchTagIds((prev) => prev.filter((id) => tags.some((t) => t.id === id)));
      })
      .catch((e: ApiError) => setError(e.message));
  }, [searchCategoryIds]);

  const flash = (msg: string) => {
    setInfo(msg);
    setError(null);
    setTimeout(() => setInfo(null), 3000);
  };

  async function handleSearch() {
    try {
      setDocuments(await api.searchDocuments(searchTagIds));
      setError(null);
    } catch (e) {
      setError((e as ApiError).message);
    }
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Выберите файл");
    if (uploadTagIds.length === 0) return setError("Укажите хотя бы один тег");
    try {
      await api.uploadDocument(file, uploadTagIds);
      flash(`Файл «${file.name}» загружен`);
      setUploadTagIds([]);
      if (fileRef.current) fileRef.current.value = "";
      setDocuments(await api.searchDocuments(searchTagIds));
      setTab("files");
    } catch (e) {
      setError((e as ApiError).message);
    }
  }

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault();
    if (!newCategory.trim()) return setError("Введите название категории");
    try {
      await api.createCategory({ name: newCategory.trim() });
      setNewCategory("");
      setCategories(await api.listCategories());
      flash("Категория добавлена");
    } catch (e) {
      setError((e as ApiError).message);
    }
  }

  async function handleAddTag(e: FormEvent) {
    e.preventDefault();
    if (!newTagName.trim()) return setError("Введите название тега");
    try {
      await api.createTag({ name: newTagName.trim(), category_ids: newTagCategoryIds });
      setNewTagName("");
      setNewTagCategoryIds([]);
      setAllTags(await api.listTags());
      // обновить и опции поиска
      setSearchTagOptions(await api.listTags(searchCategoryIds));
      flash("Тег добавлен");
    } catch (e) {
      setError((e as ApiError).message);
    }
  }

  const catName = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  return (
    <div className="page">
      <h1>Документы</h1>
      <p className="page-sub">Хранилище файлов: поиск по тегам, загрузка и справочники</p>

      {/* Вкладки: файлы / загрузка / справочники */}
      <div className="tabs">
        <button
          className={`tab ${tab === "files" ? "on" : ""}`}
          onClick={() => setTab("files")}
        >
          Файлы
        </button>
        {hasRole && (
          <button
            className={`tab ${tab === "upload" ? "on" : ""}`}
            onClick={() => setTab("upload")}
          >
            Загрузка
          </button>
        )}
        {hasRole && (
          <button
            className={`tab ${tab === "dicts" ? "on" : ""}`}
            onClick={() => setTab("dicts")}
          >
            Справочники
          </button>
        )}
      </div>

      {error && <div className="alert">{error}</div>}
      {info && <div className="success">{info}</div>}

      {/* ---- Вкладка: Файлы (поиск + список) ---- */}
      {tab === "files" && (
        <>
          <div className="panel">
            <h2>Поиск по тегам</h2>

            <div className="field-label">Категории (фильтруют список тегов):</div>
            <div className="chips">
              {categories.map((c) => (
                <label key={c.id} className={`chip ${searchCategoryIds.includes(c.id) ? "on" : ""}`}>
                  <input
                    type="checkbox"
                    checked={searchCategoryIds.includes(c.id)}
                    onChange={() => setSearchCategoryIds((p) => toggle(p, c.id))}
                  />
                  {c.name}
                </label>
              ))}
              {categories.length === 0 && <span className="muted">Нет категорий</span>}
            </div>

            <div className="field-label">Теги:</div>
            <div className="chips">
              {searchTagOptions.map((t) => (
                <label key={t.id} className={`chip ${searchTagIds.includes(t.id) ? "on" : ""}`}>
                  <input
                    type="checkbox"
                    checked={searchTagIds.includes(t.id)}
                    onChange={() => setSearchTagIds((p) => toggle(p, t.id))}
                  />
                  {t.name}
                </label>
              ))}
              {searchTagOptions.length === 0 && <span className="muted">Нет тегов</span>}
            </div>

            <button className="btn-primary" onClick={handleSearch}>
              Найти
            </button>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Файл</th>
                <th>Теги</th>
                <th>Размер</th>
                <th>Загрузил</th>
                <th>Дата</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id}>
                  <td>{d.original_filename}</td>
                  <td>
                    {d.tags.map((t) => (
                      <span key={t.id} className="tag-badge" title={t.categories.map((c) => catName[c.id]).join(", ")}>
                        {t.name}
                      </span>
                    ))}
                  </td>
                  <td>{formatSize(d.size)}</td>
                  <td>{d.uploaded_by ?? "—"}</td>
                  <td>{new Date(d.created_at).toLocaleString("ru-RU")}</td>
                  <td>
                    <button className="btn-link" onClick={() => api.downloadDocument(d)}>
                      Скачать
                    </button>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    Документы не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}

      {/* ---- Вкладка: Загрузка ---- */}
      {tab === "upload" && hasRole && (
        <form className="panel" onSubmit={handleUpload}>
          <h2>Загрузить файл</h2>
          <p className="muted">Форматы: .doc(x), .xls(x), .pdf, архивы (zip/rar/7z)</p>
          <input ref={fileRef} type="file" accept=".doc,.docx,.xls,.xlsx,.pdf,.zip,.rar,.7z,.tar,.gz" />
          <div className="field-label">Теги (обязательно):</div>
          <div className="chips">
            {allTags.map((t) => (
              <label key={t.id} className={`chip ${uploadTagIds.includes(t.id) ? "on" : ""}`}>
                <input
                  type="checkbox"
                  checked={uploadTagIds.includes(t.id)}
                  onChange={() => setUploadTagIds((p) => toggle(p, t.id))}
                />
                {t.name}
              </label>
            ))}
            {allTags.length === 0 && (
              <span className="muted">Сначала добавьте теги на вкладке «Справочники»</span>
            )}
          </div>
          <button className="btn-primary" type="submit">
            Загрузить
          </button>
        </form>
      )}

      {/* ---- Вкладка: Справочники ---- */}
      {tab === "dicts" && hasRole && (
        <div className="grid-2">
          <div className="panel">
            <h2>Категории</h2>
            <p className="muted">Категории группируют теги (даты, сроки, признаки…)</p>
            <form className="inline-form" onSubmit={handleAddCategory}>
              <input
                placeholder="Новая категория"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button className="btn-secondary" type="submit">
                + Категория
              </button>
            </form>
            <div className="chips">
              {categories.map((c) => (
                <span key={c.id} className="tag-badge">
                  {c.name}
                </span>
              ))}
              {categories.length === 0 && <span className="muted">Категорий пока нет</span>}
            </div>
          </div>

          <div className="panel">
            <h2>Теги</h2>
            <p className="muted">Тег можно привязать к нескольким категориям (M:M)</p>
            <form className="inline-form-col" onSubmit={handleAddTag}>
              <input
                placeholder="Новый тег"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
              <div className="chips">
                {categories.map((c) => (
                  <label key={c.id} className={`chip ${newTagCategoryIds.includes(c.id) ? "on" : ""}`}>
                    <input
                      type="checkbox"
                      checked={newTagCategoryIds.includes(c.id)}
                      onChange={() => setNewTagCategoryIds((p) => toggle(p, c.id))}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
              <button className="btn-secondary" type="submit">
                + Тег (с категориями)
              </button>
            </form>
            <div className="chips">
              {allTags.map((t) => (
                <span
                  key={t.id}
                  className="tag-badge"
                  title={t.categories.map((c) => c.name).join(", ") || "без категорий"}
                >
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
