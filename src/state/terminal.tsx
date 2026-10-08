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
  type MarketKind,
  type Mission,
  type RewardState,
  type Worker,
  type WorkerClass,
} from "@/lib/types";
import { ECONOMY } from "@/lib/config";
import { INITIAL_MISSIONS, SAMPLE_HANDLES, WORKER_CLASSES } from "@/lib/mock";
import {
  supabase,
  loadProfile,
  attributeReferral,
  loadInvites,
  pushEligibility,
  type InviteRow,
} from "@/lib/supabase";
import { captureRefFromUrl } from "@/lib/referral";

/*
 * The terminal store. Auth is real X OAuth via Supabase when configured.
 * The in-app game state (missions, agents, worker, rewards) is still local
 * for now — each action maps 1:1 to a future API call so persistence can be
 * layered on without changing the UI.
 */

interface TerminalState {
  xConnected: boolean;
  authLoading: boolean;
  userId: string | null;
  handle: string | null;
  avatar: string | null;
  walletConnected: boolean;
  address: string | null;
  missions: Mission[];
  agents: Agent[];
  /** Real referred friends, loaded from Supabase when configured. */
  invites: InviteRow[];
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
  signInWithX: () => Promise<void>;
  /** Bind a wallet. Returns false if the address is not a valid EVM address. */
  bindWallet: (address: string) => boolean;
  signOut: () => void;
  completeMission: (id: string) => void;
  inviteAgent: () => void;
  advanceAgent: (id: string) => void;
  /** Re-fetch the real referred-friends list from Supabase. */
  refreshInvites: () => void;
  createWorker: (cfg: {
    cls: WorkerClass;
    kind: MarketKind;
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

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TerminalState>({
    xConnected: false,
    authLoading: Boolean(supabase), // wait for Supabase to resolve the session
    userId: null,
    handle: null,
    avatar: null,
    walletConnected: false,
    address: null,
    missions: INITIAL_MISSIONS,
    agents: [],
    invites: [],
    worker: null,
    nftMinted: false,
    claimedTotal: 0,
  });

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Real X auth via Supabase: hydrate from the session, then keep in sync.
  useEffect(() => {
    if (!supabase) return;
    captureRefFromUrl(); // pick up ?ref= if present

    async function hydrate(userId: string | undefined, meta?: Record<string, unknown>) {
      if (!userId) {
        setState((s) => ({ ...s, xConnected: false, userId: null, handle: null, avatar: null, authLoading: false }));
        return;
      }
      const profile = await loadProfile(userId);
      const handle =
        profile?.x_username ??
        (meta?.user_name as string) ??
        (meta?.preferred_username as string) ??
        "operator";
      const avatar =
        profile?.x_profile_image ??
        ((meta?.avatar_url as string) || (meta?.picture as string) || null);
      setState((s) => ({
        ...s,
        xConnected: true,
        authLoading: false,
        userId,
        handle,
        avatar: avatar ? avatar.replace("_normal", "_400x400") : null,
        walletConnected: Boolean(profile?.wallet_address && profile?.wallet_verified) || s.walletConnected,
        address: profile?.wallet_address ?? s.address,
      }));

      // Attribute any pending referral, then load the real referred list.
      await attributeReferral(userId, handle);
      const invites = await loadInvites(userId);
      setState((s) => ({ ...s, invites }));
    }

    supabase.auth.getSession().then(({ data }) => {
      hydrate(data.session?.user?.id, data.session?.user?.user_metadata);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      hydrate(session?.user?.id, session?.user?.user_metadata);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

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

  // Keep the wallet + network missions in sync with real state. With a backend
  // the active count comes from real referred friends (wallet-bound); without
  // one it falls back to the local demo agents.
  useEffect(() => {
    setState((s) => {
      const activeAgents = supabase
        ? s.invites.filter((i) => i.walletVerified).length
        : s.agents.filter((a) => a.status === "active" || a.status === "eligible").length;
      const missions = s.missions.map((m) => {
        if (m.id === "bind-wallet") return { ...m, done: s.walletConnected };
        if (m.id === "invite-agents")
          return { ...m, done: activeAgents >= ECONOMY.requiredAgents };
        return m;
      });
      const changed = missions.some((m, i) => m.done !== s.missions[i].done);
      return changed ? { ...s, missions } : s;
    });
  }, [state.walletConnected, state.agents, state.invites]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  // Mirror eligibility to the profile so an inviter can see this user "count".
  const lastEligible = useRef<boolean | null>(null);
  useEffect(() => {
    if (!supabase || !state.userId) return;
    const activeAgents = state.invites.filter((i) => i.walletVerified).length;
    const eligible =
      state.walletConnected &&
      state.missions.every((m) => m.done) &&
      activeAgents >= ECONOMY.requiredAgents;
    if (lastEligible.current !== eligible) {
      lastEligible.current = eligible;
      pushEligibility(state.userId, eligible);
    }
  }, [state.userId, state.walletConnected, state.missions, state.invites]);

  const signInWithX = useCallback(async () => {
    if (supabase) {
      // Real X OAuth (OAuth 2.0 — provider "x"; legacy "twitter"/OAuth 1.0a is
      // being deprecated). Browser redirects to X and back to /app, where
      // detectSessionInUrl + onAuthStateChange pick the session up.
      await supabase.auth.signInWithOAuth({
        provider: "x",
        options: { redirectTo: `${window.location.origin}/app` },
      });
      return;
    }
    // No backend configured (local preview without .env.local): sign in as a
    // guest so the UI is still usable.
    setState((s) => ({ ...s, xConnected: true, handle: "guest", authLoading: false }));
  }, []);

  const bindWallet = useCallback((address: string) => {
    const addr = address.trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) return false;
    setState((s) => ({ ...s, walletConnected: true, address: addr }));
    // Persist to the profile when Supabase is configured (best-effort).
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        const uid = data.user?.id;
        if (uid) {
          supabase!
            .from("profiles")
            .update({ wallet_address: addr, wallet_verified: true })
            .eq("id", uid)
            .then(() => {});
        }
      });
    }
    return true;
  }, []);

  const signOut = useCallback(() => {
    if (supabase) supabase.auth.signOut();
    setState({
      xConnected: false,
      authLoading: false,
      userId: null,
      handle: null,
      avatar: null,
      walletConnected: false,
      address: null,
      missions: INITIAL_MISSIONS,
      agents: [],
      invites: [],
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

  const refreshInvites = useCallback(() => {
    setState((s) => {
      if (supabase && s.userId) loadInvites(s.userId).then((invites) => setState((p) => ({ ...p, invites })));
      return s;
    });
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
    (cfg: { cls: WorkerClass; kind: MarketKind; asset: string }) => {
      const info = WORKER_CLASSES.find((c) => c.id === cfg.cls);
      // Picking an agent is one-time and starts it working immediately.
      setState((s) => ({
        ...s,
        worker: {
          id: crypto.randomUUID(),
          name: (info?.label ?? "Agent").toUpperCase(),
          class: cfg.cls,
          kind: cfg.kind,
          asset: cfg.asset,
          status: "active",
          createdAt: Date.now(),
          deployedAt: Date.now(),
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
    const activeAgents = supabase
      ? state.invites.filter((i) => i.walletVerified).length
      : state.agents.filter((a) => a.status === "active" || a.status === "eligible").length;
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
      signInWithX,
      bindWallet,
      signOut,
      completeMission,
      inviteAgent,
      advanceAgent,
      refreshInvites,
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
    signInWithX,
    bindWallet,
    signOut,
    completeMission,
    inviteAgent,
    advanceAgent,
    refreshInvites,
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
