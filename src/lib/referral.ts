// Referral code capture. The invite link is bloomterminal.xyz/join/<HANDLE>.
// We stash the code in localStorage so it survives the X OAuth round-trip.

const REF_KEY = "bloom_ref";

export function captureRef(code: string) {
  try {
    const c = code.replace(/^@/, "").trim();
    if (c) localStorage.setItem(REF_KEY, c);
  } catch {
    /* localStorage unavailable — referral just won't attribute */
  }
}

/** Also pick up a ?ref= param if present (alternative to /join/:code). */
export function captureRefFromUrl() {
  try {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) captureRef(ref);
  } catch {
    /* no-op */
  }
}

export function getRef(): string | null {
  try {
    return localStorage.getItem(REF_KEY);
  } catch {
    return null;
  }
}

export function clearRef() {
  try {
    localStorage.removeItem(REF_KEY);
  } catch {
    /* no-op */
  }
}
