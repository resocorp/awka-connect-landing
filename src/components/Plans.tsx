import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
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
  },
];

const Plans = () => {
  return (
    <section id="plans" className="relative bg-muted/50 px-4 py-12 md:px-8 md:py-20 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/30 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
      <div className="absolute top-1/2 right-10 w-4 h-4 bg-primary/20 rounded-full" />
      <div className="absolute top-20 right-1/4 w-2 h-2 bg-primary/30 rounded-full" />
      <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-primary/15 rounded-full" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-8 text-center md:mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100 border border-orange-200 px-4 py-1.5 text-sm font-semibold text-orange-700">
            🔥 Seasonal Promo: Fiber installation 30% OFF — ₦140,000 only!
          </div>
          <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground">
            Choose the plan that fits your needs. Free sign-up, no contracts.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular
                  ? "border-2 border-primary shadow-lg shadow-primary/10"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <a href={plan.ctaHref}>{plan.cta}</a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>


        <div className="mt-8 text-center px-2">
          <p className="text-sm text-muted-foreground">
            Free sign-up • Installation fee assessed after site survey
          </p>
          <p className="mt-1 text-sm font-medium flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
            <span className="text-muted-foreground line-through">Fiber ₦200,000</span>
            <span className="text-orange-600 font-bold">→ ₦140,000 (30% OFF 🔥)</span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <span className="text-muted-foreground">Fixed Wireless ₦200,000</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Plans;
