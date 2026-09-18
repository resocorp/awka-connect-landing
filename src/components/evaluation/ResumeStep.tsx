import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, setPhone } from "@/lib/evaluation";

const ResumeStep = ({ onSent, onBack }: { onSent: (masked: string, channels: Record<string, boolean>) => void; onBack: () => void }) => {
  const [phone, setPh] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const r = await api<{ masked_phone: string; channels: Record<string, boolean> }>("resume", { phone });
      setPhone(phone);
      onSent(r.masked_phone, r.channels || {});
    } catch (ex) {
      setErr(ex instanceof ApiError && !ex.transient ? ex.message : "We could not reach our server just now — please try again.");
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-sm text-muted-foreground">Enter the phone number you used. We will send a new code and take you back to where you stopped.</p>
      <div className="max-w-xs">
        <Label htmlFor="rphone">Phone number</Label>
        <Input id="rphone" inputMode="tel" placeholder="0803 123 4567" value={phone} onChange={(e) => setPh(e.target.value)} required autoFocus autoComplete="tel" />
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Sending…" : "Send my code"}</Button>
        <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
      </div>
    </form>
  );
};

export default ResumeStep;
