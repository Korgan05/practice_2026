// Тонкая обёртка над fetch. baseURL = /api (проксируется Vite на backend).

export interface ApiError {
  status: number;
  message: string;
}

const TOKEN_KEY = "practice2026_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  const token = tokenStore.get();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...init, headers });

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message = extractError(data) ?? `Ошибка ${res.status}`;
    throw { status: res.status, message } as ApiError;
  }
  return data as T;
}

// FastAPI кладёт ошибки в detail (строка или список ошибок валидации).
function extractError(data: unknown): string | null {
  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((e) => (e && typeof e === "object" && "msg" in e ? (e as any).msg : String(e)))
        .join("; ");
    }
  }
  return null;
}

export interface MessageOut {
  message: string;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  login: string;
  is_email_verified: boolean;
  is_active: boolean;
  role: Role | null;
}

export interface TokenOut {
  access_token: string;
  token_type: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export interface DocTag {
  id: number;
  name: string;
  categories: Category[];
}

export interface DocumentItem {
  id: number;
  original_filename: string;
  content_type: string | null;
  size: number;
  created_at: string;
  uploaded_by: string | null;
  tags: DocTag[];
}

function qs(name: string, ids: number[]): string {
  return ids.map((id) => `${name}=${id}`).join("&");
}

export const api = {
  register: (body: { full_name: string; email: string; password: string }) =>
    request<MessageOut>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  verify: (token: string) =>
    request<MessageOut>(`/auth/verify?token=${encodeURIComponent(token)}`),

  login: (body: { login: string; password: string }) =>
    request<TokenOut>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  me: () => request<User>("/auth/me"),

  listUsers: () => request<User[]>("/users"),

  setUserRole: (userId: number, roleId: number | null) =>
    request<User>(`/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role_id: roleId }),
    }),

  listRoles: () => request<Role[]>("/roles"),

  // ---- Хранилище файлов (Задача 5) ----
  listCategories: () => request<Category[]>("/categories"),

  createCategory: (body: { name: string; description?: string }) =>
    request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // category_ids — зависимость категория→теги при поиске
  listTags: (categoryIds: number[] = []) =>
    request<DocTag[]>(
      categoryIds.length ? `/tags?${qs("category_ids", categoryIds)}` : "/tags"
    ),

  createTag: (body: { name: string; category_ids: number[] }) =>
    request<DocTag>("/tags", { method: "POST", body: JSON.stringify(body) }),

  searchDocuments: (tagIds: number[] = []) =>
    request<DocumentItem[]>(
      tagIds.length ? `/documents?${qs("tag_ids", tagIds)}` : "/documents"
    ),

  uploadDocument: async (file: File, tagIds: number[]): Promise<DocumentItem> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("tag_ids", tagIds.join(","));
    const token = tokenStore.get();
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      throw { status: res.status, message: extractError(data) ?? `Ошибка ${res.status}` } as ApiError;
    }
    return data as DocumentItem;
  },

  downloadDocument: async (doc: DocumentItem): Promise<void> => {
    const token = tokenStore.get();
    const res = await fetch(`/api/documents/${doc.id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw { status: res.status, message: "Не удалось скачать файл" } as ApiError;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.original_filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
