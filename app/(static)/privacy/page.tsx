export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-400 mt-2 text-sm">Last updated: March 1, 2025</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-sm text-gray-600 leading-relaxed">
          {[
            {
              title: "1. Information We Collect",
              content: `When you create an account, we collect your name and email address. When you use our tools, we may collect usage data such as which tools you use and how often. We do not collect or store the contents of your PDF files — most processing happens entirely in your browser.`,
            },
            {
              title: "2. How We Use Your Information",
              content: `We use your information to provide and improve our services, send you important account notifications, respond to your support requests, and analyze usage patterns to improve the product. We never sell your personal data to third parties.`,
            },
            {
              title: "3. File Processing & Storage",
              content: `Most PDF operations (merge, split, compress, rotate, etc.) are performed entirely in your browser using JavaScript. Your files never leave your device for these operations. For server-side conversions (Word to PDF, OCR, etc.), files are temporarily uploaded, processed, and immediately deleted — we do not retain any copies.`,
            },
            {
              title: "4. Cookies",
              content: `We use essential cookies to keep you logged in and remember your preferences. We use analytics cookies to understand how users interact with our service. You can disable non-essential cookies in your browser settings.`,
            },
            {
              title: "5. Data Security",
              content: `We use industry-standard encryption (HTTPS/TLS) for all data transmission. Your password is hashed and never stored in plain text. We use Supabase for authentication and database storage, which follows SOC 2 Type II compliance standards.`,
            },
            {
              title: "6. Your Rights",
              content: `You have the right to access, correct, or delete your personal data at any time. You can do this from your account settings or by contacting us at support@pdfmaster.com. For users in the EU, we comply with GDPR requirements.`,
            },
            {
              title: "7. Third-Party Services",
              content: `We use the following third-party services: Supabase (authentication and database), CloudConvert (file conversion), Vercel (hosting). Each service has its own privacy policy and data handling practices.`,
            },
            {
              title: "8. Changes to This Policy",
              content: `We may update this policy from time to time. We will notify you of significant changes via email or a notice on our website. Continued use of the service after changes constitutes acceptance of the new policy.`,
            },
            {
              title: "9. Contact Us",
              content: `If you have any questions about this privacy policy, please contact us at privacy@pdfmaster.com or through our contact page.`,
            },
          ].map(({ title, content }) => (
            <div key={title}>
              <h2 className="text-base font-bold text-gray-900 mb-2">{title}</h2>
              <p>{content}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}