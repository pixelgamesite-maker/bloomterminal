import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { captureRef, getRef } from "@/lib/referral";

/**
 * Invite link target (bloomterminal.xyz/join/<handle>): stash the referral
 * code, THEN send them to the hero. We capture and navigate in the same
 * effect (not via <Navigate> during render) so the redirect can't win the
 * race and drop the code before it's written.
 */
export default function Join() {
  const { code } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    if (code) {
      captureRef(code);
      console.log("[referral] captured code:", code, "stored:", getRef());
    }
    navigate("/", { replace: true });
  }, [code, navigate]);
  return (
    <div className="grid min-h-screen place-items-center">
      <p className="text-sm text-ink-soft">Taking you in…</p>
    </div>
  );
}
