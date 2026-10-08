/*
 * Runtime configuration, read from env.
 *
 * Auth (X OAuth), the user profile, wallet binding and referrals all run
 * against Supabase when these are set. The worker and tasks are session
 * state (not yet persisted). Set these via .env.local locally and in the
 * hosting provider for production:
 *   - Supabase: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 *   - Wallet (future onchain signing): VITE_WALLETCONNECT_PROJECT_ID + chain
 */

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
  walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "",
  chainId: import.meta.env.VITE_CHAIN_ID ?? "",
  chainRpcUrl: import.meta.env.VITE_CHAIN_RPC_URL ?? "",
};

/** True once real backend credentials exist. Components can branch on this. */
export const isBackendConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const isWalletConfigured = Boolean(env.walletConnectProjectId);

// --- Economy parameters (backend-configurable in production) ---
export const ECONOMY = {
  /** Multiplier granted by holding the Bloom NFT (applies once minting is live). */
  nftMultiplier: 1.25,
  /** How many active referred friends a terminal needs. */
  requiredAgents: 2,
};

export const BRAND = {
  name: "Bloom Terminal",
  tagline: "Build your terminal. Deploy your agent. Put it to work.",
  joinBase: "https://bloomterminal.xyz/join",
};
