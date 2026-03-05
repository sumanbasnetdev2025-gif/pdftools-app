import Link from "next/link";
import { Shield, Download, Trash2, Eye, Edit, Ban } from "lucide-react";

export default function GDPRPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-red-50 to-rose-50 border-b border-red-100">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">GDPR Compliance</h1>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            PDFMaster is committed to protecting your privacy and complying with the
            General Data Protection Regulation (GDPR).
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        {/* Your Rights */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Your GDPR Rights</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Eye, title: "Right to Access", desc: "Request a copy of all personal data we hold about you." },
              { icon: Edit, title: "Right to Rectification", desc: "Correct any inaccurate or incomplete personal data." },
              { icon: Trash2, title: "Right to Erasure", desc: "Request deletion of your personal data ('right to be forgotten')." },
              { icon: Download, title: "Right to Portability", desc: "Receive your data in a machine-readable format." },
              { icon: Ban, title: "Right to Object", desc: "Object to processing of your data for certain purposes." },
              { icon: Shield, title: "Right to Restrict", desc: "Request restriction of how your data is processed." },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-5"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Data Processing */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">How We Process Your Data</h2>
          {[
            {
              title: "Legal Basis",
              content: "We process your data based on contractual necessity (to provide the service), your consent (for marketing), and legitimate interests (to improve the product).",
            },
            {
              title: "Data Retention",
              content: "Account data is retained while your account is active. File processing history is retained for 90 days on Pro plans. Server-side processed files are deleted immediately after conversion. You can delete your account and all associated data at any time from Settings.",
            },
            {
              title: "Data Transfers",
              content: "Your data is stored on Supabase servers in the EU. When using CloudConvert for file conversions, data may be temporarily transferred to their servers under standard contractual clauses.",
            },
            {
              title: "Data Protection Officer",
              content: "For GDPR-related inquiries, contact our DPO at dpo@pdfmaster.com. We respond to all requests within 30 days.",
            },
          ].map(({ title, content }) => (
            <div
              key={title}
              className="border border-gray-100 rounded-2xl p-6"
            >
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{content}</p>
            </div>
          ))}
        </div>

        {/* Exercise Rights */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900">Exercise Your Rights</h2>
          <p className="text-gray-500 text-sm mt-2 mb-6">
            You can manage your data directly from your account settings, or contact us for assistance.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/settings"
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all"
            >
              Manage My Data
            </Link>
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-gray-700 border border-gray-200 hover:border-gray-300 transition-all"
            >
              Contact DPO
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}