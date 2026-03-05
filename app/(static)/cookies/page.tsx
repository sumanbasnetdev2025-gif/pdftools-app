export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Cookie Policy</h1>
          <p className="text-gray-400 mt-2 text-sm">Last updated: March 1, 2025</p>
        </div>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-2">What Are Cookies?</h2>
            <p>Cookies are small text files stored on your device when you visit a website. They help us provide a better experience by remembering your preferences and keeping you logged in.</p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4">Cookies We Use</h2>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {["Cookie", "Purpose", "Duration", "Type"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { name: "sb-auth-token", purpose: "Authentication session", duration: "7 days", type: "Essential" },
                    { name: "sb-refresh-token", purpose: "Session refresh", duration: "30 days", type: "Essential" },
                    { name: "theme", purpose: "UI theme preference", duration: "1 year", type: "Functional" },
                    { name: "_analytics", purpose: "Usage analytics", duration: "90 days", type: "Analytics" },
                  ].map((row) => (
                    <tr key={row.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-gray-600">{row.name}</td>
                      <td className="px-4 py-3 text-gray-500">{row.purpose}</td>
                      <td className="px-4 py-3 text-gray-500">{row.duration}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.type === "Essential"
                            ? "bg-green-50 text-green-600"
                            : row.type === "Analytics"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {row.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900 mb-2">Managing Cookies</h2>
            <p>You can control cookies through your browser settings. Disabling essential cookies will prevent you from staying logged in. Analytics cookies can be disabled without affecting functionality.</p>
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900 mb-2">Contact</h2>
            <p>Questions about our cookie policy? Email us at privacy@pdfmaster.com.</p>
          </div>
        </div>
      </div>
    </main>
  );
}