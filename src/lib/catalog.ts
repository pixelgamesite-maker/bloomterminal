import type { Mission, MarketAsset, ClassInfo, MarketKind } from "./types";

// Static catalog: agent classes, selectable markets/assets, launch tasks, links.
// (No fabricated prices or balances — those come from real data when wired.)

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

export const STOCKS: MarketAsset[] = [
  { symbol: "NVDA", name: "NVIDIA", kind: "STOCKS" },
  { symbol: "TSLA", name: "Tesla", kind: "STOCKS" },
  { symbol: "AAPL", name: "Apple", kind: "STOCKS" },
  { symbol: "MSFT", name: "Microsoft", kind: "STOCKS" },
];

export const CRYPTO: MarketAsset[] = [
  { symbol: "BTC", name: "Bitcoin", kind: "CRYPTO" },
  { symbol: "ETH", name: "Ethereum", kind: "CRYPTO" },
  { symbol: "SOL", name: "Solana", kind: "CRYPTO" },
  { symbol: "BNB", name: "BNB", kind: "CRYPTO" },
  { symbol: "XRP", name: "XRP", kind: "CRYPTO" },
  { symbol: "DOGE", name: "Dogecoin", kind: "CRYPTO" },
  { symbol: "ADA", name: "Cardano", kind: "CRYPTO" },
  { symbol: "AVAX", name: "Avalanche", kind: "CRYPTO" },
  { symbol: "LINK", name: "Chainlink", kind: "CRYPTO" },
  { symbol: "TON", name: "Toncoin", kind: "CRYPTO" },
];

export const assetsForKind = (kind: MarketKind) =>
  kind === "STOCKS" ? STOCKS : CRYPTO;

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
