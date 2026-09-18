import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, loadDraft, saveDraft, setPhone } from "@/lib/evaluation";
import { getAttribution } from "@/lib/attribution";
import careers from "@/data/careers.json";

export interface Details {
  name: string; phone: string; email: string; area: string; area_other: string; height: string;
  sundays: string; commitment: string; education: string; education_field: string; experience: string;
  employers: string; availability: string; consent: boolean; _gotcha: string;
}

const EMPTY: Details = {
  name: "", phone: "", email: "", area: "", area_other: "", height: "", sundays: "", commitment: "",
  education: "", education_field: "", experience: "", employers: "", availability: "", consent: false, _gotcha: "",
};

const selectCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Sel({ id, label, value, onChange, options, required = true, hint }: {
  id: string; label: string; value: string; onChange: (v: string) => void; options: [string, string][]; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {hint && <p className="mb-1 text-xs text-muted-foreground">{hint}</p>}
      <select id={id} className={selectCls} value={value} onChange={(e) => onChange(e.target.value)} required={required}>
        <option value="">Choose…</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

const AREAS: [string, string][] = [
  ...careers.role.areas.map((a) => [a.id, a.label] as [string, string]),
  ["other", "Other area in Awka"],
  ["outside", "I do not live in Awka"],
];

const DetailsStep = ({ onSent }: { onSent: (masked: string, channels: Record<string, boolean>) => void }) => {
  const [f, setF] = useState<Details>(() => ({ ...EMPTY, ...(loadDraft<Partial<Details>>() ?? {}) }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof Details, v: unknown) => { const n = { ...f, [k]: v }; setF(n); saveDraft({ ...n, consent: false }); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!f.consent) { setErr("Please tick the consent box."); return; }
    setBusy(true);
    try {
      const r = await api<{ ok: boolean; otp_sent: boolean; masked_phone: string; channels: Record<string, boolean>; error?: string }>(
        "start", { phone: f.phone, details: f, _gotcha: f._gotcha, attribution: getAttribution() });
      setPhone(f.phone);
      if (!r.otp_sent) { setErr(r.error || "We could not send the code. Check the number and try again."); return; }
      onSent(r.masked_phone, r.channels || {});
    } catch (ex) {
      setErr(ex instanceof ApiError && !ex.transient ? ex.message : "We could not reach our server just now — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={f.name} onChange={(e) => set("name", e.target.value)} required maxLength={80} autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" inputMode="tel" placeholder="0803 123 4567" value={f.phone}
            onChange={(e) => set("phone", e.target.value.replace(/[^0-9+ ]/g, "").slice(0, 16))} required autoComplete="tel" />
        </div>
        <div>
          <Label htmlFor="email">Email <span className="text-muted-foreground">(optional)</span></Label>
          <Input id="email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
        </div>
        <Sel id="area" label="Where in Awka do you stay?" value={f.area} onChange={(v) => set("area", v)} options={AREAS} />
        {f.area === "other" ? (
          <div>
            <Label htmlFor="area_other">Which area?</Label>
            <Input id="area_other" value={f.area_other} onChange={(e) => set("area_other", e.target.value)} required maxLength={80} />
          </div>
        ) : <div className="hidden sm:block" />}
        <Sel id="height" label="Can you work at height (ladders, poles, roofs)?" value={f.height} onChange={(v) => set("height", v)} options={[["yes", "Yes"], ["no", "No"]]} />
        <Sel id="sundays" label="Can you commit to working on Sundays?" value={f.sundays} onChange={(v) => set("sundays", v)}
          hint="Field work runs six days a week including Sundays, with urgent call-outs."
          options={[["every", "Yes, every Sunday"], ["some", "Some Sundays"], ["no", "No"]]} />
        <Sel id="commitment" label="Do you have a regular weekly commitment that would take you away from work during working hours?" value={f.commitment} onChange={(v) => set("commitment", v)}
          options={[["no", "No"], ["occasional", "Yes, occasionally"], ["weekly", "Yes, every week"]]} />
        <Sel id="education" label="Highest education" value={f.education} onChange={(v) => set("education", v)} options={[
          ["ssce", "SSCE / WAEC"], ["trade", "Trade / technical training"], ["ond", "OND"], ["hnd", "HND"], ["bsc", "BSc"], ["other", "Other"]]} />
        <div>
          <Label htmlFor="edf">Field of study / training</Label>
          <Input id="edf" value={f.education_field} onChange={(e) => set("education_field", e.target.value)} maxLength={80} placeholder="e.g. Electrical, Telecoms" />
        </div>
        <Sel id="experience" label="Years of field or technical work" value={f.experience} onChange={(v) => set("experience", v)} options={[
          ["0", "None yet"], ["lt1", "Under 1 year"], ["1-2", "1–2 years"], ["3-5", "3–5 years"], ["5+", "More than 5 years"]]} />
        <div>
          <Label htmlFor="emp">Last two employers <span className="text-muted-foreground">(or "none")</span></Label>
          <Input id="emp" value={f.employers} onChange={(e) => set("employers", e.target.value)} maxLength={300} />
        </div>
        <Sel id="availability" label="When can you start?" value={f.availability} onChange={(v) => set("availability", v)} options={[
          ["immediate", "Immediately"], ["2_weeks", "Within 2 weeks"], ["1_month", "Within a month"], ["later", "Later"]]} />
      </div>

      {/* Honeypot — hidden from people, filled by bots */}
      <div className="hidden" aria-hidden="true">
        <label>Leave this empty<input tabIndex={-1} autoComplete="off" value={f._gotcha} onChange={(e) => set("_gotcha", e.target.value)} /></label>
      </div>

      <label className="flex items-start gap-3 rounded-md border border-input p-3 text-sm">
        <input type="checkbox" className="mt-1" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
        <span>I agree that PHSWEB stores these details and my evaluation results to consider me for work, and contacts me by SMS,
          WhatsApp or phone about it. Details of people not hired are removed after six months.</span>
      </label>

      {err && <p className="text-sm text-destructive">{err}</p>}
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={busy}>{busy ? "Sending your code…" : "Continue — send my code"}</Button>
    </form>
  );
};

export default DetailsStep;
