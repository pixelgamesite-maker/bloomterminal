import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Sparkles,
  Quote,
  MessageCircle,
  AtSign,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WL_POST_URL } from "@/lib/catalog";
import { submitWhitelist, X_LINK_RE, EVM_RE } from "@/lib/whitelist";

export default function Whitelist() {
  const [handle, setHandle] = useState("");
  const [wallet, setWallet] = useState("");
  const [quote, setQuote] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleOk = handle.trim().replace(/^@+/, "").length > 0;
  const walletOk = EVM_RE.test(wallet.trim());
  const quoteOk = X_LINK_RE.test(quote.trim());
  const commentOk = X_LINK_RE.test(comment.trim());
  const ready = handleOk && walletOk && quoteOk && commentOk;

  async function submit() {
    setErr(null);
    if (!ready) {
      setErr("Fill in your X username, a valid wallet, and both post links.");
      return;
    }
    setBusy(true);
    const res = await submitWhitelist({ handle, wallet, quote, comment });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error ?? "Couldn't submit.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="min-h-screen">
      {/* top bar */}
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
        {/* hero */}
        <div className="text-center">
          <h1 className="display text-3xl sm:text-4xl">Whitelist application</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            Do the two tasks on the pinned post, then drop your links below. No sign-in
            needed, just your X handle and wallet.
          </p>
        </div>

        {done ? (
          <div className="card mt-6 p-7 text-center">
            <div className="flex items-center justify-center gap-2 text-green">
              <Sparkles size={20} />
              <span className="display text-xl">Application submitted</span>
            </div>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
              You're in the pool, @{handle.trim().replace(/^@+/, "")}. We'll review the
              quote and comment and take it from there.
            </p>
            <Button
              variant="pink"
              className="mt-5"
              onClick={() => {
                setDone(false);
                setQuote("");
                setComment("");
              }}
            >
              Submit another
            </Button>
          </div>
        ) : (
          <>
            {/* the post + the two tasks */}
            <div className="card mt-6 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="pixel text-[0.6rem] text-ink-soft">THE POST</div>
                <a
                  href={WL_POST_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1.5 rounded-lg border-2 border-ink bg-screen px-2.5 py-1.5 text-xs font-bold hover:bg-ink hover:text-screen"
                >
                  <ExternalLink size={13} /> Open post
                </a>
              </div>
              <div className="mt-3 space-y-2">
                <TaskLine n={1} icon={<Quote size={14} />} text="Quote the post" />
                <TaskLine n={2} icon={<MessageCircle size={14} />} text="Comment and tag 2 frens" />
              </div>
            </div>

            {/* the form */}
            <div className="card-soft mt-4 space-y-3 p-4">
              <Field
                icon={<AtSign size={15} />}
                label="X username"
                value={handle}
                onChange={setHandle}
                placeholder="yourhandle"
                ok={handleOk}
                mono={false}
              />
              <Field
                icon={<Wallet size={15} />}
                label="Wallet address"
                value={wallet}
                onChange={setWallet}
                placeholder="0x your wallet address"
                ok={walletOk}
                mono
              />
              <Field
                icon={<Quote size={15} />}
                label="Quote link"
                value={quote}
                onChange={setQuote}
                placeholder="https://x.com/you/status/..."
                ok={quoteOk}
                mono={false}
              />
              <Field
                icon={<MessageCircle size={15} />}
                label="Comment link"
                value={comment}
                onChange={setComment}
                placeholder="https://x.com/you/status/..."
                ok={commentOk}
                mono={false}
              />

              {err && <p className="text-center text-xs text-red">{err}</p>}

              <Button
                variant="pink"
                size="lg"
                className="w-full"
                disabled={busy || !ready}
                onClick={submit}
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : "Submit application"}
              </Button>
            </div>

            <p className="mt-4 text-center text-[0.65rem] text-ink-soft">
              One application per X handle. Re-submitting updates your links.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function TaskLine({ n, icon, text }: { n: number; icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border-2 border-ink/10 bg-screen px-3 py-2">
      <span className="grid h-6 w-6 flex-none place-items-center rounded-full border-2 border-ink bg-screen pixel text-[0.6rem]">
        {n}
      </span>
      <span className="text-ink-soft">{icon}</span>
      <span className="font-bold">{text}</span>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  ok,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ok: boolean;
  mono: boolean;
}) {
  const show = value.trim().length > 0;
  return (
    <div>
      <label className="pixel mb-1 block text-[0.55rem] text-ink-soft">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
          {icon}
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          className={`w-full rounded-xl border-2 bg-screen py-2.5 pl-10 pr-9 text-sm outline-none placeholder:text-ink-soft focus:ring-2 focus:ring-pink ${
            mono ? "font-mono" : ""
          } ${show && !ok ? "border-red" : "border-ink"}`}
        />
        {show && (
          <span
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${
              ok ? "text-green" : "text-red"
            }`}
          >
            {ok ? "✓" : "✕"}
          </span>
        )}
      </div>
    </div>
  );
}
