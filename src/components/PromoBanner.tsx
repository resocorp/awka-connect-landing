import { useState } from "react";
import { X, Tag, Users } from "lucide-react";

const PromoBanner = () => {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="relative z-40 bg-gradient-to-r from-orange-600 via-primary to-orange-500 text-white">
      {/* Dismiss button — absolute so it never disrupts content layout */}
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss banner"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-75 hover:opacity-100 transition-opacity z-10"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="mx-auto max-w-6xl px-4 py-2 pr-8 md:px-8 md:pr-12 md:py-2.5">
        {/* ── Mobile: compact two-line layout ── */}
        <div className="md:hidden text-center space-y-0.5">
          <p className="text-sm font-semibold leading-snug flex flex-wrap items-center justify-center gap-x-1.5">
            <Tag className="h-3.5 w-3.5 shrink-0" />
            <strong>🔥 50% OFF</strong>
            <span>Fiber Install —</span>
            <span className="line-through opacity-70 text-xs">₦105,000</span>
            <strong>₦52,500</strong>
            <a
              href="#contact"
              className="ml-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-primary hover:bg-white/90 transition-colors"
            >
              Claim →
            </a>
          </p>
          <p className="text-xs text-white/85 flex items-center justify-center gap-1.5">
            <Users className="h-3 w-3 shrink-0" />
            <strong>Refer a friend</strong>&nbsp;→ get&nbsp;<strong>2 weeks free</strong>
          </p>
        </div>

        {/* ── Desktop: single-row layout ── */}
        <div className="hidden md:flex items-center justify-center gap-x-6 gap-y-1 flex-wrap text-sm font-medium text-center">
          <span className="flex items-center gap-1.5">
            <Tag className="h-4 w-4 shrink-0" />
            <strong>🔥 Seasonal Promo:</strong>&nbsp;Fiber installation slashed by&nbsp;<strong>50%</strong>&nbsp;—&nbsp;
            <span className="line-through opacity-75">₦105,000</span>&nbsp;<strong>₦52,500</strong>
          </span>
          <span className="opacity-60">|</span>
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
      </div>
    </div>
  );
};

export default PromoBanner;
