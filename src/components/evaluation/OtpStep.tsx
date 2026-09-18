import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, getPhone, setSession, type Next } from "@/lib/evaluation";

const OtpStep = ({ masked, channels, onVerified, onBack }: {
  masked: string; channels: Record<string, boolean>;
  onVerified: (next: Next, name: string, message?: string) => void;
  onBack?: () => void;
}) => {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [wait, setWait] = useState(60);
  const [resends, setResends] = useState(0);
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const r = await api<{ session: string; next: Next; name: string; message?: string }>("otp/verify", { phone: getPhone(), code });
      setSession(r.session);
      onVerified(r.next, r.name, r.message);
    } catch (ex) {
      setErr(ex instanceof ApiError && !ex.transient ? ex.message : "We could not reach our server just now — please try again.");
    } finally { setBusy(false); }
  };

  const resend = async (channel?: "wa") => {
    setErr(""); setInfo("");
    try {
      const r = await api<{ channels: Record<string, boolean> }>("otp/resend", { phone: getPhone(), channel });
      setResends(resends + 1); setWait(60);
      const sent = Object.entries(r.channels || {}).filter(([, ok]) => ok).map(([k]) => (k === "wa" ? "WhatsApp" : "SMS"));
      setInfo(sent.length ? `A new code is on its way by ${sent.join(" and ")}.` : "We could not send a new code — try again in a minute.");
    } catch (ex) {
      setErr(ex instanceof ApiError && !ex.transient ? ex.message : "We could not reach our server just now — please try again.");
    }
  };

  const via = Object.entries(channels).filter(([, ok]) => ok).map(([k]) => (k === "wa" ? "WhatsApp" : "SMS"));

  return (
    <form onSubmit={verify} className="space-y-5">
      <p className="text-sm text-muted-foreground">
        We sent a 6-digit code to <strong className="text-foreground">{masked}</strong>{via.length ? ` by ${via.join(" and ")}` : ""}. It expires in 10 minutes.
      </p>
      <div className="max-w-xs">
        <Label htmlFor="code">Your code</Label>
        <Input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))} className="text-center text-2xl tracking-[0.5em]" required autoFocus />
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      {info && <p className="text-sm text-muted-foreground">{info}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={busy || code.length !== 6}>{busy ? "Checking…" : "Verify"}</Button>
        <Button type="button" variant="outline" disabled={wait > 0 || resends >= 3} onClick={() => resend()}>
          {wait > 0 ? `Resend in ${wait}s` : "Resend code"}
        </Button>
        {resends >= 1 && wait <= 0 && resends < 3 && (
          <Button type="button" variant="ghost" onClick={() => resend("wa")}>Resend by WhatsApp only</Button>
        )}
      </div>
      {onBack && <button type="button" className="text-xs text-muted-foreground underline" onClick={onBack}>Wrong number? Start again</button>}
    </form>
  );
};

export default OtpStep;
