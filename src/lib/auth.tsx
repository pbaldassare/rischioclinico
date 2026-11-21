import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { fetchProfile } from "./queries";
import { usaPwa } from "./labels";
import type { Profile } from "./types";

interface AuthCtx {
  profilo: Profile | null;
  caricamento: boolean;
  accedi: (email: string, password: string) => Promise<void>;
  esci: () => Promise<void>;
  homeDopoLogin: (p?: Profile | null) => string;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utente, setUtente] = useState<User | null>(null);
  const [sessionePronta, setSessionePronta] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setUtente(data.session?.user ?? null);
      setSessionePronta(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUtente(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const q = useQuery({
    queryKey: ["profile", utente?.id, utente?.email],
    queryFn: () => fetchProfile(utente!.id, utente?.email),
    enabled: !!utente?.id,
  });

  const profilo = q.data ?? null;
  const caricamento = !sessionePronta || (!!utente && q.isLoading);

  const value: AuthCtx = {
    profilo,
    caricamento,
    accedi: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    },
    esci: async () => {
      await supabase.auth.signOut();
    },
    homeDopoLogin: (p) => (usaPwa((p ?? profilo)?.ruolo ?? "operatore") ? "/app" : "/bo"),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth fuori da AuthProvider");
  return ctx;
}
