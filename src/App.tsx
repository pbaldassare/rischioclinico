import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { CatalogProvider } from "@/lib/catalog";
import { Login } from "@/pages/Login";
import { Installa } from "@/pages/Installa";
import { MobileShell } from "@/mobile/MobileShell";
import { PwaNuova } from "@/pages/pwa/Nuova";
import { PwaProfilo } from "@/pages/pwa/Profilo";
import { Caricamento } from "@/mobile/atoms";
import { usaPwa } from "@/lib/labels";
import { isStandalone } from "@/lib/pwa-install";
import { PulsanteInstalla } from "@/components/PulsanteInstalla";
import { Marchio } from "@/components/Marchio";

// Il backoffice si scarica solo quando serve: la PWA operatore resta leggera.
const Backoffice = lazy(() => import("@/pages/bo/Backoffice").then((m) => ({ default: m.Backoffice })));
const BoDashboard = lazy(() => import("@/pages/bo/Dashboard").then((m) => ({ default: m.BoDashboard })));
const BoSegnalazioni = lazy(() => import("@/pages/bo/Segnalazioni").then((m) => ({ default: m.BoSegnalazioni })));
const BoSegnalazioneDettaglio = lazy(() => import("@/pages/bo/SegnalazioneDettaglio").then((m) => ({ default: m.BoSegnalazioneDettaglio })));
const BoSinistri = lazy(() => import("@/pages/bo/Sinistri").then((m) => ({ default: m.BoSinistri })));
const BoSinistroDettaglio = lazy(() => import("@/pages/bo/SinistroDettaglio").then((m) => ({ default: m.BoSinistroDettaglio })));
const BoFdr = lazy(() => import("@/pages/bo/Fdr").then((m) => ({ default: m.BoFdr })));
const BoFdrDettaglio = lazy(() => import("@/pages/bo/FdrDettaglio").then((m) => ({ default: m.BoFdrDettaglio })));
const BoReport = lazy(() => import("@/pages/bo/Report").then((m) => ({ default: m.BoReport })));
const BoSentinella = lazy(() => import("@/pages/bo/Sentinella").then((m) => ({ default: m.BoSentinella })));
const BoLegale = lazy(() => import("@/pages/bo/Legale").then((m) => ({ default: m.BoLegale })));
const BoLegaleDettaglio = lazy(() => import("@/pages/bo/LegaleDettaglio").then((m) => ({ default: m.BoLegaleDettaglio })));
const BoAnagrafica = lazy(() => import("@/pages/bo/Anagrafica").then((m) => ({ default: m.BoAnagrafica })));
const BoReparti = lazy(() => import("@/pages/bo/Reparti").then((m) => ({ default: m.BoReparti })));
const BoOperatori = lazy(() => import("@/pages/bo/Operatori").then((m) => ({ default: m.BoOperatori })));
const BoRegistro = lazy(() => import("@/pages/bo/Registro").then((m) => ({ default: m.BoRegistro })));

function RequireAuth({ pwa }: { pwa?: boolean }) {
  const { profilo, caricamento, homeDopoLogin } = useAuth();
  if (caricamento) return <Caricamento />;
  if (!profilo) return <Navigate to="/" replace />;
  const vuolePwa = usaPwa(profilo.ruolo);
  // L'operatore entra solo dall'app installata, mai dal browser.
  if (vuolePwa && !isStandalone()) return <SoloAppInstallata />;
  if (pwa && !vuolePwa) return <Navigate to={homeDopoLogin(profilo)} replace />;
  if (!pwa && vuolePwa) return <Navigate to="/app" replace />;
  return (
    <CatalogProvider>
      <Outlet />
    </CatalogProvider>
  );
}

// La PWA fa solo segnalazioni: dopo l'invio si torna qui con un form vuoto.
function NuovaFresca() {
  return <PwaNuova key={useLocation().key} />;
}

function SoloAppInstallata() {
  const { esci } = useAuth();
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col justify-center gap-4 px-6 py-8">
      <Marchio sottotitolo="Operatore" />
      <h1 className="font-display text-xl font-bold">Entra dall’app installata</h1>
      <p className="text-sm text-muted-foreground">
        Il tuo accesso da operatore funziona solo dall’app sulla schermata Home del telefono, non dal browser.
        Installala e aprila da lì.
      </p>
      <PulsanteInstalla />
      <button type="button" onClick={() => void esci()} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
        Esci
      </button>
    </div>
  );
}

function PortaLogin() {
  const { profilo, caricamento, homeDopoLogin } = useAuth();
  if (caricamento) return <Caricamento />;
  if (profilo) return <Navigate to={homeDopoLogin(profilo)} replace />;
  return <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<Caricamento />}>
      <Routes>
        <Route path="/" element={<PortaLogin />} />
        <Route path="/installa" element={<Installa />} />
        <Route element={<RequireAuth pwa />}>
          <Route path="/app" element={<MobileShell />}>
            <Route index element={<NuovaFresca />} />
            <Route path="profilo" element={<PwaProfilo />} />
          </Route>
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="/bo" element={<Backoffice />}>
            <Route index element={<BoDashboard />} />
            <Route path="segnalazioni" element={<BoSegnalazioni />} />
            <Route path="segnalazioni/:id" element={<BoSegnalazioneDettaglio />} />
            <Route path="sinistri" element={<BoSinistri />} />
            <Route path="sinistri/:id" element={<BoSinistroDettaglio />} />
            <Route path="fdr" element={<BoFdr />} />
            <Route path="fdr/:id" element={<BoFdrDettaglio />} />
            <Route path="report" element={<BoReport />} />
            <Route path="registro" element={<BoRegistro />} />
            <Route path="sentinella" element={<BoSentinella />} />
            <Route path="legale" element={<BoLegale />} />
            <Route path="legale/:id" element={<BoLegaleDettaglio />} />
            <Route path="anagrafica" element={<BoAnagrafica />} />
            <Route path="reparti" element={<BoReparti />} />
            <Route path="operatori" element={<BoOperatori />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </AuthProvider>
  );
}
