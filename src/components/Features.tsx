import { Zap, Shield, Headphones, Settings, Eye, LayoutGrid } from "lucide-react";

const features = [
  { icon: Zap, title: "Fast Speeds", desc: "Blazing fibre and fixed wireless speeds for everything you do online." },
  { icon: Shield, title: "Reliable Uptime", desc: "Enterprise-grade infrastructure keeps you connected around the clock." },
  { icon: Headphones, title: "Local Support", desc: "Friendly, Awka-based support team ready to help when you need it." },
  { icon: Settings, title: "Easy Setup", desc: "Professional installation with minimal disruption to your space." },
  { icon: Eye, title: "No Hidden Fees", desc: "What you see is what you pay — transparent pricing, always." },
  { icon: LayoutGrid, title: "Flexible Plans", desc: "Choose a plan that fits your household or business perfectly." },
];

const Features = () => {
  return (
    <section id="features" className="relative px-4 py-20 md:px-8 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 -left-20 w-40 h-40 border-2 border-primary/10 rounded-full" />
      <div className="absolute top-1/2 -left-10 w-20 h-20 border-2 border-primary/10 rounded-full" />
      <div className="absolute -bottom-10 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute top-10 right-0 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
      {/* Dot grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
            Why Choose PHSWEB?
          </h2>
          <p className="text-muted-foreground">
            We're building Awka's most dependable broadband network.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
