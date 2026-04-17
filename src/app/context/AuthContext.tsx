import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";

export const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-5439cc58`;

export interface AuthUser {
  id: string;
  username: string;
  accessToken: string;
  avatarUrl: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<string | null>;
  signUp: (username: string, password: string) => Promise<string | null>;
  signOut: () => void | Promise<void>;
  supabase: SupabaseClient;
  apiHeaders: () => Record<string, string>;
  uploadAvatar: (file: File) => Promise<string | null>;
  refreshAvatar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const supabaseClient = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

function emailFromUsername(username: string) {
  return `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@postcardapp.app`;
}

// Standalone helper — no component state dependency
async function fetchAvatarUrl(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
        "X-User-Token": accessToken,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return data.avatarUrl ?? null;
    }
  } catch {
    // silently ignore
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const avatarUrl = await fetchAvatarUrl(session.access_token);
        setUser({
          id: session.user.id,
          username:
            session.user.user_metadata?.username ??
            session.user.email?.split("@")[0] ??
            "user",
          accessToken: session.access_token,
          avatarUrl,
        });
      } else {
        // Clear legacy localStorage entry if present
        try { localStorage.removeItem("postcard_auth"); } catch {}
        setUser(null);
      }
      setLoading(false);
    });

    // Keep token fresh
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          const avatarUrl = await fetchAvatarUrl(session.access_token);
          setUser({
            id: session.user.id,
            username:
              session.user.user_metadata?.username ??
              session.user.email?.split("@")[0] ??
              "user",
            accessToken: session.access_token,
            avatarUrl,
          });
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      const email = emailFromUsername(username);
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) return error.message;
      return null;
    } catch (err) {
      return `Sign in error: ${err}`;
    }
  }, []);

  const signUp = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) return data.error ?? "Sign up failed";
      // Sign in to establish a live session
      const email = emailFromUsername(username);
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) return error.message;
      return null;
    } catch (err) {
      return `Sign up error: ${err}`;
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabaseClient.auth.signOut();
  }, []);

  const apiHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${publicAnonKey}`,
    };
    if (user?.accessToken) {
      headers["X-User-Token"] = user.accessToken;
    }
    return headers;
  }, [user]);

  const uploadAvatar = useCallback(async (file: File): Promise<string | null> => {
    if (!user) return "Not logged in";
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch(`${API_BASE}/auth/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          "X-User-Token": user.accessToken,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) return data.error ?? "Upload failed";
      setUser((prev) => prev ? { ...prev, avatarUrl: data.avatarUrl } : prev);
      return null;
    } catch (err) {
      return `Upload error: ${err}`;
    }
  }, [user]);

  const refreshAvatar = useCallback(async () => {
    if (!user) return;
    const avatarUrl = await fetchAvatarUrl(user.accessToken);
    setUser((prev) => prev ? { ...prev, avatarUrl } : prev);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        supabase: supabaseClient,
        apiHeaders,
        uploadAvatar,
        refreshAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
