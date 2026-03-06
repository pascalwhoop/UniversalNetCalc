"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Track the last synced UID to avoid redundant session POSTs (e.g. on every page load
  // when the user is already logged in, or concurrent calls from multiple tabs).
  // undefined = not yet synced; null = synced as logged-out; string = synced UID.
  const lastSyncedUidRef = React.useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      const uid = user?.uid ?? null;
      if (uid === lastSyncedUidRef.current) return;
      lastSyncedUidRef.current = uid;

      if (user) {
        const token = await user.getIdToken();
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await fetch("/api/auth/logout", { method: "POST" });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
