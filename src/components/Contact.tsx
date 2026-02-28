import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, Phone, MapPin, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", plan: "home" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Request received!",
      description: "We'll reach out to you shortly. Thank you!",
    });
    setForm({ name: "", email: "", phone: "", plan: "home" });
  };

  return (
    <section id="contact" className="relative bg-muted/50 px-4 py-20 md:px-8 overflow-hidden">
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

      <div className="relative mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
        {/* Info */}
        <div>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Get Connected Today
          </h2>
          <p className="mb-8 text-muted-foreground">
            Ready to enjoy fast, reliable internet? Fill out the form or reach us directly.
          </p>

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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8"
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
                <option value="home">Home Plan — ₦25,000/mo</option>
                <option value="power">Power Plan — ₦40,000/mo</option>
              </select>
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg">
            Sign Up — It's Free
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Free sign-up. Installation fee assessed after site survey.
          </p>
        </form>
      </div>
    </section>
  );
};

export default Contact;
