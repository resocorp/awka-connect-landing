import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api, ApiError, type Next } from "@/lib/evaluation";

interface Item { index: number; total: number; id: string; section: string; kind: "mcq" | "sjt"; stem: string; options: string[]; time_s: number; remaining_s: number; sitting_left_s: number }
type Resp = { ok: boolean; item?: Item; done?: boolean; next?: Next };

const fmt = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

const TestStep = ({ onDone }: { onDone: (next: Next) => void }) => {
  const [item, setItem] = useState<Item | null>(null);
  const [left, setLeft] = useState(0);
  const [sitting, setSitting] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const [worst, setWorst] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const blur = useRef(0);
  const submitting = useRef(false);

  const apply = useCallback((r: Resp) => {
    if (r.done || !r.item) { onDone(r.next || "done"); return; }
    setItem(r.item); setLeft(r.item.remaining_s); setSitting(r.item.sitting_left_s);
    setChoice(null); setBest(null); setWorst(null); setErr("");
  }, [onDone]);

  useEffect(() => {
    api<Resp>("test/next").then(apply).catch((ex) => setErr(ex instanceof ApiError ? ex.message : "Could not load the test."));
    const onVis = () => { if (document.hidden) blur.current += 1; };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [apply]);

  const submit = useCallback(async (auto = false) => {
    if (!item || submitting.current) return;
    if (!auto) {
      if (item.kind === "mcq" && choice === null) { setErr("Pick an answer."); return; }
      if (item.kind === "sjt" && (best === null || worst === null || best === worst)) { setErr("Pick the BEST action and a different WORST action."); return; }
    }
    submitting.current = true; setBusy(true); setErr("");
    try {
      const body: Record<string, unknown> = { item_id: item.id, blur_delta: blur.current };
      if (item.kind === "mcq") body.choice = choice; else { body.best = best; body.worst = worst; }
      blur.current = 0;
      const r = await api<Resp>("test/answer", body);
      apply(r);
    } catch (ex) {
      if (ex instanceof ApiError && ex.status === 409) { api<Resp>("test/next").then(apply); }
      else setErr(ex instanceof ApiError ? ex.message : "Network problem — try again.");
    } finally { submitting.current = false; setBusy(false); }
  }, [item, choice, best, worst, apply]);

  useEffect(() => {
    if (!item) return;
    const t = setInterval(() => { setLeft((l) => l - 1); setSitting((s) => s - 1); }, 1000);
    return () => clearInterval(t);
  }, [item]);
  useEffect(() => { if (item && left <= 0) submit(true); }, [left, item, submit]);

  if (err && !item) return <p className="text-sm text-destructive">{err}</p>;
  if (!item) return <p className="text-sm text-muted-foreground">Loading your test…</p>;

  const sectionLabel = item.section === "aptitude" ? "Reasoning" : item.section === "domain" ? "Field knowledge" : "What would you do?";

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Question {item.index + 1} of {item.total} · {sectionLabel}</span>
          <span>this question <strong className={left <= 10 ? "text-destructive" : "text-foreground"}>{fmt(left)}</strong> · test {fmt(sitting)}</span>
        </div>
        <Progress value={(100 * item.index) / item.total} className="h-2" />
      </div>

      <p className="whitespace-pre-line text-base leading-relaxed text-foreground">{item.stem}</p>

      {item.kind === "mcq" ? (
        <div className="space-y-2">
          {item.options.map((o, i) => (
            <button type="button" key={i} onClick={() => setChoice(i)}
              className={`block w-full rounded-lg border p-3 text-left text-sm transition-colors ${choice === i ? "border-primary bg-primary/10" : "border-input bg-background hover:bg-muted"}`}>
              <span className="mr-2 font-semibold">{"ABCD"[i] || i + 1}.</span>{o}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Tap once for the <strong>best</strong> action, and tap a different one for the <strong>worst</strong>.</p>
          {item.options.map((o, i) => (
            <div key={i} className={`flex items-stretch gap-2 rounded-lg border p-2 ${best === i ? "border-green-600" : worst === i ? "border-destructive" : "border-input"}`}>
              <p className="flex-1 p-1 text-sm"><span className="mr-2 font-semibold">{"ABCD"[i] || i + 1}.</span>{o}</p>
              <div className="flex flex-col gap-1">
                <button type="button" onClick={() => { setBest(i); if (worst === i) setWorst(null); }}
                  className={`rounded px-2 py-1 text-xs font-semibold ${best === i ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>BEST</button>
                <button type="button" onClick={() => { setWorst(i); if (best === i) setBest(null); }}
                  className={`rounded px-2 py-1 text-xs font-semibold ${worst === i ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"}`}>WORST</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {err && <p className="text-sm text-destructive">{err}</p>}
      <Button size="lg" className="w-full" disabled={busy} onClick={() => submit(false)}>{busy ? "Saving…" : item.index + 1 === item.total ? "Finish" : "Next"}</Button>
      <p className="text-xs text-muted-foreground">You cannot go back. If the timer runs out the question is submitted as it is.</p>
    </div>
  );
};

export default TestStep;
