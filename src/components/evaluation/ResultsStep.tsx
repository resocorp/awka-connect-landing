import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api, ApiError, type Next } from "@/lib/evaluation";

interface Weak { id: string; text: string; score: number }
interface Sec { id: string; title: string; mean: number | null; previous_mean: number | null; weak: Weak[] }
interface Attempt { attempt: number; inventory_done_at: string | null; level: string | null; core_mean: number | null; test_done_at: string | null; score_aptitude: number | null; score_domain: number | null; score_sjt: number | null }
export interface Results {
  attempt: number; level: string; core_mean: number; level_text: string; caveat: string; invite: string;
  previous_level: string | null; previous_core_mean: number | null; sections: Sec[]; want_learn: string[]; want_learn_saved: boolean;
  test: { aptitude: number; domain: number; sjt: number } | null; test_state: "none" | "open" | "finished"; test_optional: boolean;
  history: Attempt[]; can_reevaluate: boolean; reevaluate_after_days: number; name: string; next: Next;
}

const pct = (v: number | null | undefined) => (v == null ? "–" : `${Math.round(v)}%`);
const delta = (now: number | null, prev: number | null) => {
  if (now == null || prev == null) return null;
  const d = Math.round((now - prev) * 10) / 10;
  return d === 0 ? <span className="text-muted-foreground">no change</span> : <span className={d > 0 ? "text-green-700" : "text-destructive"}>{d > 0 ? "▲" : "▼"} {Math.abs(d)}</span>;
};

const ResultsStep = ({ onStartTest, onFinish }: { onStartTest: () => void; onFinish: () => void }) => {
  const [r, setR] = useState<Results | null>(null);
  const [want, setWant] = useState<Set<string>>(new Set());
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Results>("results").then((d) => { setR(d); setWant(new Set(d.want_learn || [])); })
      .catch((ex) => setErr(ex instanceof ApiError ? ex.message : "Could not load your result."));
  }, []);

  const save = async (): Promise<boolean> => {
    setBusy(true); setErr("");
    try { await api("want_learn", { sections: Array.from(want) }); return true; }
    catch (ex) { setErr(ex instanceof ApiError ? ex.message : "Network problem — try again."); return false; }
    finally { setBusy(false); }
  };
  const reevaluate = async () => {
    if (!confirm("Start a new evaluation? Your previous answers stay on record and are compared with the new ones.")) return;
    setBusy(true);
    try { await api("reevaluate", {}); window.location.reload(); }
    catch (ex) { setErr(ex instanceof ApiError ? ex.message : "Network problem — try again."); setBusy(false); }
  };

  if (err && !r) return <p className="text-sm text-destructive">{err}</p>;
  if (!r) return <p className="text-sm text-muted-foreground">Working out your result…</p>;

  const weakSecs = r.sections.filter((s) => s.weak.length);
  const first = r.name?.split(" ")[0] || "";

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-primary/40 bg-primary/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Your result{r.attempt > 1 ? ` · evaluation #${r.attempt}` : ""}</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">{first ? `${first}, you measure up to ` : "You measure up to "}<span className="text-primary">{r.level}</span></h2>
        <p className="mt-1 text-sm text-foreground">{r.level_text}</p>
        <p className="mt-2 text-xs text-muted-foreground">Core skills average {r.core_mean.toFixed(1)} out of 5{r.previous_core_mean != null && <> (last time {Number(r.previous_core_mean).toFixed(1)}, {delta(r.core_mean, Number(r.previous_core_mean))})</>}.
          {r.previous_level && r.previous_level !== r.level && <> Level last time: {r.previous_level}.</>} {r.caveat}</p>
      </section>

      {r.attempt > 1 && (
        <section>
          <h3 className="mb-2 font-semibold text-foreground">Then and now, by section</h3>
          <table className="w-full text-sm">
            <tbody>
              {r.sections.map((s) => (
                <tr key={s.id} className="border-b border-border">
                  <td className="py-1.5 pr-2"><span className="text-muted-foreground">{s.id}</span> {s.title}</td>
                  <td className="py-1.5 text-right tabular-nums text-muted-foreground">{s.previous_mean != null ? Number(s.previous_mean).toFixed(1) : "–"}</td>
                  <td className="py-1.5 pl-2 text-right tabular-nums font-medium">{s.mean != null ? s.mean.toFixed(1) : "–"}</td>
                  <td className="py-1.5 pl-2 text-right text-xs">{delta(s.mean, s.previous_mean != null ? Number(s.previous_mean) : null)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h3 className="mb-1 font-semibold text-foreground">{weakSecs.length ? "Where you rated yourself 1 or 2" : "No section with a 1 or 2 — well done"}</h3>
        {weakSecs.length > 0 && <p className="mb-3 text-sm text-muted-foreground">Tick the ones you would want to learn. This goes to the team that plans training; it does not lower your result.</p>}
        <div className="space-y-2">
          {weakSecs.map((s) => (
            <label key={s.id} className={`block rounded-lg border p-3 ${want.has(s.id) ? "border-primary bg-primary/5" : "border-input"}`}>
              <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" checked={want.has(s.id)} onChange={(e) => { const n = new Set(want); e.target.checked ? n.add(s.id) : n.delete(s.id); setWant(n); }} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{s.id} · {s.title} <span className="font-normal text-muted-foreground">— I want to learn this</span></p>
                  <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {s.weak.map((w) => <li key={w.id}><span className="mr-1 inline-block w-5 text-center font-semibold text-foreground">{w.score}</span>{w.text}</li>)}
                  </ul>
                </div>
              </div>
            </label>
          ))}
        </div>
      </section>

      {r.test ? (
        <section className="rounded-lg border border-input p-4">
          <h3 className="font-semibold text-foreground">Your test{r.attempt > 1 ? ` (evaluation #${r.attempt})` : ""}</h3>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-muted p-2"><p className="text-xl font-bold text-foreground">{pct(r.test.aptitude)}</p><p className="text-xs text-muted-foreground">reasoning</p></div>
            <div className="rounded-md bg-muted p-2"><p className="text-xl font-bold text-foreground">{pct(r.test.domain)}</p><p className="text-xs text-muted-foreground">field knowledge</p></div>
            <div className="rounded-md bg-muted p-2"><p className="text-xl font-bold text-foreground">{pct(r.test.sjt)}</p><p className="text-xs text-muted-foreground">judgement</p></div>
          </div>
          {r.history.filter((h) => h.attempt < r.attempt && h.score_aptitude != null).slice(-1).map((h) => (
            <p key={h.attempt} className="mt-2 text-xs text-muted-foreground">Last time (evaluation #{h.attempt}): reasoning {pct(h.score_aptitude)}, field knowledge {pct(h.score_domain)}, judgement {pct(h.score_sjt)}.</p>
          ))}
        </section>
      ) : r.test_state === "none" && (
        <section className="rounded-lg border border-input p-4">
          <h3 className="font-semibold text-foreground">The online test</h3>
          <p className="mt-1 text-sm text-muted-foreground">{r.invite}</p>
        </section>
      )}

      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex flex-wrap gap-3">
        {!r.test && r.test_state === "none" && (
          <Button size="lg" disabled={busy} onClick={async () => { if (await save()) onStartTest(); }}>Start the test now</Button>
        )}
        {r.test_state === "open" && <Button size="lg" disabled={busy} onClick={async () => { if (await save()) onStartTest(); }}>Continue the test</Button>}
        <Button size="lg" variant={r.test ? "default" : "outline"} disabled={busy} onClick={async () => { if (await save()) onFinish(); }}>{r.test ? "Finish" : "Finish for now"}</Button>
        {r.can_reevaluate && <Button size="lg" variant="ghost" disabled={busy} onClick={reevaluate}>Re-evaluate myself</Button>}
      </div>
      {!r.test && r.test_state === "none" && <p className="text-xs text-muted-foreground">Finishing for now keeps your result. Come back any time with "Continue a saved evaluation" to take the test.</p>}
      {!r.can_reevaluate && r.attempt >= 1 && (r.test || r.test_state === "finished") && <p className="text-xs text-muted-foreground">You can re-evaluate yourself {r.reevaluate_after_days} days after completing an evaluation, or when PHSWEB invites you.</p>}
    </div>
  );
};

export default ResultsStep;
