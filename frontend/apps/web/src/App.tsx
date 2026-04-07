import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Component from "@workspace/ui/components/ui/animated-menu-1";
import OverviewPage from "./pages/Overview";
import PortfolioPage from "./pages/Portfolio";
import PlaceTradePage from "./pages/PlaceTrade";

import AuditLogPage from "./pages/AuditLog";
import PoliciesPage from "./pages/Policies";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Component />}> 
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="place-trade" element={<PlaceTradePage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
          <Route path="policies" element={<PoliciesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
