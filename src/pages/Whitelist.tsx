import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Sparkles,
  Quote,
  MessageCircle,
  Wallet,
  Lock,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WL_POST_URL } from "@/lib/catalog";
import { submitWhitelist, X_LINK_RE, EVM_RE } from "@/lib/whitelist";

const LS_KEY = "bloom_whitelist_v1";

interface Saved {
  quote?: string;
  comment?: string;
  submitted?: boolean;
}

function load(): Saved {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") as Saved;
  } catch {
    return {};
  }
}
function save(s: Saved) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export default function Whitelist() {
  const [quote, setQuote] = useState("");
  const [comment, setComment] = useState("");
  const [wallet, setWallet] = useState("");
  // which steps are locked-in (completed): 0 = quote, 1 = comment
  const [quoteDone, setQuoteDone] = useState(false);
  const [commentDone, setCommentDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // restore progress on mount
  useEffect(() => {
    const s = load();
    if (s.submitted) {
      setSubmitted(true);
      return;
    }
    if (s.quote) {
      setQuote(s.quote);
      setQuoteDone(true);
    }
    if (s.comment) {
      setComment(s.comment);
      setCommentDone(true);
    }
  }, []);

  function doQuote() {
    setErr(null);
    if (!X_LINK_RE.test(quote.trim())) {
      setErr("Paste a valid https://x.com post link.");
      return;
    }
    setQuoteDone(true);
    save({ ...load(), quote: quote.trim() });
  }

  function doComment() {
    setErr(null);
    if (!X_LINK_RE.test(comment.trim())) {
      setErr("Paste a valid https://x.com post link.");
      return;
    }
    setCommentDone(true);
    save({ ...load(), comment: comment.trim() });
  }

  async function doWallet() {
    setErr(null);
    if (!EVM_RE.test(wallet.trim())) {
      setErr("Paste a valid wallet address (0x + 40 hex).");
      return;
    }
    setBusy(true);
    const res = await submitWhitelist({ wallet, quote, comment });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error ?? "Couldn't submit.");
      return;
    }
    setSubmitted(true);
    save({ submitted: true });
  }

  if (submitted) {
    return (
      <Shell>
        <div className="card mt-6 p-8 text-center">
          <div className="flex items-center justify-center gap-2 text-green">
            <Sparkles size={22} />
            <span className="display text-2xl">You're in</span>
          </div>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
            Your whitelist application is submitted. One entry per person, you're all set,
            no need to do it again.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="mx-auto mt-2 max-w-md text-center text-sm text-ink-soft">
        Finish each step to unlock the next. Quote the post, comment and tag 2 frens, then
        drop your wallet.
      </p>

      <div className="mt-6 space-y-3">
        {/* Step 1 — Quote */}
        <Step
          n={1}
          icon={<Quote size={15} />}
          title="Quote the post"
          desc="Quote the pinned post, then paste the link to your quote."
          state={quoteDone ? "done" : "active"}
          showPost
        >
          <SubmitBox
            value={quote}
            onChange={setQuote}
            onSubmit={doQuote}
            placeholder="https://x.com/you/status/..."
            valid={X_LINK_RE.test(quote.trim())}
            done={quoteDone}
            err={err}
            btnLabel="Submit quote"
          />
        </Step>

        {/* Step 2 — Comment */}
        <Step
          n={2}
          icon={<MessageCircle size={15} />}
          title="Comment and tag 2 frens"
          desc="Comment on the post and tag 2 friends, then paste your comment link."
          state={!quoteDone ? "locked" : commentDone ? "done" : "active"}
          showPost={quoteDone && !commentDone}
        >
          {quoteDone && (
            <SubmitBox
              value={comment}
              onChange={setComment}
              onSubmit={doComment}
              placeholder="https://x.com/you/status/..."
              valid={X_LINK_RE.test(comment.trim())}
              done={commentDone}
              err={err}
              btnLabel="Submit comment"
            />
          )}
        </Step>

        {/* Step 3 — Wallet */}
        <Step
          n={3}
          icon={<Wallet size={15} />}
          title="Submit your wallet"
          desc="Paste the EVM wallet you want whitelisted."
          state={!commentDone ? "locked" : "active"}
        >
          {commentDone && (
            <SubmitBox
              value={wallet}
              onChange={setWallet}
              onSubmit={doWallet}
              placeholder="0x your wallet address"
              valid={EVM_RE.test(wallet.trim())}
              done={false}
              busy={busy}
              err={err}
              mono
              btnLabel="Submit application"
            />
          )}
        </Step>
      </div>

      <p className="mt-5 text-center text-[0.65rem] text-ink-soft">
        One application per person. Links must be valid https://x.com posts, wallet must be
        a valid EVM address.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 border-b-2 border-ink bg-screen/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-2.5">
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg border-2 border-ink bg-screen px-2.5 py-1 text-xs font-bold hover:bg-ink hover:text-screen"
          >
            <ArrowLeft size={14} /> Home
          </Link>
          <span className="pixel text-xs">
            BLOOM<span className="text-ink-soft"> // WHITELIST</span>
            <span className="blink text-pink">_</span>
          </span>
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-7">
        <h1 className="display text-center text-3xl sm:text-4xl">Whitelist application</h1>
        {children}
      </div>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  desc,
  state,
  showPost,
  children,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
  state: "locked" | "active" | "done";
  showPost?: boolean;
  children?: React.ReactNode;
}) {
  const locked = state === "locked";
  const done = state === "done";
  return (
    <div className={`card ${locked ? "opacity-55" : ""} p-4`}>
      <div className="flex items-start gap-3">
        <span
          className={`grid h-8 w-8 flex-none place-items-center rounded-full border-2 border-ink ${
            done ? "bg-green text-ink" : "bg-screen"
          }`}
        >
          {done ? <Check size={16} /> : locked ? <Lock size={14} /> : <span className="pixel text-xs">{n}</span>}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-ink-soft">{icon}</span>
            <span className="display text-base leading-none">{title}</span>
            {done && <span className="pixel text-[0.55rem] text-green">DONE</span>}
          </div>
          <p className="mt-1 text-xs text-ink-soft">{desc}</p>

          {showPost && (
            <a
              href={WL_POST_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-screen px-2.5 py-1.5 text-xs font-bold hover:bg-ink hover:text-screen"
            >
              <ExternalLink size={13} /> Open post
            </a>
          )}

          {!locked && children}
        </div>
      </div>
    </div>
  );
}

function SubmitBox({
  value,
  onChange,
  onSubmit,
  placeholder,
  valid,
  done,
  busy,
  err,
  mono,
  btnLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  valid: boolean;
  done: boolean;
  busy?: boolean;
  err?: string | null;
  mono?: boolean;
  btnLabel: string;
}) {
  const show = value.trim().length > 0;
  return (
    <div className="mt-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !done && onSubmit()}
            placeholder={placeholder}
            spellCheck={false}
            disabled={done}
            className={`w-full rounded-xl border-2 bg-screen py-2.5 pl-3 pr-9 text-sm outline-none placeholder:text-ink-soft focus:ring-2 focus:ring-pink disabled:opacity-70 ${
              mono ? "font-mono" : ""
            } ${show && !valid ? "border-red" : "border-ink"}`}
          />
          {show && (
            <span
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${
                valid ? "text-green" : "text-red"
              }`}
            >
              {valid ? "✓" : "✕"}
            </span>
          )}
        </div>
        {!done && (
          <Button
            variant="pink"
            className="sm:w-44"
            disabled={busy || !valid}
            onClick={onSubmit}
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : btnLabel}
          </Button>
        )}
      </div>
      {!done && err && <p className="mt-1 text-xs text-red">{err}</p>}
    </div>
  );
}
