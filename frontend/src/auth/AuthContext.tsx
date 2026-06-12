import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, tokenStore, User } from "../api/client";

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const ADMIN_ROLE = "Администратор";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // При старте — если есть токен, подтянуть текущего пользователя.
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  async function login(loginValue: string, password: string) {
    const { access_token } = await api.login({ login: loginValue, password });
    tokenStore.set(access_token);
    const me = await api.me();
    setUser(me);
  }

  function logout() {
    tokenStore.clear();
    setUser(null);
  }

  async function refresh() {
    setUser(await api.me());
  }

  const isAdmin = user?.role?.name === ADMIN_ROLE;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
