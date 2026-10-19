import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { PLANS as plans, UPFRONT_MONTHS } from "@/data/plans";

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
            No installation fee: pay your first 2 months and we install
          </div>
          <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground">
            Choose the plan that fits your needs. Free sign-up, no contracts.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-4">
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
            Free sign-up • No installation fee • No contract
          </p>
          <p className="mt-1 text-sm font-medium flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
            <span className="text-muted-foreground">To start, your first {UPFRONT_MONTHS} months:</span>
            {plans.filter((p) => p.monthlyNaira).map((p, i) => (
              <span key={p.name} className="text-orange-600 font-bold">
                {i > 0 && <span className="text-muted-foreground font-normal">· </span>}
                {p.name.replace(" Plan", "")} ₦{((p.monthlyNaira ?? 0) * UPFRONT_MONTHS).toLocaleString("en-NG")}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Plans;
