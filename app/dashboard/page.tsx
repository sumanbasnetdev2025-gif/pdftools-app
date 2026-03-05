import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, Star, FileText } from "lucide-react";
import { formatBytes } from "@/lib/utils/formatBytes";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Safe profile fetch with fallback
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Always safe to use — never undefined
  const profile = profileData ?? {
    id: user.id,
    email: user.email ?? "",
    full_name: user.user_metadata?.full_name ?? null,
    avatar_url: null,
    plan: "free",
    files_processed: 0,
    storage_used_bytes: 0,
    created_at: user.created_at,
    updated_at: user.created_at,
  };

  const { data: recentHistory } = await supabase
    .from("file_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: savedFiles } = await supabase
    .from("saved_files")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(4);

  const firstName =
    profile.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "there";

  const avatarLetter =
    profile.full_name?.[0]?.toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header — no logo here, Navbar handles it */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-400">{profile.email}</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold uppercase">
            {profile.plan} plan
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {firstName} 👋
          </h2>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your PDFs.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Files Processed",
              value: profile.files_processed ?? 0,
              icon: "📄",
            },
            {
              label: "Storage Used",
              value: formatBytes(profile.storage_used_bytes ?? 0),
              icon: "💾",
            },
            {
              label: "Saved Files",
              value: savedFiles?.length ?? 0,
              icon: "⭐",
            },
            {
              label: "Plan",
              value: (profile.plan ?? "free").toUpperCase(),
              icon: "🚀",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <span className="text-2xl block mb-2">{stat.icon}</span>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick tools */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Tools</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/merge", emoji: "🔗", label: "Merge PDF" },
              { href: "/split", emoji: "✂️", label: "Split PDF" },
              { href: "/compress", emoji: "🗜️", label: "Compress" },
              { href: "/convert/pdf-to-word", emoji: "📝", label: "PDF to Word" },
              { href: "/convert/jpg-to-pdf", emoji: "🖼️", label: "JPG to PDF" },
              { href: "/convert/pdf-to-jpg", emoji: "📷", label: "PDF to JPG" },
              { href: "/watermark", emoji: "💧", label: "Watermark" },
              { href: "/ocr", emoji: "🔍", label: "OCR" },
            ].map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-red-200 hover:shadow-sm transition-all group"
              >
                <span className="text-2xl block mb-2">{tool.emoji}</span>
                <p className="text-sm font-medium text-gray-700 group-hover:text-red-600 transition-colors">
                  {tool.label}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent history */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Recent Activity
              </h2>
              <Link
                href="/history"
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                View all
              </Link>
            </div>

            {recentHistory && recentHistory.length > 0 ? (
              <div className="space-y-3">
                {recentHistory.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {item.input_filename}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.tool_used} ·{" "}
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                        item.status === "completed"
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No activity yet</p>
                <p className="text-xs mt-1">
                  Start using PDF tools to see your history
                </p>
              </div>
            )}
          </div>

          {/* Saved files */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Star className="w-4 h-4 text-gray-400" />
                Saved Files
              </h2>
              <Link
                href="/saved-files"
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                View all
              </Link>
            </div>

            {savedFiles && savedFiles.length > 0 ? (
              <div className="space-y-3">
                {savedFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {file.filename}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatBytes(file.file_size_bytes)} ·{" "}
                        {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No saved files yet</p>
                <p className="text-xs mt-1">
                  Files you save will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upgrade banner for free users */}
        {profile.plan === "free" && (
          <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-lg">Upgrade to Pro 🚀</h3>
                <p className="text-red-100 text-sm mt-1">
                  Get unlimited file processing, priority support and more.
                </p>
              </div>
              <Link
                href="/pricing"
                className="px-5 py-2.5 bg-white text-red-600 rounded-xl font-semibold text-sm hover:bg-red-50 transition-all shrink-0"
              >
                View Plans
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}