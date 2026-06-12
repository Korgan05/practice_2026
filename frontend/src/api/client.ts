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
};
