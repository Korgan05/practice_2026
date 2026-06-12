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
  // Профиль (Задача 6)
  position: string | null;
  department: string | null;
  phone: string | null;
  birth_date: string | null;
}

export interface ProfileUpdate {
  full_name?: string;
  position?: string | null;
  department?: string | null;
  phone?: string | null;
  birth_date?: string | null;
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

export interface Counteragent {
  id: number;
  name: string;
  inn_bin: string | null;
  kpp: string | null;
  address: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  bank_details: string | null;
  created_at: string;
}

export type CounteragentInput = Omit<Counteragent, "id" | "created_at">;

export interface UserBrief {
  id: number;
  full_name: string;
}

export type ProjectStatus = "planned" | "active" | "completed" | "suspended";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: "Планируется",
  active: "В работе",
  completed: "Завершён",
  suspended: "Приостановлен",
};

export interface Project {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  manager_id: number | null;
  manager: { id: number; full_name: string } | null;
  contracts: { id: number; number: string }[];
  created_at: string;
}

export interface ProjectInput {
  name: string;
  code: string | null;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  manager_id: number | null;
  contract_ids: number[];
}

export type ContractStatus = "draft" | "active" | "completed";

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Черновик",
  active: "Действует",
  completed: "Завершён",
};

export interface Contract {
  id: number;
  number: string;
  subject: string | null;
  counteragent_id: number | null;
  counteragent: { id: number; name: string } | null;
  amount: string | number | null;
  currency: string | null;
  status: ContractStatus;
  conclusion_date: string | null;
  start_date: string | null;
  end_date: string | null;
  comment: string | null;
  created_at: string;
  documents: { id: number; original_filename: string }[];
}

export interface ContractInput {
  number: string;
  subject: string | null;
  counteragent_id: number | null;
  amount: number | null;
  currency: string | null;
  status: ContractStatus;
  conclusion_date: string | null;
  start_date: string | null;
  end_date: string | null;
  comment: string | null;
  document_ids: number[];
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

  updateProfile: (body: ProfileUpdate) =>
    request<User>("/auth/me", { method: "PATCH", body: JSON.stringify(body) }),

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

  // ---- Контрагенты (Задача 7) ----
  listCounteragents: (q = "") =>
    request<Counteragent[]>(q ? `/counteragents?q=${encodeURIComponent(q)}` : "/counteragents"),

  createCounteragent: (body: CounteragentInput) =>
    request<Counteragent>("/counteragents", { method: "POST", body: JSON.stringify(body) }),

  updateCounteragent: (id: number, body: CounteragentInput) =>
    request<Counteragent>(`/counteragents/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  deleteCounteragent: (id: number) =>
    request<void>(`/counteragents/${id}`, { method: "DELETE" }),

  // ---- Договоры (Задача 8) ----
  listContracts: (q = "") =>
    request<Contract[]>(q ? `/contracts?q=${encodeURIComponent(q)}` : "/contracts"),

  createContract: (body: ContractInput) =>
    request<Contract>("/contracts", { method: "POST", body: JSON.stringify(body) }),

  updateContract: (id: number, body: ContractInput) =>
    request<Contract>(`/contracts/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  deleteContract: (id: number) =>
    request<void>(`/contracts/${id}`, { method: "DELETE" }),

  // ---- Проекты (Задача 10) ----
  listUsersBrief: () => request<UserBrief[]>("/users/brief"),

  listProjects: (q = "") =>
    request<Project[]>(q ? `/projects?q=${encodeURIComponent(q)}` : "/projects"),

  createProject: (body: ProjectInput) =>
    request<Project>("/projects", { method: "POST", body: JSON.stringify(body) }),

  updateProject: (id: number, body: ProjectInput) =>
    request<Project>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  deleteProject: (id: number) =>
    request<void>(`/projects/${id}`, { method: "DELETE" }),

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
