import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  ClipboardList,
  FolderHeart,
  Home,
  Landmark,
  Scale,
  ShieldAlert,
  UserPlus,
  Hospital,
  ListChecks,
} from "lucide-react";
import { DashboardShell, type VoceMenu } from "@/components/DashboardShell";
import { Marchio } from "@/components/Marchio";
import { useAuth } from "@/lib/auth";
import { ETICHETTE_RUOLO } from "@/lib/labels";
import { eAdmin, ePresidio } from "@/lib/livelli";
import { Toaster } from "@/components/ui/sonner";
import { useMemo } from "react";

const BASE: VoceMenu[] = [
  { id: "/bo", label: "Home", icon: Home },
  { id: "/bo/segnalazioni", label: "Segnalazioni", icon: ClipboardList },
  { id: "/bo/sinistri", label: "Sinistri", icon: Landmark },
  { id: "/bo/fdr", label: "Fotografia del rischio", icon: FolderHeart },
  { id: "/bo/registro", label: "Registro dei rischi", icon: ListChecks },
  { id: "/bo/report", label: "Report per livello", icon: BarChart3 },
  { id: "/bo/sentinella", label: "Eventi sentinella", icon: ShieldAlert },
  { id: "/bo/legale", label: "Pratiche legali", icon: Scale },
];

export function Backoffice() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { profilo, esci } = useAuth();
  const voci = useMemo(() => {
    const extra: VoceMenu[] = [];
    if (eAdmin(profilo)) extra.push({ id: "/bo/anagrafica", label: "ASL e ospedali", icon: Building2 });
    if (ePresidio(profilo)) {
      extra.push({ id: "/bo/reparti", label: "Reparti", icon: Hospital });
      extra.push({ id: "/bo/operatori", label: "Operatori", icon: UserPlus });
    }
    return [...BASE, ...extra];
  }, [profilo]);
  const attiva =
    voci
      .map((v) => v.id)
      .sort((a, b) => b.length - a.length)
      .find((id) => (id === "/bo" ? loc.pathname === "/bo" : loc.pathname.startsWith(id))) ?? "/bo";
  const titolo = voci.find((v) => v.id === attiva)?.label ?? "Backoffice";

  return (
    <>
      <DashboardShell
        marchio={<Marchio sottotitolo={ETICHETTE_RUOLO[profilo?.ruolo ?? "presidio"]} />}
        voci={voci}
        attiva={attiva}
        onSeleziona={(id) => navigate(id)}
        email={profilo?.email}
        onEsci={() => {
          void esci().then(() => navigate("/"));
        }}
        etichettaEsci="Esci"
        titolo={titolo}
        descrizione={
          attiva === "/bo"
            ? eAdmin(profilo)
              ? "Cruscotto di tutte le ASL: statistiche, richieste e sinistri."
              : "Cruscotto della tua ASL: segnalazioni, sinistri, FDR e sentinella."
            : undefined
        }
      >
        <Outlet />
      </DashboardShell>
      <Toaster />
    </>
  );
}
