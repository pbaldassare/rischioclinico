import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProfiles } from "./queries";
import { usaPwa } from "./labels";
import type { Profile } from "./types";

const STORAGE_KEY = "rc-demo-profile-id";

interface AuthCtx {
  profilo: Profile | null;
  profili: Profile[];
  caricamento: boolean;
  entra: (id: string) => void;
  esci: () => void;
  homeDopoLogin: (p?: Profile | null) => string;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profileId, setProfileId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const q = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });

  const profilo = useMemo(
    () => q.data?.find((p) => p.id === profileId) ?? null,
    [q.data, profileId],
  );

  useEffect(() => {
    if (profileId) localStorage.setItem(STORAGE_KEY, profileId);
    else localStorage.removeItem(STORAGE_KEY);
  }, [profileId]);

  const value: AuthCtx = {
    profilo,
    profili: q.data ?? [],
    caricamento: q.isLoading,
    entra: (id) => setProfileId(id),
    esci: () => setProfileId(null),
    homeDopoLogin: (p) => (usaPwa((p ?? profilo)?.ruolo ?? "operatore") ? "/app" : "/bo"),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth fuori da AuthProvider");
  return ctx;
}
