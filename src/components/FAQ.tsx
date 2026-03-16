import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How much does installation cost?",
    a: "Sign-up is free. Installation fees are assessed after a site survey — fibre installations normally start from ₦105,000, but right now you can get it for just ₦52,500 (50% off) during our seasonal promo! Fixed wireless starts from ₦200,000.",
  },
  {
    q: "Is there a seasonal promo running?",
    a: "Yes! For a limited time, we're slashing fibre installation by 50% — from ₦105,000 down to just ₦52,500. This is a limited-time offer, so sign up now before it ends.",
  },
  {
    q: "How does the referral programme work?",
    a: "It's simple — refer a friend or family member to PHSWEB. When they subscribe to any plan, you get 2 weeks of free internet added to your next billing cycle. Just mention your name when they sign up, or refer them via WhatsApp.",
  },
  {
    q: "What speeds can I expect?",
    a: "Speeds depend on your plan and connection type. Our fibre and fixed wireless networks are designed to deliver fast, consistent broadband suitable for streaming, video calls, and remote work.",
  },
  {
    q: "Are there any contracts or hidden fees?",
    a: "No long-term contracts. You pay monthly and can cancel anytime. We believe in transparent pricing with no hidden charges.",
  },
  {
    q: "How long does installation take?",
    a: "After your site survey, installation is typically scheduled within a few days. The actual setup usually takes a few hours depending on the type of connection.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept bank transfers, online payments, and other convenient payment methods. Our team will guide you through the process.",
  },
  {
    q: "What if I have issues with my connection?",
    a: "Our local support team in Awka is available 24/7. You can reach us by phone, WhatsApp, or through our contact form.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="relative px-4 py-12 md:px-8 md:py-20 overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-accent/20 rounded-full -translate-x-1/2 -translate-y-1/3 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
      {/* Floating shapes */}
      <div className="absolute top-1/3 right-16 w-6 h-6 border-2 border-primary/10 rounded rotate-45 hidden md:block" />
      <div className="absolute bottom-1/4 left-20 w-4 h-4 bg-primary/10 rounded-full hidden md:block" />
      <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-accent/40 rounded-full hidden md:block" />

      <div className="relative mx-auto max-w-3xl">
        <div className="mb-8 text-center md:mb-12">
          <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground">
            Got questions? We've got answers.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
