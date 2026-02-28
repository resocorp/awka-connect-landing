import { Button } from "@/components/ui/button";
import { MessageCircle, Wifi } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-background px-4 py-20 md:px-8 md:py-32">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 md:flex-row md:justify-between">
        <div className="max-w-xl text-center md:text-left">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
            <Wifi className="h-4 w-4" />
            Fiber & Fixed Wireless
          </div>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Fast, Reliable Internet for{" "}
            <span className="text-primary">Awka</span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            Broadband you can count on — fibre and fixed wireless connectivity
            for homes and businesses. <strong>Free sign-up.</strong>
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
            <Button size="lg" asChild>
              <a href="#contact">Get Started</a>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
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

        {/* Hero graphic */}
        <div className="flex shrink-0 items-center justify-center">
          <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-primary/10 md:h-80 md:w-80">
            <div className="absolute inset-4 rounded-full bg-primary/10" />
            <Wifi className="h-24 w-24 text-primary md:h-32 md:w-32" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
