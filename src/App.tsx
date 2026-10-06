import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { TerminalProvider, useTerminal } from "@/state/terminal";
import { CrtFrame } from "@/components/CrtFrame";
import type { ReactNode } from "react";

import Landing from "@/pages/Landing";
import Console from "@/pages/Console";
import { LOGO } from "@/lib/art";

function Gate({ children }: { children: ReactNode }) {
  const { xConnected, authLoading } = useTerminal();
  if (authLoading) {
    return (
      <div className="grid min-h-full place-items-center p-8">
        <img src={LOGO} className="pixel h-14 w-14 animate-pulse rounded-lg" alt="" />
      </div>
    );
  }
  if (!xConnected) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <TerminalProvider>
      <BrowserRouter>
        <CrtFrame>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/app"
              element={
                <Gate>
                  <Console />
                </Gate>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CrtFrame>
      </BrowserRouter>
    </TerminalProvider>
  );
}
