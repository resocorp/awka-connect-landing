import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Chinedu O.",
    location: "Awka",
    text: "PHSWEB transformed how I work from home. The connection is rock solid and their support team is amazing.",
  },
  {
    name: "Adaeze N.",
    location: "Awka South",
    text: "Finally, internet that actually works! Streaming, video calls — everything runs smoothly now.",
  },
  {
    name: "Emeka K.",
    location: "Amawbia",
    text: "As a business owner, uptime is everything. PHSWEB delivers consistently. Highly recommended.",
  },
];

const Testimonials = () => {
  return (
    <section className="px-4 py-20 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
            What Our Customers Say
          </h2>
          <p className="text-muted-foreground">
            Don't take our word for it — hear from our subscribers.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-3 flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-4 text-sm text-card-foreground">"{t.text}"</p>
              <div className="text-sm font-medium text-foreground">
                {t.name}
                <span className="ml-1 text-muted-foreground">— {t.location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
