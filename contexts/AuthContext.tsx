import { useRouter } from "next/router";
import { parseCookies, setCookie } from "nookies";
import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
};

type SignInCredetials = {
  email: string;
  password: string;
};

type AuthContextData = {
  signIn(credentails: SignInCredetials): Promise<void>;
  isAuthenticated: boolean;
  user: User;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;
  const router = useRouter();

  useEffect(() => {
    const { "nextauth.token": token } = parseCookies();

    if (token) {
      api.get("/me").then((response) => {
        const { email, permissions, roles } = response.data;

        setUser({ email, permissions, roles });
      });
    }
  }, []);

  async function signIn({ email, password }: SignInCredetials) {
    try {
      const response = await api.post("sessions", {
        email,
        password,
      });

      const { token, refreshToken, permissions, roles } = response.data;

      setCookie(undefined, "nextauth.token", token, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
      setCookie(undefined, "nextauth.refreshToken", refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      setUser({
        email,
        permissions,
        roles,
      });

      api.defaults.headers["Authorization"] = `Bearer ${token}`;

      router.push("dashboard");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, user }}>
      {children}
    </AuthContext.Provider>
  );
}
