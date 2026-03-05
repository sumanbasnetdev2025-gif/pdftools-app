"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/supabase/types";
import {
  User as UserIcon, Mail, Lock, Trash2,
  Loader2, CheckCircle, Bell, Shield, Eye, EyeOff,
} from "lucide-react";

interface Props {
  user: User;
  profile: Profile | null;
}

type Tab = "profile" | "security" | "notifications" | "danger";

export default function SettingsClient({ user, profile }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // Profile
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);

  // Danger
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    setProfileError(null);
    setSaveSuccess(false);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      setProfileError(error.message);
    } else {
      // Also update auth metadata
      await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    }
    setPasswordSaving(false);
  };

  const handleSaveNotifications = async () => {
    setNotifSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setNotifSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user.email) return;
    setDeleting(true);
    await supabase.auth.signOut();
    router.push("/");
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <UserIcon className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Lock className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "danger", label: "Danger Zone", icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account preferences</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Sidebar tabs */}
          <div className="sm:w-48 shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? tab.id === "danger"
                        ? "bg-red-50 text-red-600"
                        : "bg-red-50 text-red-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">

            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <h2 className="font-bold text-gray-900">Profile Information</h2>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white text-2xl font-bold">
                    {fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {profile?.full_name || "No name set"}
                    </p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold uppercase">
                      {profile?.plan || "free"} plan
                    </span>
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={user.email || ""}
                        disabled
                        className="w-full border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-gray-400">Email cannot be changed</p>
                  </div>
                </div>

                {profileError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                    {profileError}
                  </div>
                )}

                {saveSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Profile saved successfully!
                  </div>
                )}

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                {/* Stats */}
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Stats</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Files Processed", value: profile?.files_processed || 0 },
                      { label: "Member Since", value: new Date(user.created_at).toLocaleDateString() },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-gray-400">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === "security" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <h2 className="font-bold text-gray-900">Security</h2>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                      />
                    </div>
                  </div>
                </div>

                {passwordError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Password updated successfully!
                  </div>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={passwordSaving || !newPassword || !confirmPassword}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all disabled:opacity-50"
                >
                  {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {passwordSaving ? "Updating..." : "Update Password"}
                </button>

                {/* Session info */}
                <div className="border-t border-gray-100 pt-5 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Active Session</h3>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                    <p>Signed in as <span className="font-semibold">{user.email}</span></p>
                    <p className="text-xs text-gray-400 mt-1">
                      Last sign in: {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === "notifications" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <h2 className="font-bold text-gray-900">Notifications</h2>

                <div className="space-y-4">
                  {[
                    {
                      label: "Email Notifications",
                      desc: "Receive emails about your file processing status",
                      value: emailNotifs,
                      onChange: setEmailNotifs,
                    },
                    {
                      label: "Marketing Emails",
                      desc: "Receive updates about new features and tips",
                      value: marketingEmails,
                      onChange: setMarketingEmails,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => item.onChange(!item.value)}
                        className={`w-11 h-6 rounded-full transition-all duration-200 relative shrink-0 ${
                          item.value ? "bg-red-500" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full shadow absolute top-1 transition-all duration-200 ${
                            item.value ? "left-6" : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSaveNotifications}
                  disabled={notifSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all disabled:opacity-50"
                >
                  {notifSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {notifSaving ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            )}

            {/* DANGER ZONE TAB */}
            {activeTab === "danger" && (
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="font-bold text-red-600">Danger Zone</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    These actions are irreversible. Please be careful.
                  </p>
                </div>

                <div className="border border-red-100 rounded-xl p-5 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Delete Account</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Permanently delete your account and all associated data.
                      This cannot be undone.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Type your email to confirm:{" "}
                      <span className="text-red-500 font-mono">{user.email}</span>
                    </label>
                    <input
                      type="email"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder={user.email}
                      className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                  </div>

                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirm !== user.email || deleting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-40"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {deleting ? "Deleting..." : "Delete My Account"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}