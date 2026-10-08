import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { captureRef } from "@/lib/referral";

/** Invite link target: stash the referral code, then send them to the hero. */
export default function Join() {
  const { code } = useParams();
  useEffect(() => {
    if (code) captureRef(code);
  }, [code]);
  return <Navigate to="/" replace />;
}
