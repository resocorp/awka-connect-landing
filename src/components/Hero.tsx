import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Wifi } from "lucide-react";
import heroFamily from "@/assets/hero-family.jpg";
import heroWorkers from "@/assets/hero-workers.jpg";
import heroStudents from "@/assets/hero-students.jpg";

const slides = [
  { src: heroFamily, alt: "Happy family browsing the internet together" },
  { src: heroWorkers, alt: "Professionals collaborating in a workspace" },
  { src: heroStudents, alt: "Students studying together on campus" },
];

const Hero = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[520px] overflow-hidden md:min-h-[700px]">
      {/* Background slides */}
      {slides.map((slide, i) => (
        <div
          key={slide.alt}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img
            src={slide.src}
            alt={slide.alt}
            className="h-full w-full object-cover object-center"
          />
        </div>
      ))}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[520px] items-center px-4 py-10 md:min-h-[700px] md:px-8 md:py-0">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-xl">
            {/* Badges */}
            <div className="mb-4 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm md:px-4 md:py-1.5 md:text-sm">
                <Wifi className="h-3.5 w-3.5 md:h-4 md:w-4" />
                Fiber & Fixed Wireless
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/85 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm md:px-4 md:py-1.5 md:text-sm">
                🔥 50% OFF Installation — Limited Time
              </div>
            </div>

            <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              Fast, Reliable Internet in{" "}
              <span className="text-primary">Awka</span>
            </h1>

            <p className="mb-5 text-base text-white/85 md:text-xl">
              Broadband you can count on — fibre and fixed wireless connectivity
              for homes and businesses. <strong>Free sign-up.</strong>
            </p>

            {/* Promo chips */}
            <div className="mb-7 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white border border-white/20 backdrop-blur-sm md:text-sm">
                🔥 Fiber: <span className="line-through opacity-60 ml-1">₦105,000</span>&nbsp;<strong className="text-yellow-300">₦52,500</strong>
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white border border-white/20 backdrop-blur-sm md:text-sm">
                🎁 Refer a friend →&nbsp;<strong className="text-green-300">2 weeks free</strong>
              </span>
            </div>

            {/* CTAs — hidden on mobile (StickyMobileCTA handles it), visible md+ */}
            <div className="hidden md:flex gap-3">
              <Button size="lg" asChild>
                <a href="#contact">Get Started — Free Sign-Up</a>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 border-white/30 bg-white text-foreground hover:bg-white/90" asChild>
                <a
                  href="https://wa.me/2349076824134"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-5 w-5" />
                  Chat on WhatsApp
                </a>
              </Button>
            </div>

            {/* Mobile CTA hint */}
            <p className="md:hidden text-xs text-white/60 mt-1">Tap the bar below to get started for free ↓</p>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? "w-8 bg-white" : "w-2 bg-white/50"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
