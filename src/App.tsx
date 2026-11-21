import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { CatalogProvider } from "@/lib/catalog";
import { Login } from "@/pages/Login";
import { Installa } from "@/pages/Installa";
import { MobileShell } from "@/mobile/MobileShell";
import { PwaHome } from "@/pages/pwa/Home";
import { PwaNuova } from "@/pages/pwa/Nuova";
import { PwaCoda } from "@/pages/pwa/Coda";
import { PwaDettaglio } from "@/pages/pwa/Dettaglio";
import { PwaProfilo } from "@/pages/pwa/Profilo";
import { Backoffice } from "@/pages/bo/Backoffice";
import { BoDashboard } from "@/pages/bo/Dashboard";
import { BoSegnalazioni } from "@/pages/bo/Segnalazioni";
import { BoSegnalazioneDettaglio } from "@/pages/bo/SegnalazioneDettaglio";
import { BoSinistri } from "@/pages/bo/Sinistri";
import { BoSinistroDettaglio } from "@/pages/bo/SinistroDettaglio";
import { BoFdr } from "@/pages/bo/Fdr";
import { BoFdrDettaglio } from "@/pages/bo/FdrDettaglio";
import { BoReport } from "@/pages/bo/Report";
import { BoSentinella } from "@/pages/bo/Sentinella";
import { BoLegale } from "@/pages/bo/Legale";
import { BoLegaleDettaglio } from "@/pages/bo/LegaleDettaglio";
import { Caricamento } from "@/mobile/atoms";

function RequireAuth() {
  const { profilo, caricamento } = useAuth();
  if (caricamento) return <Caricamento />;
  if (!profilo) return <Navigate to="/" replace />;
  return (
    <CatalogProvider>
      <Outlet />
    </CatalogProvider>
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
      <Routes>
        <Route path="/" element={<PortaLogin />} />
        <Route path="/installa" element={<Installa />} />
        <Route element={<RequireAuth />}>
          <Route path="/app" element={<MobileShell />}>
            <Route index element={<PwaHome />} />
            <Route path="nuova" element={<PwaNuova />} />
            <Route path="coda" element={<PwaCoda />} />
            <Route path="coda/:id" element={<PwaDettaglio />} />
            <Route path="profilo" element={<PwaProfilo />} />
          </Route>
          <Route path="/bo" element={<Backoffice />}>
            <Route index element={<BoDashboard />} />
            <Route path="segnalazioni" element={<BoSegnalazioni />} />
            <Route path="segnalazioni/:id" element={<BoSegnalazioneDettaglio />} />
            <Route path="sinistri" element={<BoSinistri />} />
            <Route path="sinistri/:id" element={<BoSinistroDettaglio />} />
            <Route path="fdr" element={<BoFdr />} />
            <Route path="fdr/:id" element={<BoFdrDettaglio />} />
            <Route path="report" element={<BoReport />} />
            <Route path="sentinella" element={<BoSentinella />} />
            <Route path="legale" element={<BoLegale />} />
            <Route path="legale/:id" element={<BoLegaleDettaglio />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
