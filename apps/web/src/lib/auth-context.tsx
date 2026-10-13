"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { AuthenticatedUser } from "@citydental/types";
import { authResponseSchema } from "@citydental/validation";
import { apiFetchValidated, clearStoredAuth, getStoredUser, getStoredTokens, setStoredAuth } from "@/lib/api";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, organizationSlug?: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (): Promise<boolean> => {
    const { refresh: refreshToken } = getStoredTokens();
    if (!refreshToken) {
      setUser(null);
      return false;
    }

    try {
      const response = await apiFetchValidated(authResponseSchema, "/auth/refresh", {
        method: "POST",
        body: { refreshToken },
      });
      setStoredAuth(response.tokens.accessToken, response.tokens.refreshToken, response.user);
      setUser(response.user);
      return true;
    } catch {
      clearStoredAuth();
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    const storedUser = getStoredUser();
    const { access } = getStoredTokens();

    if (storedUser && access) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string, organizationSlug?: string) => {
      setIsLoading(true);
      try {
        const response = await apiFetchValidated(authResponseSchema, "/auth/login", {
          method: "POST",
          body: { email, password, organizationSlug },
        });
        setStoredAuth(response.tokens.accessToken, response.tokens.refreshToken, response.user);
        setUser(response.user);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

