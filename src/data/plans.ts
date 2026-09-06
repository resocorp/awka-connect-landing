/**
 * The plans, in one place.
 *
 * Previously these were defined three times and disagreed: the pricing cards in
 * Plans.tsx, a FALLBACK_PLANS constant in Contact.tsx, and the Supabase `plans`
 * table the retired CRM read from. The form dropdown and the pricing cards must
 * agree, or a lead saying "Power Plan" is ambiguous to whoever works it.
 *
 * `radiusSrvid` records the Radius Manager service each plan maps to, taken from
 * the retired CRM's plans table (archived at
 * /root/phsweb-bench/phsweb-website-archive-20260906/plans.csv). Nothing on this
 * site provisions any more — it is here so whoever provisions by hand knows
 * which service a customer asked for. Keep it in step with Radius Manager.
 */

export interface Plan {
  /** Customer-facing name. This is what appears in the form and in Chatwoot. */
  name: string;
  /** Display price, already formatted — "Custom" is legitimate. */
  price: string;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
  cta: string;
  ctaHref: string;
  /** Radius Manager service id, or null where the plan is quoted per deal. */
  radiusSrvid: number | null;
  /** Name of the matching row in Radius Manager, where it differs from `name`. */
  radiusName?: string;
  /** Monthly price in naira, for the plans that have a fixed one. */
  monthlyNaira?: number;
}

export const PLANS: Plan[] = [
  {
    name: "Home Plan",
    price: "₦25,000",
    period: "/month",
    description: "Ideal for homes & everyday browsing",
    features: [
      "Fast download speeds",
      "Stream movies & music",
      "Connect multiple devices",
      "24/7 local support",
      "No hidden fees",
    ],
    popular: false,
    cta: "Choose Home Plan",
    ctaHref: "#contact",
    radiusSrvid: 30,
    radiusName: "UNLIMITED HOME PLAN",
    monthlyNaira: 25000,
  },
  {
    name: "Power Plan",
    price: "₦40,000",
    period: "/month",
    description: "For heavy users, businesses & remote work",
    features: [
      "High-speed fibre priority",
      "Unlimited streaming & downloads",
      "Ideal for video calls & remote work",
      "Priority 24/7 support",
    ],
    popular: true,
    cta: "Choose Power Plan",
    ctaHref: "#contact",
    radiusSrvid: 31,
    radiusName: "UNLIMITED SME PLAN",
    monthlyNaira: 40000,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Tailored solutions for organizations",
    features: [
      "Static IP included",
      "Business-grade reliability",
      "Custom bandwidth & SLA",
      "Dedicated account manager",
      "Priority 24/7 support",
    ],
    popular: false,
    cta: "Contact Us",
    ctaHref: "#contact",
    radiusSrvid: null,
  },
];

/** Names only, for the contact form's plan picker. */
export const PLAN_NAMES = PLANS.map((p) => p.name);
