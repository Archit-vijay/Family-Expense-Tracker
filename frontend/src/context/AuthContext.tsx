import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  isTokenExpired,
  handleUnauthorized,
} from "../services/apiClient";

import {
  login as loginUser,
  type AuthUser,
} from "../services/authService";

import {
  getMyFamily,
  type MyFamily,
} from "../services/familyService";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  familyRole: MyFamily["role"] | null;
  hasFamily: boolean | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<void>;
  setSession: (
    token: string,
    user: AuthUser,
  ) => void;
  refreshFamily: () => Promise<MyFamily | null>;
  logout: () => void;
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken && isTokenExpired(storedToken)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
    return storedToken;
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken && isTokenExpired(storedToken)) {
      return null;
    }
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [familyRole, setFamilyRole] = useState<
    MyFamily["role"] | null
  >(null);

  const [hasFamily, setHasFamily] = useState<boolean | null>(null);

  const refreshFamily = useCallback(async (): Promise<MyFamily | null> => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken || isTokenExpired(currentToken)) {
      setFamilyRole(null);
      setHasFamily(false);
      return null;
    }

    try {
      const family = await getMyFamily();
      setFamilyRole(family.role);
      setHasFamily(true);
      return family;
    } catch (error: any) {
      // If 404 or no family membership
      setFamilyRole(null);
      setHasFamily(false);
      return null;
    }
  }, []);

  // Listen for global auth expiration events
  useEffect(() => {
    const onAuthExpired = () => {
      setToken(null);
      setUser(null);
      setFamilyRole(null);
      setHasFamily(false);
    };

    window.addEventListener("auth:expired", onAuthExpired);
    return () => {
      window.removeEventListener("auth:expired", onAuthExpired);
    };
  }, []);

  // Sync family status when token changes
  useEffect(() => {
    if (!token || isTokenExpired(token)) {
      setFamilyRole(null);
      setHasFamily(false);
      return;
    }

    refreshFamily();
  }, [token, refreshFamily]);

  function setSession(
    newToken: string,
    newUser: AuthUser,
  ) {
    localStorage.setItem("token", newToken);
    localStorage.setItem(
      "user",
      JSON.stringify(newUser),
    );

    setToken(newToken);
    setUser(newUser);
  }

  async function login(
    email: string,
    password: string,
  ) {
    const data = await loginUser({
      email,
      password,
    });

    setSession(data.token, data.user);
    await refreshFamily();
  }

  function logout() {
    handleUnauthorized();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        familyRole,
        hasFamily,
        isAuthenticated: Boolean(token && !isTokenExpired(token)),
        login,
        setSession,
        refreshFamily,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}
