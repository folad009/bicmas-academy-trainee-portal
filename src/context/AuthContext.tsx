import { createContext, useContext, useState } from "react";
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
    if (!data || !data.user) {
      throw new Error("Invalid login response: missing user data");
    }

    const userData = data.user;
    const email = userData?.email;
    const name = email?.split("@")[0] ?? userData?.name ?? "User";
    const role = userData?.role ?? "Trainee";

    const avatarSeed = email ?? userData?.id ?? name;
    const avatar = `https://api.dicebear.com/6.x/identicon/svg?seed=${encodeURIComponent(
      avatarSeed,
    )}`;

    const formattedUser: AuthUser = {
      id: userData?.id ?? "",
      name,
      email: email ?? null,
      role,
      avatar,
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
