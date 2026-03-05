export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-gray-400 mt-2 text-sm">Last updated: March 1, 2025</p>
        </div>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          {[
            {
              title: "1. Acceptance of Terms",
              content: `By accessing or using PDFMaster, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.`,
            },
            {
              title: "2. Description of Service",
              content: `PDFMaster provides online PDF tools including merging, splitting, compressing, converting, and editing PDF files. Some features require a free account. Premium features require a paid subscription.`,
            },
            {
              title: "3. User Accounts",
              content: `You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information when creating an account. You may not share your account with others or use another person's account.`,
            },
            {
              title: "4. Acceptable Use",
              content: `You agree not to use PDFMaster to process illegal content, infringe on intellectual property rights, attempt to hack or disrupt the service, or use automated scripts to abuse the service. We reserve the right to terminate accounts that violate these terms.`,
            },
            {
              title: "5. File Processing",
              content: `Files processed through our service are your sole responsibility. You represent that you have the right to process any files you upload. We do not claim ownership of your files and will not use them for any purpose other than providing the service.`,
            },
            {
              title: "6. Subscriptions and Billing",
              content: `Paid subscriptions are billed monthly or annually. You can cancel at any time. Refunds are available within 7 days of purchase if the service did not work as advertised. We reserve the right to change pricing with 30 days notice.`,
            },
            {
              title: "7. Limitation of Liability",
              content: `PDFMaster is provided "as is" without warranties of any kind. We are not liable for any data loss, corruption, or damages resulting from use of the service. Our total liability is limited to the amount paid by you in the 12 months prior to the claim.`,
            },
            {
              title: "8. Termination",
              content: `We may suspend or terminate your account if you violate these terms. You may close your account at any time from the settings page. Upon termination, your data will be deleted within 30 days.`,
            },
            {
              title: "9. Governing Law",
              content: `These terms are governed by the laws of the jurisdiction in which PDFMaster operates. Any disputes will be resolved through binding arbitration.`,
            },
            {
              title: "10. Contact",
              content: `For questions about these terms, contact us at legal@pdfmaster.com.`,
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