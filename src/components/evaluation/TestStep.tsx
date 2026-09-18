import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api, ApiError, type Next } from "@/lib/evaluation";

interface Item { index: number; total: number; id: string; section: string; kind: "mcq" | "sjt"; stem: string; options: string[]; time_s: number; remaining_s: number; sitting_left_s: number }
type NextResp = { ok: boolean; item?: Item; done?: boolean; next?: Next };
type AnswerResp = { ok: boolean; done?: boolean; next?: Next; index?: number; total?: number };

const fmt = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

/**
 * One question per screen. The answer request never carries the next question: after every answer the page
 * fetches it with test/next, and the server starts that question's timer only when it is first served — so a
 * reply lost on the way back cannot burn a question. A failed request shows "reconnecting" and re-syncs.
 */
const TestStep = ({ onDone }: { onDone: (next: Next) => void }) => {
  const [item, setItem] = useState<Item | null>(null);
  const [left, setLeft] = useState(0);
  const [sitting, setSitting] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const [worst, setWorst] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const blur = useRef(0);
  const inflight = useRef(false);
  const itemRef = useRef<Item | null>(null);

  const showItem = useCallback((it: Item) => {
    const same = itemRef.current && itemRef.current.id === it.id;
    itemRef.current = it;
    setItem(it); setLeft(it.remaining_s); setSitting(it.sitting_left_s);
    if (!same) { setChoice(null); setBest(null); setWorst(null); }   // keep the choice when the same question comes back
    setErr(""); setReconnecting(false);
  }, []);

  const fetchNext = useCallback(async () => {
    try {
      const r = await api<NextResp>("test/next");
      if (r.done || !r.item) { onDone(r.next || "done"); return; }
      showItem(r.item);
    } catch (ex) {
      setReconnecting(true);
      setErr(ex instanceof ApiError ? ex.message : "Network problem — reconnecting…");
      setTimeout(fetchNext, 3000);
    }
  }, [onDone, showItem]);

  useEffect(() => {
    fetchNext();
    const onVis = () => { if (document.hidden) blur.current += 1; };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [fetchNext]);

  const submit = useCallback(async (auto = false) => {
    const it = itemRef.current;
    if (!it || inflight.current) return;
    if (!auto) {
      if (it.kind === "mcq" && choice === null) { setErr("Pick an answer."); return; }
      if (it.kind === "sjt" && (best === null || worst === null || best === worst)) { setErr("Pick the BEST action and a different WORST action."); return; }
    }
    inflight.current = true; setBusy(true); setErr("");
    try {
      const body: Record<string, unknown> = { item_id: it.id, blur_delta: blur.current };
      if (it.kind === "mcq") body.choice = choice; else { body.best = best; body.worst = worst; }
      const r = await api<AnswerResp>("test/answer", body);
      blur.current = 0;
      if (r.done) { onDone(r.next || "done"); return; }
      await fetchNext();
    } catch (ex) {
      // Recorded but the reply was lost (409 = server already ahead), or nothing arrived: re-sync either way.
      setReconnecting(true);
      setErr(ex instanceof ApiError && ex.status && ex.status !== 409 && ex.status !== 0 ? ex.message : "Checking with the server…");
      setTimeout(fetchNext, 1500);
    } finally { inflight.current = false; setBusy(false); }
  }, [choice, best, worst, fetchNext, onDone]);

  useEffect(() => {
    if (!item) return;
    const t = setInterval(() => { setLeft((l) => l - 1); setSitting((s) => s - 1); }, 1000);
    return () => clearInterval(t);
  }, [item]);
  useEffect(() => { if (item && left <= 0 && !reconnecting) submit(true); }, [left, item, reconnecting, submit]);

  if (!item) return <p className="text-sm text-muted-foreground">{err || "Loading your test…"}</p>;

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

      {item.index === 0 && <p className="rounded-md border border-input bg-muted/40 p-3 text-xs text-muted-foreground">The 45-minute clock is running from now. Finish the test in one sitting — if your connection drops, the page reconnects and continues from the same question.</p>}
      <p className="whitespace-pre-line text-base leading-relaxed text-foreground">{item.stem}</p>

      {item.kind === "mcq" ? (
        <div className="space-y-2">
          {item.options.map((o, i) => (
            <button type="button" key={i} onClick={() => setChoice(i)} disabled={busy}
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

      {err && <p className={`text-sm ${reconnecting ? "text-muted-foreground" : "text-destructive"}`}>{err}</p>}
      <Button size="lg" className="w-full" disabled={busy || reconnecting} onClick={() => submit(false)}>
        {reconnecting ? "Reconnecting…" : busy ? "Saving…" : item.index + 1 === item.total ? "Finish" : "Next"}
      </Button>
      <p className="text-xs text-muted-foreground">You cannot go back. If the timer runs out the question is submitted as it is.</p>
    </div>
  );
};

export default TestStep;
