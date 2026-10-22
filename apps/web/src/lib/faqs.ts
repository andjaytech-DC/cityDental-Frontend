import type { FaqItem } from "@/lib/schema";

/**
 * Single source for the FAQ page and its FAQPage structured data, so the
 * visible answers and the schema can never disagree.
 */
export const faqs: FaqItem[] = [
  {
    question: "When should I schedule my first dental visit?",
    answer:
      "We recommend visiting CityDental as soon as you feel there is a concern or for a routine check-up. Your first visit will include a consultation and examination.",
  },
  {
    question: "Do I need a referral to see a specialist?",
    answer:
      "While some services may require a referral, many are available directly at CityDental. Contact us to confirm requirements for your specific needs.",
  },
  {
    question: "What should I bring to my first appointment?",
    answer:
      "Bring a valid photo ID, your dental insurance information if applicable, any previous dental records, and a list of current medications.",
  },
  {
    question: "How do I book an appointment?",
    answer:
      "You can book an appointment online through our booking system or contact CityDental directly by phone or WhatsApp.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "Payment methods will be confirmed once the practice supplies the information. Please contact CityDental directly for details.",
  },
];
