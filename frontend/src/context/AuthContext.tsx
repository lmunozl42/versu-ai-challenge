import { createContext, useContext, useEffect, useState } from "react";
import { getMe, type UserOut } from "@/api/auth";

interface AuthCtx {
  user: UserOut | null;
  token: string | null;
  setToken: (t: string | null) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  token: null,
  setToken: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);

  function setToken(t: string | null) {
    if (t) localStorage.setItem("token", t);
    else {
      localStorage.removeItem("token");
      setUser(null);
    }
    setTokenState(t);
  }

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    getMe()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, setToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
