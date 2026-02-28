import { MapPin } from "lucide-react";

const Coverage = () => {
  return (
    <section className="relative bg-muted/50 px-4 py-20 md:px-8 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
        backgroundSize: '32px 32px'
      }} />
      <div className="absolute top-1/2 left-0 w-48 h-48 bg-primary/5 rounded-full -translate-x-1/2 blur-3xl" />
      <div className="absolute top-1/2 right-0 w-48 h-48 bg-primary/5 rounded-full translate-x-1/2 blur-3xl" />
      {/* Map pin decorations */}
      <div className="absolute top-12 right-1/4 text-primary/10">
        <MapPin className="h-8 w-8" />
      </div>
      <div className="absolute bottom-12 left-1/3 text-primary/10">
        <MapPin className="h-6 w-6" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
          <MapPin className="h-4 w-4" />
          Coverage Area
        </div>
        <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
          Serving Awka & Surroundings
        </h2>
        <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
          PHSWEB currently provides fibre and fixed wireless broadband coverage
          across <strong>Awka</strong>, <strong>Amawbia</strong>,{" "}
          <strong>Okpuno</strong>, and surrounding areas in Anambra State. We're
          expanding rapidly — if you're nearby, reach out to check availability.
        </p>
        <p className="text-sm text-muted-foreground">
          Not sure if we cover your area?{" "}
          <a href="#contact" className="font-medium text-primary underline underline-offset-4">
            Contact us to find out →
          </a>
        </p>
      </div>
    </section>
  );
};

export default Coverage;
