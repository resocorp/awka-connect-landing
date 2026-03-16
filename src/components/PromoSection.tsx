import { Button } from "@/components/ui/button";
import { Users, Gift, Zap, ArrowRight, Clock } from "lucide-react";

const PromoSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-orange-500 to-orange-600 px-4 py-12 md:px-8 md:py-20 text-white">
      {/* Decorative blobs */}
      <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-black/10 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl" />

      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
        backgroundSize: '28px 28px'
      }} />

      <div className="relative mx-auto max-w-6xl">
        {/* Section label */}
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm">
            <Clock className="h-4 w-4" />
            Limited-Time Offers — Don't Miss Out
          </span>
        </div>

        <h2 className="mb-4 text-center text-3xl font-extrabold md:text-4xl lg:text-5xl">
          Connect Now & Save Big
        </h2>
        <p className="mb-14 text-center text-lg text-white/80 max-w-2xl mx-auto">
          Two irresistible reasons to get started with PHSWEB today.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Seasonal Promo Card */}
          <div className="relative flex flex-col rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-sm">
            <div className="absolute -top-4 left-8 rounded-full bg-yellow-400 px-4 py-1 text-xs font-extrabold text-yellow-900 uppercase tracking-wider shadow-lg">
              🔥 Seasonal Promo
            </div>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
              <Zap className="h-7 w-7 text-yellow-300" />
            </div>
            <h3 className="mb-2 text-2xl font-bold">50% Off Fiber Installation</h3>
            <p className="mb-6 text-white/80 flex-1">
              For a limited time, get connected on fibre at half the installation cost.
              That's a saving of over <strong className="text-yellow-300">₦52,500</strong> — right now.
            </p>
            <div className="mb-6 flex items-end gap-3">
              <span className="text-lg font-medium text-white/60 line-through">₦105,000</span>
              <span className="text-4xl font-extrabold text-yellow-300">₦52,500</span>
            </div>
            <Button
              size="lg"
              className="w-full bg-white text-primary font-bold hover:bg-white/90 gap-2"
              asChild
            >
              <a href="#contact">
                Claim This Deal <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Referral Card */}
          <div className="relative flex flex-col rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-sm">
            <div className="absolute -top-4 left-8 rounded-full bg-green-400 px-4 py-1 text-xs font-extrabold text-green-900 uppercase tracking-wider shadow-lg">
              🎁 Referral Reward
            </div>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
              <Users className="h-7 w-7 text-green-300" />
            </div>
            <h3 className="mb-2 text-2xl font-bold">Refer a Friend, Get 2 Weeks Free</h3>
            <p className="mb-6 text-white/80 flex-1">
              Know someone who needs fast internet? Refer them to PHSWEB and when they subscribe,{" "}
              <strong className="text-green-300">you both win</strong> — they get connected, you get
              2 weeks of free internet on your next bill.
            </p>
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm">
                <Gift className="h-5 w-5 shrink-0 text-green-300" />
                <span>You: <strong>2 weeks free</strong> added to your subscription</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm">
                <Zap className="h-5 w-5 shrink-0 text-yellow-300" />
                <span>Your friend: fast, reliable internet from day one</span>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full bg-white text-primary font-bold hover:bg-white/90 gap-2"
              asChild
            >
              <a href="https://wa.me/2349076824134" target="_blank" rel="noopener noreferrer">
                Refer via WhatsApp <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-white/60">
          Promo valid while offer lasts. Terms apply. Contact us for details.
        </p>
      </div>
    </section>
  );
};

export default PromoSection;
