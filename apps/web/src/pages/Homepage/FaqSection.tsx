import { FAQScrollAccordion } from "@/components/faq-scroll-accordion";
import { HOME_FAQS } from "./faqData";

const FaqSection = () => {
  return (
    <section id="faq" className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FAQScrollAccordion items={HOME_FAQS} />
      </div>
    </section>
  );
};

export default FaqSection;
