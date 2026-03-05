import Link from "next/link";
import { FileText, Users, Zap, Shield, Globe, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-red-50 to-rose-50 border-b border-red-100">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">About PDFMaster</h1>
          <p className="text-lg text-gray-500 mt-4 max-w-2xl mx-auto leading-relaxed">
            We're on a mission to make PDF tools fast, free, and accessible to
            everyone — no installs, no subscriptions, no hassle.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
            <p className="text-gray-500 mt-4 leading-relaxed">
              PDFMaster was built out of frustration with expensive, bloated PDF
              software. We believe everyone deserves access to professional PDF
              tools without paying a monthly subscription or installing heavy
              software.
            </p>
            <p className="text-gray-500 mt-4 leading-relaxed">
              Our tools run entirely in your browser, meaning your files never
              leave your device unless you choose to use a conversion feature.
              Privacy-first, always.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Users, label: "Users Served", value: "500K+" },
              { icon: FileText, label: "Files Processed", value: "10M+" },
              { icon: Globe, label: "Countries", value: "150+" },
              { icon: Zap, label: "Tools Available", value: "30+" },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="bg-gray-50 rounded-2xl p-5 text-center border border-gray-100"
              >
                <Icon className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Our Values
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Privacy First",
                desc: "Files are processed locally in your browser. We don't store or read your documents.",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                desc: "No waiting in queues. PDF operations happen instantly using modern web technology.",
              },
              {
                icon: Heart,
                title: "Free Forever",
                desc: "Core tools are always free. No credit card, no signup required for basic features.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-gray-100 p-6 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Ready to get started?
        </h2>
        <p className="text-gray-500 mt-3">
          Join thousands of users who trust PDFMaster every day.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <Link
            href="/signup"
            className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all shadow-sm"
          >
            Get Started Free
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 rounded-xl font-semibold text-gray-600 border border-gray-200 hover:border-gray-300 transition-all"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}