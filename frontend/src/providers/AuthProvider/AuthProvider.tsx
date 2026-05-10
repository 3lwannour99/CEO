"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getAccessToken, setAccessToken } from "@/lib/apiClient";
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from "@/services/authApi";
import type { AuthUser } from "@/types/inventory";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCurrentUser = useCallback(async () => {
    const storedToken = getAccessToken();
    setToken(storedToken);

    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setError(null);
    } catch (loadError) {
      setAccessToken(null);
      setToken(null);
      setUser(null);
      setError(loadError instanceof Error ? loadError.message : "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadCurrentUser();
    });

    function handleTokenChange() {
      void loadCurrentUser();
    }

    window.addEventListener("ceoreport-auth-token-changed", handleTokenChange);
    return () => window.removeEventListener("ceoreport-auth-token-changed", handleTokenChange);
  }, [loadCurrentUser]);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await loginRequest(username, password);
      setAccessToken(response.accessToken);
      setToken(response.accessToken);
      setUser(response.user);
      setError(null);
    } catch (loginError) {
      if (process.env.NODE_ENV === "development") {
        console.error(loginError);
      }
      setError("Login failed.");
      throw loginError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest().catch(() => undefined);
    } finally {
      setAccessToken(null);
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const permissions = new Set(user?.permissions ?? []);
    const hasPermission = (permission: string) => permissions.has(permission);

    return {
      error,
      hasAllPermissions: (required) => required.length === 0 || required.every(hasPermission),
      hasAnyPermission: (required) => required.length === 0 || required.some(hasPermission),
      hasPermission,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      logout,
      token,
      user,
    };
  }, [error, isLoading, login, logout, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
