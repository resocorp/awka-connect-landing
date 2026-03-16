import { UserPlus, ClipboardCheck, Wifi } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Sign Up",
    desc: "Fill out our quick form or chat with us on WhatsApp — it's completely free.",
  },
  {
    icon: ClipboardCheck,
    title: "Site Survey & Scheduling",
    desc: "Our team visits your location, assesses coverage, and schedules installation at your convenience.",
  },
  {
    icon: Wifi,
    title: "Get Connected",
    desc: "We install your equipment and get you online — fast, reliable internet from day one.",
  },
];

const HowItWorks = () => {
  return (
    <section className="relative bg-muted/50 px-4 py-12 md:px-8 md:py-20 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-24 h-24 border-2 border-primary/10 rounded-lg rotate-45" />
      <div className="absolute top-20 left-10 w-16 h-16 border-2 border-primary/8 rounded-lg rotate-12" />
      {/* Connecting line behind steps */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-2/3 max-w-xl h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent hidden md:block" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-8 text-center md:mb-12">
          <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
            How It Works
          </h2>
          <p className="text-muted-foreground">
            Three simple steps to get connected.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 md:gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="flex flex-col items-center text-center">
              <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <s.icon className="h-7 w-7" />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                  {i + 1}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Installation fees: Fiber{" "}
          <span className="line-through">₦105,000</span>{" "}
          <strong className="text-orange-600">₦52,500 🔥 50% OFF</strong>{" "}
          · Fixed Wireless from <strong>₦200,000</strong>
          <br />
          (assessed after site survey · limited-time promo)
        </p>
      </div>
    </section>
  );
};

export default HowItWorks;
