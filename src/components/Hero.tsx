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
    <section className="relative min-h-[600px] overflow-hidden md:min-h-[700px]">
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
            className="h-full w-full object-cover"
          />
        </div>
      ))}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[600px] items-center px-4 md:min-h-[700px] md:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              <Wifi className="h-4 w-4" />
              Fiber & Fixed Wireless
            </div>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              Fast, Reliable Internet in{" "}
              <span className="text-primary">Awka</span>
            </h1>
            <p className="mb-8 text-lg text-white/85 md:text-xl">
              Broadband you can count on — fibre and fixed wireless connectivity
              for homes and businesses. <strong>Free sign-up.</strong>
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <a href="#contact">Get Started</a>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/10 hover:text-white" asChild>
                <a
                  href="https://wa.me/2348000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-5 w-5" />
                  Chat on WhatsApp
                </a>
              </Button>
            </div>
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
