import type { Mission, MarketAsset, ClassInfo } from "./types";

export const WORKER_CLASSES: ClassInfo[] = [
  {
    id: "scout",
    label: "Scout",
    identity: "The explorer",
    purpose: "Discover market activity and emerging opportunities.",
    focus: ["New assets", "Emerging activity", "New tokenized listings"],
    modifier: 1.1,
  },
  {
    id: "analyst",
    label: "Analyst",
    identity: "The researcher",
    purpose: "Analyze price history, volume and asset performance.",
    focus: ["Price history", "Volume", "Trends", "Performance"],
    modifier: 1.15,
  },
  {
    id: "momentum",
    label: "Momentum",
    identity: "The signal hunter",
    purpose: "Identify significant market movements.",
    focus: ["Large moves", "Volume spikes", "Acceleration"],
    modifier: 1.2,
  },
  {
    id: "sentinel",
    label: "Sentinel",
    identity: "The guardian",
    purpose: "Monitor selected assets and raise alerts.",
    focus: ["Watchlists", "Price changes", "Events", "Alerts"],
    modifier: 1.12,
  },
];

export const MARKET_CATEGORIES = [
  "TECHNOLOGY",
  "AI",
  "FINTECH",
  "AUTOMOTIVE",
  "CRYPTO",
  "CONSUMER",
] as const;

// Tokenized-equity style instruments. Prices are illustrative demo data.
export const MARKETS: MarketAsset[] = [
  { symbol: "NVDA", name: "NVIDIA", category: "AI", price: 184.22, change: 4.21 },
  { symbol: "AAPL", name: "Apple", category: "TECHNOLOGY", price: 242.91, change: 0.92 },
  { symbol: "GOOGL", name: "Alphabet", category: "TECHNOLOGY", price: 201.44, change: 1.38 },
  { symbol: "MSFT", name: "Microsoft", category: "TECHNOLOGY", price: 512.07, change: 3.72 },
  { symbol: "AMZN", name: "Amazon", category: "CONSUMER", price: 231.6, change: -0.44 },
  { symbol: "TSLA", name: "Tesla", category: "AUTOMOTIVE", price: 427.18, change: -1.83 },
  { symbol: "COIN", name: "Coinbase", category: "FINTECH", price: 356.9, change: 6.41 },
  { symbol: "MSTR", name: "MicroStrategy", category: "CRYPTO", price: 402.55, change: 3.72 },
];

export const assetsByCategory = (category: string) =>
  MARKETS.filter((m) => m.category === category);

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: "follow",
    title: "Follow Bloom on X",
    description: "Follow @bloomterminal to stay in the loop.",
    type: "social",
    reward: 50,
    done: false,
    external: true,
  },
  {
    id: "repost",
    title: "Repost the announcement",
    description: "Amplify the launch post to your network.",
    type: "social",
    reward: 50,
    done: false,
    external: true,
  },
  {
    id: "comment",
    title: "Comment on the pinned post",
    description: "Leave a comment to verify engagement.",
    type: "social",
    reward: 25,
    done: false,
    external: true,
  },
  {
    id: "bind-wallet",
    title: "Bind your wallet",
    description: "Connect a wallet so rewards can be allocated.",
    type: "onchain",
    reward: 100,
    done: false,
  },
  {
    id: "invite-agents",
    title: "Deploy 2 agents",
    description: "Invite two users and get them active.",
    type: "network",
    reward: 150,
    done: false,
  },
];

/** Handles used when simulating invited agents accepting. */
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
