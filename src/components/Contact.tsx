import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, Phone, MapPin, Mail, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPublicPlans } from "@/lib/api";

interface Plan {
  id: string;
  name: string;
  price: number;
}

const FALLBACK_PLANS: Plan[] = [
  { id: "home", name: "Home Plan", price: 25000 },
  { id: "power", name: "Power Plan", price: 40000 },
  { id: "enterprise", name: "Enterprise", price: 70000 },
];

const Contact = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    plan: "", 
    address: "",
    gpsLat: "",
    gpsLong: "",
    _gotcha: ""
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [humanChecked, setHumanChecked] = useState(false);

  useEffect(() => {
    getPublicPlans()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPlans(data);
          setForm((f) => ({ ...f, plan: f.plan || data[0].name }));
        } else {
          setPlans(FALLBACK_PLANS);
          setForm((f) => ({ ...f, plan: f.plan || FALLBACK_PLANS[0].name }));
        }
      })
      .catch(() => {
        setPlans(FALLBACK_PLANS);
        setForm((f) => ({ ...f, plan: f.plan || FALLBACK_PLANS[0].name }));
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!humanChecked) {
      toast({
        title: "Please confirm you're human",
        description: "Tick the checkbox before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          plan: form.plan,
          address: form.address,
          gpsLat: form.gpsLat || null,
          gpsLong: form.gpsLong || null,
          _gotcha: form._gotcha
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Request received!",
          description: "We'll reach out to you shortly. Thank you!",
        });
        setForm({ name: "", email: "", phone: "", plan: plans[0]?.name || "", address: "", gpsLat: "", gpsLong: "", _gotcha: "" });
        setHumanChecked(false);
      } else if (response.status === 409) {
        toast({
          title: "Already submitted",
          description: data.message || "We already have your request on file. Our team will be in touch soon.",
          variant: "destructive"
        });
      } else {
        throw new Error(data.error || 'Failed to submit');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again or contact us directly.",
        variant: "destructive"
      });
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive"
      });
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm({
          ...form,
          gpsLat: position.coords.latitude.toString(),
          gpsLong: position.coords.longitude.toString()
        });
        toast({
          title: "Location captured!",
          description: `Lat: ${position.coords.latitude.toFixed(6)}, Long: ${position.coords.longitude.toFixed(6)}`
        });
        setGpsLoading(false);
      },
      (error) => {
        toast({
          title: "Location access denied",
          description: "Please enable location access in your browser settings.",
          variant: "destructive"
        });
        setGpsLoading(false);
      }
    );
  };

  return (
    <section id="contact" className="relative bg-muted/50 px-4 py-12 md:px-8 md:py-20 overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/20 rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
        backgroundSize: '28px 28px'
      }} />
      {/* Wifi signal rings */}
      <div className="absolute top-20 right-20 hidden lg:block">
        <div className="w-16 h-16 border-2 border-primary/10 rounded-full" />
        <div className="absolute top-2 left-2 w-12 h-12 border-2 border-primary/8 rounded-full" />
        <div className="absolute top-4 left-4 w-8 h-8 border-2 border-primary/5 rounded-full" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Heading — always on top */}
        <div className="mb-8 md:mb-12">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Get Connected Today
          </h2>
          <p className="text-muted-foreground">
            Ready to enjoy fast, reliable internet? Fill out the form or reach us directly.
          </p>
        </div>

        <div className="grid gap-8 md:gap-12 md:grid-cols-2">
        {/* Contact details — below form on mobile, left on desktop */}
        <div className="order-2 md:order-1">
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <Phone className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Call Us</p>
                <p className="text-sm text-muted-foreground">02014101240</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">WhatsApp</p>
                <a
                  href="https://wa.me/2349076824134"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline underline-offset-4"
                >
                  0907 682 4134
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Email Support</p>
                <a
                  href="mailto:support@phsweb.ng"
                  className="text-sm text-primary underline underline-offset-4"
                >
                  support@phsweb.ng
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Office Location</p>
                <p className="text-sm text-muted-foreground">
                  2nd floor, Grace And Faith House, Onitsha - Enugu Expy, Awka 420212, Anambra
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form — show first on mobile, right on desktop */}
        <form
          onSubmit={handleSubmit}
          className="order-1 md:order-2 rounded-xl border border-border bg-card p-6 shadow-sm md:p-8"
        >
          <div className="mb-6 space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+234..."
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="plan">Select Plan</Label>
              <select
                id="plan"
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {plans.length === 0 ? (
                  <option value="">Loading plans...</option>
                ) : (
                  plans.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}{p.price ? ` — ₦${Number(p.price).toLocaleString()}/mo` : ""}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Your installation address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="gps">GPS Location (Optional)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleGetLocation}
                  disabled={gpsLoading}
                >
                  <Navigation className="h-4 w-4" />
                  {gpsLoading ? "Getting location..." : form.gpsLat ? "Location captured ✓" : "Share GPS Location"}
                </Button>
              </div>
              {form.gpsLat && form.gpsLong && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Lat: {parseFloat(form.gpsLat).toFixed(6)}, Long: {parseFloat(form.gpsLong).toFixed(6)}
                </p>
              )}
            </div>
          </div>
          {/* Honeypot — hidden from humans, bots fill it in */}
          <input
            type="text"
            name="_gotcha"
            value={form._gotcha}
            onChange={(e) => setForm({ ...form, _gotcha: e.target.value })}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={humanChecked}
              onChange={(e) => setHumanChecked(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <span className="text-sm text-muted-foreground">I confirm I am a human</span>
          </label>

          <Button type="submit" className="w-full" size="lg" disabled={!humanChecked}>
            Sign Up — It's Free
          </Button>
          <div className="mt-3 text-center text-xs text-muted-foreground">
            <p className="mb-1">Free sign-up. Installation fee assessed after site survey.</p>
            <p className="font-medium">
              <span className="line-through">Fiber ₦200,000</span>{" "}
              <span className="text-orange-600 font-bold">₦140,000 🔥 30% OFF</span>
              <span className="mx-1">·</span>
              Fixed Wireless from ₦200,000
            </p>
            <p className="text-[10px] mt-0.5">(assessed after site survey · limited-time promo)</p>
          </div>
        </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
