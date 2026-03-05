"use client";
import { useState } from "react";
import { Mail, MessageSquare, Clock, CheckCircle, Loader2 } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    // Simulate sending — wire up to email API (Resend, SendGrid etc.)
    await new Promise((r) => setTimeout(r, 1500));
    setSent(true);
    setSending(false);
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-red-50 to-rose-50 border-b border-red-100">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Contact Us</h1>
          <p className="text-lg text-gray-500 mt-3">
            We're here to help. Send us a message and we'll respond within 24 hours.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Info */}
          <div className="space-y-6">
            <h2 className="font-bold text-gray-900 text-lg">Get in touch</h2>
            {[
              {
                icon: Mail,
                title: "Email",
                value: "sumanbasnet2030@gmail.com",
                desc: "We reply within 24 hours",
              },
              {
                icon: MessageSquare,
                title: "Live Chat",
                value: "Available on Pro plan",
                desc: "Instant support",
              },
              {
                icon: Clock,
                title: "Support Hours",
                value: "Mon–Fri, 9am–6pm",
                desc: "UTC timezone",
              },
            ].map(({ icon: Icon, title, value, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-sm text-gray-600">{value}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="md:col-span-2">
            {sent ? (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-10 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 text-lg">Message sent!</h3>
                <p className="text-gray-500 text-sm mt-2">
                  We'll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setSent(false);
                    setName("");
                    setEmail("");
                    setSubject("");
                    setMessage("");
                  }}
                  className="mt-4 text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 space-y-5"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="John Doe"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                  >
                    <option value="">Select a topic</option>
                    <option value="general">General Question</option>
                    <option value="bug">Report a Bug</option>
                    <option value="billing">Billing</option>
                    <option value="feature">Feature Request</option>
                    <option value="enterprise">Enterprise Inquiry</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    placeholder="Describe your issue or question..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}