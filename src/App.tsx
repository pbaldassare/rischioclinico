import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { CatalogProvider } from "@/lib/catalog";
import { Login } from "@/pages/Login";
import { Installa } from "@/pages/Installa";
import { Reimposta } from "@/pages/Reimposta";
import { MobileShell } from "@/mobile/MobileShell";
import { PwaHome } from "@/pages/pwa/Home";
import { PwaNuova } from "@/pages/pwa/Nuova";
import { PwaDettaglio } from "@/pages/pwa/Dettaglio";
import { PwaProfilo } from "@/pages/pwa/Profilo";
import { Caricamento } from "@/mobile/atoms";
import { usaPwa } from "@/lib/labels";

// Il backoffice si scarica solo quando serve: la PWA operatore resta leggera.
const Backoffice = lazy(() => import("@/pages/bo/Backoffice").then((m) => ({ default: m.Backoffice })));
const BoDashboard = lazy(() => import("@/pages/bo/Dashboard").then((m) => ({ default: m.BoDashboard })));
const BoSegnalazioni = lazy(() => import("@/pages/bo/Segnalazioni").then((m) => ({ default: m.BoSegnalazioni })));
const BoSegnalazioneDettaglio = lazy(() => import("@/pages/bo/SegnalazioneDettaglio").then((m) => ({ default: m.BoSegnalazioneDettaglio })));
const BoSinistri = lazy(() => import("@/pages/bo/Sinistri").then((m) => ({ default: m.BoSinistri })));
const BoSinistroDettaglio = lazy(() => import("@/pages/bo/SinistroDettaglio").then((m) => ({ default: m.BoSinistroDettaglio })));
const BoReport = lazy(() => import("@/pages/bo/Report").then((m) => ({ default: m.BoReport })));
const BoReportNuovo = lazy(() => import("@/pages/bo/Report").then((m) => ({ default: m.BoReportNuovo })));
const BoReportSalvato = lazy(() => import("@/pages/bo/Report").then((m) => ({ default: m.BoReportSalvato })));
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
  if (pwa && !vuolePwa) return <Navigate to={homeDopoLogin(profilo)} replace />;
  if (!pwa && vuolePwa) return <Navigate to="/app" replace />;
  return (
    <CatalogProvider>
      <Outlet />
    </CatalogProvider>
  );
}

// Ogni apertura di /app/nuova parte da un form vuoto.
function NuovaFresca() {
  return <PwaNuova key={useLocation().key} />;
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
        <Route path="/reimposta" element={<Reimposta />} />
        <Route element={<RequireAuth pwa />}>
          <Route path="/app" element={<MobileShell />}>
            <Route index element={<PwaHome />} />
            <Route path="nuova" element={<NuovaFresca />} />
            <Route path="segnalazioni/:id" element={<PwaDettaglio />} />
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
            <Route path="report" element={<BoReport />} />
            <Route path="report/nuovo" element={<BoReportNuovo />} />
            <Route path="report/:id" element={<BoReportSalvato />} />
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
