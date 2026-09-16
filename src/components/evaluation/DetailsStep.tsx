import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError, loadDraft, saveDraft, setPhone } from "@/lib/evaluation";
import { getAttribution } from "@/lib/attribution";

export interface Details {
  name: string; phone: string; lga: string; distance: string; height: string; android: string;
  education: string; education_field: string; experience: string; employers: string; tools: string[];
  licence: string; availability: string; pay_expect: string; how_heard: string; how_heard_detail: string;
  fault_story: string; email: string; has_id: string; staff_code: string; consent: boolean; _gotcha: string;
}

const EMPTY: Details = {
  name: "", phone: "", lga: "", distance: "", height: "", android: "", education: "", education_field: "",
  experience: "", employers: "", tools: [], licence: "", availability: "", pay_expect: "", how_heard: "",
  how_heard_detail: "", fault_story: "", email: "", has_id: "", staff_code: "", consent: false, _gotcha: "",
};

const TOOLS = [
  ["crimper", "RJ45 crimper"], ["tester", "Cable tester"], ["drill", "Drill"], ["ladder", "Ladder"],
  ["meter", "Optical power meter"], ["splicer", "Fusion splicer"], ["vfl", "Visual fault locator"], ["multimeter", "Multimeter"],
];

const selectCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Sel({ id, label, value, onChange, options, required = true }: {
  id: string; label: string; value: string; onChange: (v: string) => void; options: [string, string][]; required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={selectCls} value={value} onChange={(e) => onChange(e.target.value)} required={required}>
        <option value="">Choose…</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

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
      setErr(ex instanceof ApiError ? ex.message : "Network problem — please try again.");
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
          <Label htmlFor="phone">Phone number <span className="text-muted-foreground">(skip the first 0)</span></Label>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-input bg-muted px-3 py-2 text-sm">+234</span>
            <Input id="phone" inputMode="numeric" placeholder="8031234567" value={f.phone}
              onChange={(e) => set("phone", e.target.value.replace(/[^0-9]/g, "").slice(0, 11))} required autoComplete="tel-national" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">We send a one-time code to this number by SMS and WhatsApp.</p>
        </div>
        <div>
          <Label htmlFor="email">Email <span className="text-muted-foreground">(optional)</span></Label>
          <Input id="email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="lga">Town / area where you live</Label>
          <Input id="lga" value={f.lga} onChange={(e) => set("lga", e.target.value)} required maxLength={80} placeholder="e.g. Okpuno, Awka South" />
        </div>
        <Sel id="distance" label="How far from Awka?" value={f.distance} onChange={(v) => set("distance", v)} options={[
          ["in_awka", "I live in Awka"], ["lt20km", "Under 20 km away"], ["lt40km", "20–40 km away"],
          ["relocate", "Further, but I will relocate"], ["no", "Further, and I cannot relocate"]]} />
        <Sel id="height" label="Can you work at height (ladders, poles, roofs)?" value={f.height} onChange={(v) => set("height", v)} options={[["yes", "Yes"], ["no", "No"]]} />
        <Sel id="android" label="Your Android phone" value={f.android} onChange={(v) => set("android", v)} options={[
          ["14+", "Android 14 or newer"], ["13", "Android 13"], ["12", "Android 12"], ["11", "Android 11"], ["10", "Android 10"],
          ["old", "Older than Android 10"], ["none", "I do not have an Android smartphone"]]} />
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
        <div className="sm:col-span-2">
          <Label>Tools you own</Label>
          <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TOOLS.map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm">
                <input type="checkbox" checked={f.tools.includes(v)} onChange={(e) => set("tools", e.target.checked ? [...f.tools, v] : f.tools.filter((t) => t !== v))} />
                {l}
              </label>
            ))}
          </div>
        </div>
        <Sel id="licence" label="Licence" value={f.licence} onChange={(v) => set("licence", v)} options={[
          ["none", "None"], ["bike", "Motorcycle"], ["car", "Car"], ["both", "Both"]]} />
        <Sel id="availability" label="When can you start?" value={f.availability} onChange={(v) => set("availability", v)} options={[
          ["immediate", "Immediately"], ["2_weeks", "Within 2 weeks"], ["1_month", "Within a month"], ["later", "Later"]]} />
        <div>
          <Label htmlFor="pay">Expected monthly pay</Label>
          <Input id="pay" value={f.pay_expect} onChange={(e) => set("pay_expect", e.target.value)} maxLength={60} placeholder="₦" />
        </div>
        <Sel id="has_id" label="Do you have a valid means of ID?" value={f.has_id} onChange={(v) => set("has_id", v)} options={[["yes", "Yes"], ["no", "No"]]} />
        <Sel id="how_heard" label="How did you hear about this?" value={f.how_heard} onChange={(v) => set("how_heard", v)} options={[
          ["staff_referral", "A PHSWEB staff member"], ["customer", "A PHSWEB customer"], ["website", "The website"],
          ["social", "Social media"], ["job_board", "A job board"], ["other", "Other"]]} />
        <div>
          <Label htmlFor="hhd">Who / where? <span className="text-muted-foreground">(optional)</span></Label>
          <Input id="hhd" value={f.how_heard_detail} onChange={(e) => set("how_heard_detail", e.target.value)} maxLength={120} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="story">Tell us about one fault you fixed and how you found the cause</Label>
          <Textarea id="story" value={f.fault_story} onChange={(e) => set("fault_story", e.target.value.slice(0, 600))} rows={4}
            placeholder="Any kind of fault — electrical, network, a bike, a generator. What did you check first, and why?" />
          <p className="mt-1 text-xs text-muted-foreground">{f.fault_story.length}/600</p>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="staff">Staff code <span className="text-muted-foreground">(current PHSWEB staff only — leave blank otherwise)</span></Label>
          <Input id="staff" value={f.staff_code} onChange={(e) => set("staff_code", e.target.value.toUpperCase())} maxLength={12} className="max-w-xs" />
        </div>
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
