"use client"

import Link from "next/link"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <h1 className="text-3xl font-bold mb-3">Settings</h1>
        <p className="text-zinc-400 mb-8">Manage your account preferences and personalize your Flavour AI experience.</p>
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 p-4">
            <p className="font-semibold">Profile Preferences</p>
            <p className="text-sm text-zinc-400 mt-1">Update your profile details and account settings from here.</p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-4">
            <p className="font-semibold">Notifications</p>
            <p className="text-sm text-zinc-400 mt-1">Control reminders and cooking notifications.</p>
          </div>
        </div>
        <Link href="/" className="inline-block mt-8 px-5 py-2.5 rounded-lg bg-[#1b5e20] text-white font-medium hover:bg-[#144318] transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
