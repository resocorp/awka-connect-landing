import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiRetry, ApiError, localGet, localSet, waitText, type Next } from "@/lib/evaluation";

interface Line { id: string; text: string; advanced: boolean }
interface Section { id: string; title: string; trait?: string; lines: Line[] }
interface Scale { score: number; label: string; text: string }
interface Inv {
  scale: Scale[]; last_done: { id: string; label: string }[]; want_learn_prompt: string;
  sections: Section[]; saved: Record<string, { score: number; last_done: string; want_learn: boolean }>; next_section: string | null; name: string;
  previous?: Record<string, number>; attempt?: number;
}
type Rating = { score?: number; last_done?: string };
/** Everything the person has tapped, kept on the phone: survives a closed tab and a dead network. */
interface LocalInv { attempt: number; ratings: Record<string, Rating>; pending: string[] }
const LKEY = "phsweb_eval_inventory";

/**
 * Local-first: every tap is stored on the phone at once. "Save and continue" moves on immediately and the
 * section is queued for sending; a sync loop sends queued sections in order with silent retries and shows a
 * small status line. The results step is only opened once every section has reached the server.
 */
const InventoryStep = ({ onDone }: { onDone: (next: Next) => void }) => {
  const [inv, setInv] = useState<Inv | null>(null);
  const [secId, setSecId] = useState<string>("");
  const [r, setR] = useState<Record<string, Rating>>({});
  const [pending, setPending] = useState<string[]>([]);
  const [missing, setMissing] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const [loadMsg, setLoadMsg] = useState("Loading…");
  const [syncMsg, setSyncMsg] = useState("");
  const [trouble, setTrouble] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const syncing = useRef(false);
  const attemptRef = useRef(1);
  const pendingRef = useRef<string[]>([]);
  const ratingsRef = useRef<Record<string, Rating>>({});

  const persist = useCallback((ratings: Record<string, Rating>, pend: string[]) => {
    ratingsRef.current = ratings; pendingRef.current = pend;
    localSet(LKEY, { attempt: attemptRef.current, ratings, pending: pend } as LocalInv);
  }, []);

  // ---- load: server state + local state, local wins for sections still to be sent
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await apiRetry<Inv>("inventory", undefined, { onWait: (ms) => setLoadMsg(waitText(ms, "Loading")) });
        if (cancelled) return;
        attemptRef.current = d.attempt || 1;
        const local = localGet<LocalInv>(LKEY);
        const useLocal = local && local.attempt === attemptRef.current;
        const merged: Record<string, Rating> = {};
        for (const [k, v] of Object.entries(d.saved || {})) merged[k] = { score: v.score, last_done: v.last_done };
        const pend = useLocal ? (local.pending || []) : [];
        if (useLocal) {
          for (const [k, v] of Object.entries(local.ratings || {})) {
            const sec = k.replace(/[0-9]+$/, "");
            if (pend.includes(sec) || !merged[k]) merged[k] = v;   // unsent sections and untouched lines come from the phone
          }
        }
        setInv(d); setR(merged); setPending(pend); persist(merged, pend);
        const complete = (l: Line) => { const x = merged[l.id]; return !!(x && x.score && x.last_done); };
        const first = d.sections.find((s) => !pend.includes(s.id) && s.lines.some((l) => !complete(l)));
        setSecId(first ? first.id : (pend.length ? d.sections[d.sections.length - 1].id : d.sections[0].id));
        if (!first) setFinishing(true);
      } catch (ex) {
        setErr(ex instanceof ApiError && !ex.transient ? ex.message : "We are having trouble reaching our server. The page keeps trying.");
      }
    })();
    return () => { cancelled = true; };
  }, [persist]);

  // ---- sync loop: send queued sections in order, silent retries, neutral status
  const sync = useCallback(async () => {
    if (syncing.current || !inv) return;
    syncing.current = true;
    try {
      while (pendingRef.current.length) {
        const sec = inv.sections.find((s) => s.id === pendingRef.current[0]);
        if (!sec) { const rest = pendingRef.current.slice(1); setPending(rest); persist(ratingsRef.current, rest); continue; }
        const ratings = sec.lines.map((l) => ({ line_id: l.id, score: ratingsRef.current[l.id]?.score, last_done: ratingsRef.current[l.id]?.last_done, want_learn: false }));
        try {
          setSyncMsg(`Saving section ${sec.id}…`);
          await apiRetry<{ next_section: string | null; next: Next }>("inventory", { section: sec.id, ratings },
            { onWait: (ms) => { setSyncMsg(waitText(ms)); setTrouble(ms >= 60000); }, maxMs: 6 * 60 * 1000 });
          const rest = pendingRef.current.filter((x) => x !== sec.id);
          setPending(rest); persist(ratingsRef.current, rest); setTrouble(false);
        } catch (ex) {
          if (ex instanceof ApiError && !ex.transient) {           // a validation error: unqueue and show it on that section
            const rest = pendingRef.current.filter((x) => x !== sec.id);
            setPending(rest); persist(ratingsRef.current, rest);
            setErr(`Section ${sec.id}: ${ex.message}`); setSecId(sec.id); setFinishing(false);
          } else {
            setTrouble(true); setSyncMsg(waitText(61000)); setTimeout(() => { syncing.current = false; sync(); }, 15000); return;
          }
        }
      }
      setSyncMsg(""); setTrouble(false);
    } finally { syncing.current = false; }
  }, [inv, persist]);

  useEffect(() => { if (pending.length) sync(); }, [pending, sync]);

  // ---- once everything is on the server, open the result
  useEffect(() => {
    if (!finishing || pending.length || !inv) return;
    let stop = false;
    (async () => {
      try {
        const st = await apiRetry<{ next: Next }>("status", undefined, { onWait: (ms) => setSyncMsg(waitText(ms, "Checking")) });
        if (!stop) { localSet(LKEY, null); onDone(st.next); }
      } catch { if (!stop) setSyncMsg("We are having trouble reaching our server. The page keeps trying."); }
    })();
    return () => { stop = true; };
  }, [finishing, pending, inv, onDone]);

  const sec = useMemo(() => inv?.sections.find((s) => s.id === secId), [inv, secId]);
  const idx = inv ? inv.sections.findIndex((s) => s.id === secId) : 0;
  const complete = (l: Line) => { const x = r[l.id]; return !!(x && x.score && x.last_done); };
  const allDone = sec ? sec.lines.every(complete) : false;
  const answered = inv ? inv.sections.reduce((n, s) => n + s.lines.filter(complete).length, 0) : 0;
  const total = inv ? inv.sections.reduce((n, s) => n + s.lines.length, 0) : 1;

  const set = (id: string, patch: Rating) => {
    const n = { ...r, [id]: { ...(r[id] || {}), ...patch } };
    setR(n); persist(n, pendingRef.current);
    if (missing[id]) { const m = { ...missing }; delete m[id]; setMissing(m); }
  };
  const gap = (l: Line): string => {
    const x = r[l.id] || {};
    if (!x.score && !x.last_done) return "pick a number and when you last did it";
    if (!x.score) return "pick a number 1–5";
    if (!x.last_done) return "tick when you last did it";
    return "";
  };

  const save = () => {
    if (!sec || !inv) return;
    const gaps: Record<string, string> = {};
    for (const l of sec.lines) { const g = gap(l); if (g) gaps[l.id] = g; }
    if (Object.keys(gaps).length) {
      setMissing(gaps);
      const ids = Object.keys(gaps);
      setErr(`${ids.length} line${ids.length > 1 ? "s" : ""} not complete: ${ids.join(", ")}. Each one is marked below.`);
      document.getElementById(`line-${ids[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setMissing({}); setErr("");
    const pend = pendingRef.current.includes(sec.id) ? pendingRef.current : [...pendingRef.current, sec.id];
    setPending(pend); persist(r, pend);
    const next = inv.sections.slice(idx + 1).find((s) => s.lines.some((l) => !complete(l)) && !pend.includes(s.id))
      || inv.sections.find((s) => s.lines.some((l) => !complete(l)) && !pend.includes(s.id));
    if (next) { setSecId(next.id); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else setFinishing(true);
  };

  if (err && !inv) return <p className="text-sm text-muted-foreground">{err}</p>;
  if (!inv || !sec) return <p className="text-sm text-muted-foreground">{loadMsg}</p>;

  if (finishing) {
    return (
      <div className="space-y-3">
        <p className="text-base font-medium text-foreground">All {total} lines answered.</p>
        <p className="text-sm text-muted-foreground">{pending.length ? (syncMsg || `Sending your last ${pending.length} section${pending.length > 1 ? "s" : ""}…`) : (syncMsg || "Opening your result…")}</p>
        {trouble && <p className="rounded-md border border-input bg-muted/40 p-3 text-sm text-muted-foreground">Your answers are kept on this phone. Keep this page open; it keeps trying and opens your result as soon as our server answers.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Section {idx + 1} of {inv.sections.length}</span><span>{answered} of {total} answered</span>
        </div>
        <Progress value={(100 * answered) / total} className="h-2" />
        <p className="mt-1 text-right text-[11px] text-muted-foreground">
          {pending.length ? <span>{syncMsg || "Saving…"}</span> : <span className="text-green-700">✓ all answers saved</span>}
        </p>
      </div>
      {trouble && <p className="rounded-md border border-input bg-muted/40 p-3 text-sm text-muted-foreground">We are having trouble reaching our server. Your answers are kept on this phone — keep going; they will be sent when the connection is back.</p>}

      <details className="rounded-md border border-input bg-muted/40 p-3 text-sm" open={idx === 0}>
        <summary className="cursor-pointer font-medium">What the numbers mean</summary>
        <ul className="mt-2 space-y-1">
          {inv.scale.map((s) => <li key={s.score}><strong>{s.score} · {s.label}</strong> — {s.text}</li>)}
        </ul>
        <p className="mt-2 text-muted-foreground">Then tick when you last did it. Be honest — at the end you see your result, and it is checked on the trial day.</p>
        <p className="mt-1 text-muted-foreground">You can stop after any section and continue later — come back to this page and choose "Continue a saved evaluation".</p>
      </details>

      {inv.attempt && inv.attempt > 1 && idx === 0 && <p className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">Re-evaluation #{inv.attempt}. Your previous answer is shown beside each line; rate yourself as you are today.</p>}
      <h2 className="text-xl font-semibold text-foreground">{sec.id} · {sec.title}</h2>

      <ol className="space-y-4">
        {sec.lines.map((l) => {
          const x = r[l.id] || {};
          return (
            <li key={l.id} id={`line-${l.id}`} className={`rounded-lg border p-3 ${missing[l.id] ? "border-destructive bg-destructive/5" : complete(l) ? "border-input" : "border-primary/40"}`}>
              <p className="text-sm"><span className="mr-2 text-xs text-muted-foreground">{l.id}</span>Can you {l.text}?
                {l.advanced && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">advanced</span>}
                {inv.previous && inv.previous[l.id] !== undefined && <span className="ml-2 rounded border border-input px-1.5 py-0.5 text-[10px] text-muted-foreground">last time: {inv.previous[l.id]}</span>}</p>
              <div className="mt-2 grid grid-cols-5 gap-1.5">
                {inv.scale.map((s) => (
                  <button type="button" key={s.score} title={s.label} onClick={() => set(l.id, { score: s.score })}
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
            </li>
          );
        })}
      </ol>

      <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 p-4 backdrop-blur sm:mx-0 sm:rounded-md sm:border">
        {err && <p className="mb-2 text-sm font-medium text-destructive">{err}</p>}
        <Button size="lg" className="w-full" onClick={save}>
          {idx + 1 < inv.sections.length ? "Save and continue" : "Save and see my result"}
        </Button>
        {!allDone && !err && <p className="mt-2 text-center text-xs text-muted-foreground">{sec.lines.filter((l) => !complete(l)).length} of {sec.lines.length} lines still to answer</p>}
        <p className="mt-2 text-center text-xs text-muted-foreground">Every tap is kept on this phone. You can close this page and continue later with your phone number.</p>
      </div>
    </div>
  );
};

export default InventoryStep;
