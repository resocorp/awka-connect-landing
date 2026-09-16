import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DetailsStep from "@/components/evaluation/DetailsStep";
import OtpStep from "@/components/evaluation/OtpStep";
import InventoryStep from "@/components/evaluation/InventoryStep";
import TestStep from "@/components/evaluation/TestStep";
import { api, getSession, setSession, type Next } from "@/lib/evaluation";
import careers from "@/data/careers.json";

type Step = "details" | "otp" | "inventory" | "test" | "done" | "screened_out" | "closed";
const STEPS: { id: Step; label: string }[] = [
  { id: "details", label: "Your details" }, { id: "otp", label: "Confirm phone" },
  { id: "inventory", label: "Skills inventory" }, { id: "test", label: "Test" }, { id: "done", label: "Done" },
];

const Evaluation = () => {
  const [step, setStep] = useState<Step>("details");
  const [masked, setMasked] = useState("");
  const [channels, setChannels] = useState<Record<string, boolean>>({});
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(!!getSession());

  useEffect(() => {
    document.title = "Field technician evaluation · PHSWEB";
    if (!getSession()) return;
    api<{ next: Next; name: string }>("status")
      .then((r) => { setName(r.name); setStep(r.next === "done" ? "done" : r.next); })
      .catch(() => setSession(""))
      .finally(() => setChecking(false));
  }, []);

  const onNext = (n: Next) => setStep(n === "done" ? "done" : n);
  const stepIdx = Math.max(0, STEPS.findIndex((s) => s.id === (step === "screened_out" || step === "closed" ? "done" : step)));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">PHSWEB · {careers.role.title}</p>
        <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">Evaluation</h1>
        <ol className="mb-6 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {STEPS.map((s, i) => (
            <li key={s.id} className={i === stepIdx ? "font-semibold text-foreground" : i < stepIdx ? "text-primary" : ""}>{i + 1}. {s.label}</li>
          ))}
        </ol>

        {checking ? (
          <p className="text-sm text-muted-foreground">One moment…</p>
        ) : step === "details" ? (
          <>
            <p className="mb-5 text-sm text-muted-foreground">
              Takes about an hour in total: your details, a one-time code to your phone, the skills inventory ({careers.inventory.minutes} minutes),
              then a {careers.test.minutes}-minute test. Find a quiet place and a good connection before you start the test.
              Read about the job first on the <Link to="/careers" className="text-primary underline">careers page</Link>.
            </p>
            <DetailsStep onSent={(m, c) => { setMasked(m); setChannels(c); setStep("otp"); window.scrollTo(0, 0); }} />
          </>
        ) : step === "otp" ? (
          <OtpStep masked={masked} channels={channels} onVerified={(n, nm, msg) => { setName(nm); setMessage(msg || ""); onNext(n); window.scrollTo(0, 0); }} />
        ) : step === "inventory" ? (
          <InventoryStep onDone={(n) => { onNext(n); window.scrollTo(0, 0); }} />
        ) : step === "test" ? (
          <TestStep onDone={(n) => { onNext(n); window.scrollTo(0, 0); }} />
        ) : step === "screened_out" ? (
          <div className="space-y-3 text-sm">
            <p className="text-base font-medium text-foreground">Thank you{name ? `, ${name.split(" ")[0]}` : ""}.</p>
            <p className="text-muted-foreground">{message || "We cannot take this evaluation further right now."}</p>
            <p className="text-muted-foreground">We keep your details in case that changes. You can reach us on WhatsApp at {careers.contact.phone}.</p>
          </div>
        ) : step === "closed" ? (
          <p className="text-sm text-muted-foreground">This evaluation is closed. If you think that is a mistake, message us on WhatsApp at {careers.contact.phone}.</p>
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-base font-medium text-foreground">Thank you{name ? `, ${name.split(" ")[0]}` : ""} — your evaluation is complete.</p>
            <p className="text-muted-foreground">Our team will review it and contact you by phone or WhatsApp about the next step. We do not send scores.</p>
            <p className="text-muted-foreground">Questions? WhatsApp {careers.contact.phone} or email {careers.contact.email}.</p>
            <Link to="/" className="inline-block text-primary underline">Back to phsweb.ng</Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Evaluation;
