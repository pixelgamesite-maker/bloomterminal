import type { Mission, MarketAsset, ClassInfo, MarketKind } from "./types";

// The four agents. Enum ids stay (scout/analyst/momentum/sentinel) so the
// database schema is unchanged; only the labels + specs are product-facing.
export const WORKER_CLASSES: ClassInfo[] = [
  {
    id: "scout",
    label: "Research Agent",
    identity: "The explorer",
    purpose: "Scouts new listings and emerging market activity.",
    spec: "Surfaces fresh opportunities before the crowd.",
    focus: ["New listings", "Emerging activity", "Early signals"],
    modifier: 1.1,
  },
  {
    id: "analyst",
    label: "Market Analyst",
    identity: "The researcher",
    purpose: "Reads price history, volume and trend.",
    spec: "Breaks down the numbers so you don't have to.",
    focus: ["Price history", "Volume", "Trends"],
    modifier: 1.15,
  },
  {
    id: "momentum",
    label: "Mint Bot",
    identity: "The signal hunter",
    purpose: "Hunts momentum and fresh mints.",
    spec: "Chases the moves the moment they start.",
    focus: ["Momentum", "Volume spikes", "New mints"],
    modifier: 1.2,
  },
  {
    id: "sentinel",
    label: "Stock Strategist",
    identity: "The guardian",
    purpose: "Guards positions and plans entries.",
    spec: "Keeps watch and calls the smart entry.",
    focus: ["Watchlists", "Entries", "Alerts"],
    modifier: 1.12,
  },
];

export const MARKET_KINDS: { id: MarketKind; label: string }[] = [
  { id: "STOCKS", label: "Stocks" },
  { id: "CRYPTO", label: "Crypto" },
];

// Tokenized stocks. (Prices are illustrative demo values.)
export const STOCKS: MarketAsset[] = [
  { symbol: "NVDA", name: "NVIDIA", kind: "STOCKS", price: 184.22, change: 4.21 },
  { symbol: "TSLA", name: "Tesla", kind: "STOCKS", price: 427.18, change: -1.83 },
  { symbol: "AAPL", name: "Apple", kind: "STOCKS", price: 242.91, change: 0.92 },
  { symbol: "MSFT", name: "Microsoft", kind: "STOCKS", price: 512.07, change: 3.72 },
];

// Ten coins to pick from.
export const CRYPTO: MarketAsset[] = [
  { symbol: "BTC", name: "Bitcoin", kind: "CRYPTO", price: 67420.0, change: 2.14 },
  { symbol: "ETH", name: "Ethereum", kind: "CRYPTO", price: 3280.5, change: 3.01 },
  { symbol: "SOL", name: "Solana", kind: "CRYPTO", price: 182.3, change: 6.22 },
  { symbol: "BNB", name: "BNB", kind: "CRYPTO", price: 604.1, change: 1.08 },
  { symbol: "XRP", name: "XRP", kind: "CRYPTO", price: 0.62, change: -0.74 },
  { symbol: "DOGE", name: "Dogecoin", kind: "CRYPTO", price: 0.142, change: 4.9 },
  { symbol: "ADA", name: "Cardano", kind: "CRYPTO", price: 0.45, change: -1.12 },
  { symbol: "AVAX", name: "Avalanche", kind: "CRYPTO", price: 36.8, change: 2.67 },
  { symbol: "LINK", name: "Chainlink", kind: "CRYPTO", price: 18.4, change: 5.33 },
  { symbol: "TON", name: "Toncoin", kind: "CRYPTO", price: 7.12, change: 0.41 },
];

export const MARKETS: MarketAsset[] = [...STOCKS, ...CRYPTO];

export const assetsForKind = (kind: MarketKind) =>
  kind === "STOCKS" ? STOCKS : CRYPTO;

export const findAsset = (symbol: string) =>
  MARKETS.find((m) => m.symbol === symbol);

// The X account the social tasks point at.
export const X_HANDLE = "BloomTerminall";
export const X_URL = "https://x.com/BloomTerminall";
export const X_POST_URL = "https://x.com/BloomTerminall/status/2104587590141669530";

// One-time tasks.
export const INITIAL_MISSIONS: Mission[] = [
  {
    id: "follow",
    title: "Follow @BloomTerminall",
    description: "Follow the account on X.",
    type: "social",
    reward: 50,
    done: false,
    external: true,
    link: X_URL,
  },
  {
    id: "repost",
    title: "Repost the announcement",
    description: "Share the launch post.",
    type: "social",
    reward: 50,
    done: false,
    external: true,
    link: X_POST_URL,
  },
  {
    id: "comment",
    title: "Comment on the post",
    description: "Leave a comment to verify.",
    type: "social",
    reward: 25,
    done: false,
    external: true,
    link: X_POST_URL,
  },
  {
    id: "bind-wallet",
    title: "Bind your wallet",
    description: "Add a valid EVM address for rewards.",
    type: "onchain",
    reward: 100,
    done: false,
  },
  {
    id: "invite-agents",
    title: "Invite 2 friends",
    description: "Bring two people who stay active.",
    type: "network",
    reward: 150,
    done: false,
  },
];

export const SAMPLE_HANDLES = [
  "alice",
  "mike",
  "satoshi",
  "vega",
  "nova",
  "orion",
  "kai",
  "lux",
];
