import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

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
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<void>;
  setSession: (
    token: string,
    user: AuthUser,
  ) => void;
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
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem("user");

    return storedUser
      ? JSON.parse(storedUser)
      : null;
  });

  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("token"),
  );

  const [familyRole, setFamilyRole] = useState<
    MyFamily["role"] | null
  >(null);

  useEffect(() => {
    if (!token) {
      setFamilyRole(null);
      return;
    }

    async function loadFamilyRole() {
      try {
        const family = await getMyFamily();

        setFamilyRole(family.role);
      } catch (error) {
        console.error(
          "Failed to load family role:",
          error,
        );

        setFamilyRole(null);
      }
    }

    loadFamilyRole();
  }, [token]);

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
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
    setFamilyRole(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        familyRole,
        isAuthenticated: Boolean(token),
        login,
        setSession,
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