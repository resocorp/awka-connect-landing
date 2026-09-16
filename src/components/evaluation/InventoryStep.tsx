import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api, ApiError, type Next } from "@/lib/evaluation";

interface Line { id: string; text: string; advanced: boolean }
interface Section { id: string; title: string; trait?: string; lines: Line[] }
interface Scale { score: number; label: string; text: string }
interface Inv {
  scale: Scale[]; last_done: { id: string; label: string }[]; want_learn_prompt: string;
  sections: Section[]; saved: Record<string, { score: number; last_done: string; want_learn: boolean }>; next_section: string | null; name: string;
}
type Rating = { score?: number; last_done?: string; want_learn?: boolean };

const InventoryStep = ({ onDone }: { onDone: (next: Next) => void }) => {
  const [inv, setInv] = useState<Inv | null>(null);
  const [secId, setSecId] = useState<string>("");
  const [r, setR] = useState<Record<string, Rating>>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState<Record<string, string>>({});   // line id -> what is missing, after a save attempt

  useEffect(() => {
    api<Inv>("inventory").then((d) => {
      setInv(d);
      const init: Record<string, Rating> = {};
      for (const [k, v] of Object.entries(d.saved || {})) init[k] = { ...v };
      setR(init);
      setSecId(d.next_section || d.sections[0].id);
    }).catch((ex) => setErr(ex instanceof ApiError ? ex.message : "Could not load the inventory."));
  }, []);

  const sec = useMemo(() => inv?.sections.find((s) => s.id === secId), [inv, secId]);
  const idx = inv ? inv.sections.findIndex((s) => s.id === secId) : 0;
  const complete = (l: Line) => { const x = r[l.id]; return !!(x && x.score && x.last_done); };
  const allDone = sec ? sec.lines.every(complete) : false;
  const answered = inv ? inv.sections.reduce((n, s) => n + s.lines.filter(complete).length, 0) : 0;
  const total = inv ? inv.sections.reduce((n, s) => n + s.lines.length, 0) : 1;

  const set = (id: string, patch: Rating) => {
    setR({ ...r, [id]: { ...(r[id] || {}), ...patch } });
    if (missing[id]) { const m = { ...missing }; delete m[id]; setMissing(m); }
  };

  /** What is still missing on a line, in the person's words. */
  const gap = (l: Line): string => {
    const x = r[l.id] || {};
    if (!x.score && !x.last_done) return "pick a number and when you last did it";
    if (!x.score) return "pick a number 1–5";
    if (!x.last_done) return "tick when you last did it";
    return "";
  };

  const save = async () => {
    if (!sec) return;
    const gaps: Record<string, string> = {};
    for (const l of sec.lines) { const g = gap(l); if (g) gaps[l.id] = g; }
    if (Object.keys(gaps).length) {
      setMissing(gaps);
      const ids = Object.keys(gaps);
      setErr(`${ids.length} line${ids.length > 1 ? "s" : ""} not complete: ${ids.join(", ")}. Each one is marked below.`);
      document.getElementById(`line-${ids[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setMissing({});
    setErr(""); setBusy(true);
    try {
      const res = await api<{ next_section: string | null; next: Next }>("inventory", {
        section: sec.id,
        ratings: sec.lines.map((l) => ({ line_id: l.id, score: r[l.id]?.score, last_done: r[l.id]?.last_done, want_learn: !!r[l.id]?.want_learn })),
      });
      if (res.next_section) { setSecId(res.next_section); window.scrollTo({ top: 0, behavior: "smooth" }); }
      else onDone(res.next);
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "Network problem — your answers for this section were not saved. Try again.");
    } finally { setBusy(false); }
  };

  if (err && !inv) return <p className="text-sm text-destructive">{err}</p>;
  if (!inv || !sec) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Section {idx + 1} of {inv.sections.length}</span><span>{answered} of {total} answered</span>
        </div>
        <Progress value={(100 * answered) / total} className="h-2" />
      </div>

      <details className="rounded-md border border-input bg-muted/40 p-3 text-sm" open={idx === 0}>
        <summary className="cursor-pointer font-medium">What the numbers mean</summary>
        <ul className="mt-2 space-y-1">
          {inv.scale.map((s) => <li key={s.score}><strong>{s.score} · {s.label}</strong> — {s.text}</li>)}
        </ul>
        <p className="mt-2 text-muted-foreground">Then tick when you last did it. On a 1 or 2, tell us if you want to learn it. Be honest — this is checked against the test and the trial day.</p>
      </details>

      <h2 className="text-xl font-semibold text-foreground">{sec.id} · {sec.title}</h2>

      <ol className="space-y-4">
        {sec.lines.map((l, i) => {
          const x = r[l.id] || {};
          return (
            <li key={l.id} id={`line-${l.id}`} className={`rounded-lg border p-3 ${missing[l.id] ? "border-destructive bg-destructive/5" : complete(l) ? "border-input" : "border-primary/40"}`}>
              <p className="text-sm"><span className="mr-2 text-xs text-muted-foreground">{l.id}</span>Can you {l.text}?
                {l.advanced && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">advanced</span>}</p>
              <div className="mt-2 grid grid-cols-5 gap-1.5">
                {inv.scale.map((s) => (
                  <button type="button" key={s.score} title={s.label} onClick={() => set(l.id, { score: s.score, want_learn: s.score <= 2 ? x.want_learn : false })}
                    className={`rounded-md border py-2 text-base font-semibold transition-colors ${x.score === s.score ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted"}`}>
                    {s.score}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs font-medium text-muted-foreground">When did you last do this?</p>
              <div className="mt-1 grid grid-cols-4 gap-1.5">
                {inv.last_done.map((d) => (
                  <button type="button" key={d.id} onClick={() => set(l.id, { last_done: d.id })}
                    className={`rounded-md border px-1 py-2 text-sm font-medium leading-tight transition-colors ${x.last_done === d.id ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-foreground hover:bg-muted"}`}>
                    {d.label}
                  </button>
                ))}
              </div>
              {missing[l.id] && <p className="mt-2 text-xs font-semibold text-destructive">Not complete — {missing[l.id]}.</p>}
              {x.score !== undefined && x.score <= 2 && (
                <label className="mt-2 flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={!!x.want_learn} onChange={(e) => set(l.id, { want_learn: e.target.checked })} />
                  {inv.want_learn_prompt}
                </label>
              )}
            </li>
          );
        })}
      </ol>

      <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 p-4 backdrop-blur sm:mx-0 sm:rounded-md sm:border">
        {err && <p className="mb-2 text-sm font-medium text-destructive">{err}</p>}
        <Button size="lg" className="w-full" disabled={busy} onClick={save}>
          {busy ? "Saving…" : idx + 1 < inv.sections.length ? "Save and continue" : "Save and start the test"}
        </Button>
        {!allDone && !err && <p className="mt-2 text-center text-xs text-muted-foreground">{sec.lines.filter((l) => !complete(l)).length} of {sec.lines.length} lines still to answer</p>}
      </div>
    </div>
  );
};

export default InventoryStep;
