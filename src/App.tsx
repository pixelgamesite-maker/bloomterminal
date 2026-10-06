import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { TerminalProvider, useTerminal } from "@/state/terminal";
import type { ReactNode } from "react";

import Landing from "@/pages/Landing";
import TerminalLayout from "@/pages/TerminalLayout";
import Dashboard from "@/pages/Dashboard";
import Missions from "@/pages/Missions";
import Network from "@/pages/Network";
import Workforce from "@/pages/Workforce";
import Rewards from "@/pages/Rewards";

/** Everything under /terminal requires an X session (mocked). */
function Gate({ children }: { children: ReactNode }) {
  const { xConnected } = useTerminal();
  if (!xConnected) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <TerminalProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/terminal"
            element={
              <Gate>
                <TerminalLayout />
              </Gate>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="missions" element={<Missions />} />
            <Route path="network" element={<Network />} />
            <Route path="workforce" element={<Workforce />} />
            <Route path="rewards" element={<Rewards />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TerminalProvider>
  );
}
