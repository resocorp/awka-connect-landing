import { MessageCircle, ArrowRight } from "lucide-react";

const StickyMobileCTA = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-2xl">
      <div className="flex items-center gap-3">
        <a
          href="#contact"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
        >
          Get Started — Free Sign-Up <ArrowRight className="h-4 w-4" />
        </a>
        <a
          href="https://wa.me/2349076824134"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-500 text-white"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
};

export default StickyMobileCTA;
