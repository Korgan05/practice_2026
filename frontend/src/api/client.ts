// Тонкая обёртка над fetch. baseURL = /api (проксируется Vite на backend).

export interface ApiError {
  status: number;
  message: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

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

export const api = {
  register: (body: { full_name: string; email: string; password: string }) =>
    request<MessageOut>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  verify: (token: string) =>
    request<MessageOut>(`/auth/verify?token=${encodeURIComponent(token)}`),

  login: (body: { login: string; password: string }) =>
    request<unknown>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
