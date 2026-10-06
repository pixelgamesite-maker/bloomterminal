import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  type Agent,
  type AgentStatus,
  type Mission,
  type RewardState,
  type Worker,
  type WorkerClass,
} from "@/lib/types";
import { ECONOMY } from "@/lib/config";
import { INITIAL_MISSIONS, SAMPLE_HANDLES, WORKER_CLASSES } from "@/lib/mock";

/*
 * The terminal store. For now this is entirely client-side mock state so the
 * full product loop is demoable without a backend. Each action maps 1:1 to a
 * future API call (connect X -> OAuth, connect wallet -> signature, etc.),
 * which keeps the swap-in mechanical later.
 */

interface TerminalState {
  xConnected: boolean;
  handle: string | null;
  walletConnected: boolean;
  address: string | null;
  missions: Mission[];
  agents: Agent[];
  worker: Worker | null;
  nftMinted: boolean;
  claimedTotal: number;
}

interface TerminalValue extends TerminalState {
  // derived
  activeAgents: number;
  missionsComplete: boolean;
  eligible: boolean;
  multiplier: number;
  /** base accrued on the current worker */
  baseBalance: number;
  /** base × multiplier — what the user sees */
  displayBalance: number;
  claimable: number;
  rewardState: RewardState;
  // actions
  connectX: (handle?: string) => void;
  connectWallet: () => void;
  signOut: () => void;
  completeMission: (id: string) => void;
  inviteAgent: () => void;
  advanceAgent: (id: string) => void;
  createWorker: (cfg: {
    name: string;
    cls: WorkerClass;
    category: string;
    asset: string;
  }) => void;
  deployWorker: () => void;
  pauseWorker: () => void;
  resumeWorker: () => void;
  mint: () => void;
  claim: () => void;
  reset: () => void;
}

const TerminalContext = createContext<TerminalValue | null>(null);

const AGENT_FLOW: AgentStatus[] = [
  "invited",
  "connected",
  "wallet_pending",
  "active",
  "eligible",
];

function randomAddress(): string {
  const hex = "0123456789abcdef";
  let a = "0x";
  for (let i = 0; i < 40; i++) a += hex[Math.floor(Math.random() * 16)];
  return a;
}

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TerminalState>({
    xConnected: false,
    handle: null,
    walletConnected: false,
    address: null,
    missions: INITIAL_MISSIONS,
    agents: [],
    worker: null,
    nftMinted: false,
    claimedTotal: 0,
  });

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Reward accrual: tick while a worker is active.
  useEffect(() => {
    const interval = setInterval(() => {
      setState((s) => {
        if (!s.worker || s.worker.status !== "active") return s;
        const cls = WORKER_CLASSES.find((c) => c.id === s.worker!.class);
        const mod = cls?.modifier ?? 1;
        const gain = ECONOMY.baseRatePerSecond * 0.5 * mod; // 500ms tick
        return {
          ...s,
          worker: { ...s.worker, baseEarned: s.worker.baseEarned + gain },
        };
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Keep the wallet + network missions in sync with real state.
  useEffect(() => {
    setState((s) => {
      const activeAgents = s.agents.filter(
        (a) => a.status === "active" || a.status === "eligible"
      ).length;
      const missions = s.missions.map((m) => {
        if (m.id === "bind-wallet") return { ...m, done: s.walletConnected };
        if (m.id === "invite-agents")
          return { ...m, done: activeAgents >= ECONOMY.requiredAgents };
        return m;
      });
      // avoid redundant updates
      const changed = missions.some((m, i) => m.done !== s.missions[i].done);
      return changed ? { ...s, missions } : s;
    });
  }, [state.walletConnected, state.agents]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const connectX = useCallback((handle?: string) => {
    const h = handle?.replace(/^@/, "").trim() || "operator";
    setState((s) => ({ ...s, xConnected: true, handle: h }));
  }, []);

  const connectWallet = useCallback(() => {
    setState((s) => ({ ...s, walletConnected: true, address: randomAddress() }));
  }, []);

  const signOut = useCallback(() => {
    setState({
      xConnected: false,
      handle: null,
      walletConnected: false,
      address: null,
      missions: INITIAL_MISSIONS,
      agents: [],
      worker: null,
      nftMinted: false,
      claimedTotal: 0,
    });
  }, []);

  const completeMission = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      missions: s.missions.map((m) => (m.id === id ? { ...m, done: true } : m)),
    }));
  }, []);

  const advanceAgent = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      agents: s.agents.map((a) => {
        if (a.id !== id) return a;
        const idx = AGENT_FLOW.indexOf(a.status);
        const next = AGENT_FLOW[Math.min(idx + 1, AGENT_FLOW.length - 1)];
        return { ...a, status: next };
      }),
    }));
  }, []);

  const inviteAgent = useCallback(() => {
    const id = crypto.randomUUID();
    const handle =
      SAMPLE_HANDLES[Math.floor(Math.random() * SAMPLE_HANDLES.length)] +
      Math.floor(Math.random() * 90 + 10);
    setState((s) => ({
      ...s,
      agents: [...s.agents, { id, handle, status: "invited" }],
    }));
    // Simulate the invited user progressing through onboarding.
    [
      [900, "connected"],
      [1700, "wallet_pending"],
      [2600, "active"],
      [3500, "eligible"],
    ].forEach(([delay, status]) => {
      const t = setTimeout(() => {
        setState((s) => ({
          ...s,
          agents: s.agents.map((a) =>
            a.id === id ? { ...a, status: status as AgentStatus } : a
          ),
        }));
      }, delay as number);
      timers.current.push(t);
    });
  }, []);

  const createWorker = useCallback(
    (cfg: { name: string; cls: WorkerClass; category: string; asset: string }) => {
      setState((s) => ({
        ...s,
        worker: {
          id: crypto.randomUUID(),
          name: cfg.name.toUpperCase(),
          class: cfg.cls,
          category: cfg.category,
          asset: cfg.asset,
          status: "ready",
          createdAt: Date.now(),
          deployedAt: null,
          baseEarned: 0,
        },
      }));
    },
    []
  );

  const deployWorker = useCallback(() => {
    setState((s) =>
      s.worker
        ? { ...s, worker: { ...s.worker, status: "active", deployedAt: Date.now() } }
        : s
    );
  }, []);

  const pauseWorker = useCallback(() => {
    setState((s) =>
      s.worker && s.worker.status === "active"
        ? { ...s, worker: { ...s.worker, status: "paused" } }
        : s
    );
  }, []);

  const resumeWorker = useCallback(() => {
    setState((s) =>
      s.worker && s.worker.status === "paused"
        ? { ...s, worker: { ...s.worker, status: "active" } }
        : s
    );
  }, []);

  const mint = useCallback(() => {
    setState((s) => ({ ...s, nftMinted: true }));
  }, []);

  const claim = useCallback(() => {
    setState((s) => {
      if (!s.worker || !s.nftMinted) return s;
      const claimedNow = s.worker.baseEarned * ECONOMY.nftMultiplier;
      return {
        ...s,
        claimedTotal: s.claimedTotal + claimedNow,
        worker: { ...s.worker, baseEarned: 0 },
      };
    });
  }, []);

  const value = useMemo<TerminalValue>(() => {
    const activeAgents = state.agents.filter(
      (a) => a.status === "active" || a.status === "eligible"
    ).length;
    const missionsComplete = state.missions.every((m) => m.done);
    const eligible =
      state.xConnected &&
      state.walletConnected &&
      missionsComplete &&
      activeAgents >= ECONOMY.requiredAgents;
    const multiplier = state.nftMinted ? ECONOMY.nftMultiplier : 1;
    const baseBalance = state.worker?.baseEarned ?? 0;
    const displayBalance = baseBalance * multiplier;
    const claimable = state.nftMinted ? displayBalance : 0;

    let rewardState: RewardState = "accumulating";
    if (baseBalance > 0 && !state.nftMinted) rewardState = "locked";
    else if (state.nftMinted && baseBalance > 0) rewardState = "claimable";
    else if (state.nftMinted) rewardState = "eligible";

    return {
      ...state,
      activeAgents,
      missionsComplete,
      eligible,
      multiplier,
      baseBalance,
      displayBalance,
      claimable,
      rewardState,
      connectX,
      connectWallet,
      signOut,
      completeMission,
      inviteAgent,
      advanceAgent,
      createWorker,
      deployWorker,
      pauseWorker,
      resumeWorker,
      mint,
      claim,
      reset: signOut,
    };
  }, [
    state,
    connectX,
    connectWallet,
    signOut,
    completeMission,
    inviteAgent,
    advanceAgent,
    createWorker,
    deployWorker,
    pauseWorker,
    resumeWorker,
    mint,
    claim,
  ]);

  return <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>;
}

export function useTerminal() {
  const ctx = useContext(TerminalContext);
  if (!ctx) throw new Error("useTerminal must be used inside <TerminalProvider>");
  return ctx;
}
