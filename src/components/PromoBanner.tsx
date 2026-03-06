import { useState } from "react";
import { X, Tag, Users } from "lucide-react";

const PromoBanner = () => {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="relative z-40 bg-gradient-to-r from-orange-600 via-primary to-orange-500 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 md:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm font-medium w-full text-center">
          <span className="flex items-center gap-1.5">
            <Tag className="h-4 w-4 shrink-0" />
            <strong>🔥 Seasonal Promo:</strong>&nbsp;Fiber installation slashed by&nbsp;<strong>50%</strong>&nbsp;—&nbsp;
            <span className="line-through opacity-75">₦105,000</span>&nbsp;<strong>₦52,500</strong>
          </span>
          <span className="hidden md:block opacity-60">|</span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 shrink-0" />
            <strong>Refer a friend</strong>&nbsp;→ get&nbsp;<strong>2 weeks free</strong>
          </span>
          <a
            href="#contact"
            className="ml-2 shrink-0 rounded-full bg-white px-3 py-0.5 text-xs font-bold text-primary hover:bg-white/90 transition-colors"
          >
            Claim Now →
          </a>
        </div>
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss banner"
          className="shrink-0 opacity-75 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PromoBanner;
