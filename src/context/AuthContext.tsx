import { createContext, useContext, useState, useEffect } from "react";
import {
  getAccessToken,
  clearAuth,
  getStoredUser,
  saveAuth,
  type AuthUser,
} from "@/utils/auth";

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  login: (data: any) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getAccessToken());

  const login = (data: any) => {
    const formattedUser: AuthUser = {
      id: data.user.id,
      name: data.user.email.split("@")[0],
      email: data.user.email,
      role: "Trainee",
      avatar: "https://picsum.photos/200",
    };

    saveAuth({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? null,
      user: formattedUser,
    });

    setToken(data.accessToken);
    setUser(formattedUser);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext)!;
