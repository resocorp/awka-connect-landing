import Navbar from "@/components/Navbar";
import PromoBanner from "@/components/PromoBanner";
import Hero from "@/components/Hero";
import Plans from "@/components/Plans";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import PromoSection from "@/components/PromoSection";
import Coverage from "@/components/Coverage";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import StickyMobileCTA from "@/components/StickyMobileCTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PromoBanner />
      <Navbar />
      <Hero />
      <Plans />
      <Features />
      <HowItWorks />
      <Testimonials />
      <PromoSection />
      <Coverage />
      <FAQ />
      <Contact />
      <Footer />
      <StickyMobileCTA />
    </div>
  );
};

export default Index;
