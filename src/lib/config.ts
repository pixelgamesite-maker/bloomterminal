/*
 * Runtime configuration + integration placeholders.
 *
 * ⚠️ The current build runs on local mock state — no real auth, wallet, or
 * chain calls are made yet. These values are read from env so the real
 * integrations drop in without touching components. Fill them in via
 * .env.local (see .env.example) as each piece is wired:
 *
 *   - Supabase: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 *       Then install @supabase/supabase-js and create src/lib/supabase.ts.
 *   - Wallet:   VITE_WALLETCONNECT_PROJECT_ID (+ chain id / rpc)
 *       Then install wagmi + @rainbow-me/rainbowkit + viem and wire a
 *       WagmiProvider/RainbowKitProvider around <App/>.
 *
 * Note: RainbowKit throws at startup without a real WalletConnect project
 * id, which is exactly why wallet connect is mocked for now rather than
 * booted with a placeholder.
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
  /** Base Bloom produced per worker per real second while deployed (demo rate). */
  baseRatePerSecond: 0.12,
  /** Multiplier granted by holding the Bloom NFT. */
  nftMultiplier: 1.25,
  /** How many eligible agents a terminal needs. */
  requiredAgents: 2,
};

export const BRAND = {
  name: "Bloom Terminal",
  tagline: "Build your terminal. Deploy your agent. Put it to work.",
  joinBase: "https://bloomterminal.xyz/join",
};
