import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How much does installation cost?",
    a: "Sign-up is free. Installation fees are assessed after a site survey — fibre installations start from ₦50,000 and fixed wireless from ₦200,000, depending on your location and coverage.",
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
    <section id="faq" className="px-4 py-20 md:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
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
