import Link from "next/link";
import { Check, X } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for occasional use",
    color: "border-gray-200",
    buttonClass: "border border-gray-200 text-gray-700 hover:border-gray-300",
    badge: null,
    features: [
      { text: "20 files per day", included: true },
      { text: "Max 10MB per file", included: true },
      { text: "All basic PDF tools", included: true },
      { text: "Browser-based processing", included: true },
      { text: "PDF to Word conversion", included: false },
      { text: "OCR text extraction", included: false },
      { text: "File history", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$9",
    period: "per month",
    description: "For professionals and teams",
    color: "border-red-400 shadow-lg shadow-red-100",
    buttonClass: "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700",
    badge: "Most Popular",
    features: [
      { text: "Unlimited files", included: true },
      { text: "Max 100MB per file", included: true },
      { text: "All PDF tools", included: true },
      { text: "Browser-based processing", included: true },
      { text: "PDF to Word conversion", included: true },
      { text: "OCR text extraction", included: true },
      { text: "File history (90 days)", included: true },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Enterprise",
    price: "$29",
    period: "per month",
    description: "For large teams and businesses",
    color: "border-gray-200",
    buttonClass: "border border-gray-200 text-gray-700 hover:border-gray-300",
    badge: null,
    features: [
      { text: "Unlimited files", included: true },
      { text: "Max 500MB per file", included: true },
      { text: "All PDF tools", included: true },
      { text: "Browser-based processing", included: true },
      { text: "PDF to Word conversion", included: true },
      { text: "OCR text extraction", included: true },
      { text: "File history (unlimited)", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
  },
  {
    q: "Is my data safe?",
    a: "Most tools process files entirely in your browser — files never leave your device. Server-side conversions are deleted immediately after processing.",
  },
  {
    q: "Do I need a credit card for the free plan?",
    a: "No. The free plan requires no credit card. Just sign up with your email and start using the tools.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards, PayPal, and bank transfers for enterprise plans.",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-red-50 to-rose-50 border-b border-red-100">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-gray-500 mt-3">
            Start free. Upgrade when you need more.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 p-7 ${plan.color} transition-all`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-400 text-sm mb-1">/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-7">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-2.5">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300 shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        feature.included ? "text-gray-700" : "text-gray-400"
                      }`}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === "Free" ? "/signup" : "/signup"}
                className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${plan.buttonClass}`}
              >
                {plan.name === "Free" ? "Get Started Free" : `Get ${plan.name}`}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="bg-white rounded-2xl border border-gray-100 p-6"
              >
                <h3 className="font-bold text-gray-900">{faq.q}</h3>
                <p className="text-gray-500 text-sm mt-2 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}