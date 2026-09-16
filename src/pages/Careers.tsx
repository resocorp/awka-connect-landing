import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ClipboardList, PhoneCall, Wrench, FileSignature, ListChecks, Timer } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import careers from "@/data/careers.json";

const ICONS = [ClipboardList, ListChecks, Timer, PhoneCall, Wrench, FileSignature];

const Careers = () => {
  useEffect(() => { document.title = `${careers.role.title} · Careers · PHSWEB`; }, []);
  const r = careers.role;
  const hasPay = r.levels.some((l) => l.pay_band);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="px-4 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Careers at {r.company}</p>
          <h1 className="mb-3 text-3xl font-bold text-foreground md:text-5xl">{r.title}</h1>
          <p className="mb-2 text-sm text-muted-foreground">{r.location}</p>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">{r.summary}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" asChild><Link to="/evaluation">Start your evaluation</Link></Button>
            <Button size="lg" variant="outline" asChild><a href="#how">How it works</a></Button>
          </div>
        </div>
      </section>

      <section className="bg-muted/50 px-4 py-10 md:px-8 md:py-14">
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-xl font-semibold text-foreground">You need</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {r.must_haves.map((m) => <li key={m} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{m}</li>)}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Good to have</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {r.nice_to_haves.map((m) => <li key={m} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />{m}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Three levels, one evaluation</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {r.levels.map((l) => (
              <div key={l.name} className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-1 font-semibold text-foreground">{l.name}</h3>
                <p className="text-sm text-muted-foreground">{l.who}</p>
                {l.pay_band && <p className="mt-2 text-sm font-medium text-foreground">{l.pay_band}</p>}
              </div>
            ))}
          </div>
          {(r.hours || r.probation || !hasPay) && (
            <p className="mt-4 text-sm text-muted-foreground">
              {r.hours && <>{r.hours}. </>}{r.probation && <>Probation: {r.probation}. </>}
              {!hasPay && <>Pay is discussed at the offer stage and depends on the level you are evaluated for.</>}
            </p>
          )}
          {r.what_you_get?.length > 0 && (
            <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {r.what_you_get.map((w) => <li key={w} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{w}</li>)}
            </ul>
          )}
        </div>
      </section>

      <section id="how" className="bg-muted/50 px-4 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-xl font-semibold text-foreground">How it works</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Everyone goes through the same evaluation, whether you have ten years in fibre or none: {careers.inventory.lines} short
            "Can you…" questions rated 1 to 5, then a {careers.test.minutes}-minute online test. Being new is fine — the test measures how you
            think as much as what you know, and the Trainee level exists for exactly that.
          </p>
          <ol className="grid gap-4 md:grid-cols-2">
            {careers.process.map((p, i) => { const Icon = ICONS[i % ICONS.length]; return (
              <li key={p.step} className="flex gap-3 rounded-lg border border-border bg-card p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Icon className="h-4 w-4" /></div>
                <div><h3 className="font-semibold text-foreground">{i + 1}. {p.step}</h3><p className="text-sm text-muted-foreground">{p.text}</p></div>
              </li>
            ); })}
          </ol>
          <div className="mt-6 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">The 1 to 5 scale you will use</p>
            <ul className="space-y-0.5">{careers.inventory.scale.map((s) => <li key={s.score}><strong>{s.score}</strong> — {s.text}</li>)}</ul>
          </div>
          <div className="mt-6"><Button size="lg" asChild><Link to="/evaluation">Start your evaluation</Link></Button></div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Careers;
