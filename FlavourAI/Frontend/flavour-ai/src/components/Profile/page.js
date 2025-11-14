"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Github, LogOut, User } from "lucide-react"

export default function ProfileDashboard() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    name: "Vaibhav",
    email: "vaibhav@example.com",
    password: "********",
    github: "https://github.com/vaibhav",
  })
  const [message, setMessage] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setMessage("✅ Profile updated successfully")
    setTimeout(() => setMessage(""), 3000)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-[#0e1425] to-[#060d18] text-white px-4 py-10">
      <div className="w-full max-w-4xl">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between mb-10 px-4 sm:px-0">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[#1e2838] flex items-center justify-center border border-[#06c86c]">
              <User className="w-8 h-8 text-[#06c86c]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{form.name}</h1>
              <p className="text-gray-400 text-sm">{form.email}</p>
            </div>
          </div>

          <button
            onClick={() => router.push("/login")}
            className="flex items-center gap-2 mt-6 sm:mt-0 bg-[#1e2838] border border-gray-700 text-gray-300 hover:text-red-400 hover:border-red-400 px-3 py-2 rounded-lg text-xs transition-all duration-200"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        <div className="w-full bg-gradient-to-b from-[#0e1425] via-[#1e2838] to-[#060d18] border border-gray-700 rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold mb-6 border-b border-gray-700 pb-2">Account Settings</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="text-xs text-gray-400 mb-1 block">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 bg-transparent text-sm text-white border-gray-600 focus:outline-none focus:ring-1 focus:ring-[#06c86c] placeholder:text-xs"
              />
            </div>

            <div>
              <label htmlFor="email" className="text-xs text-gray-400 mb-1 block">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 bg-transparent text-sm text-white border-gray-600 focus:outline-none focus:ring-1 focus:ring-[#06c86c] placeholder:text-xs"
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="text-xs text-gray-400 mb-1 block">Password</label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 pr-10 bg-transparent text-sm text-white border-gray-600 focus:outline-none focus:ring-1 focus:ring-[#06c86c] placeholder:text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-[#06c86c]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div>
              <label htmlFor="github" className="text-xs text-gray-400 mb-1 block">GitHub</label>
              <div className="relative">
                <Github className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  id="github"
                  name="github"
                  type="url"
                  value={form.github}
                  onChange={handleChange}
                  className="w-full pl-9 border rounded-lg p-2 bg-transparent text-sm text-white border-gray-600 focus:outline-none focus:ring-1 focus:ring-[#06c86c] placeholder:text-xs"
                  placeholder="https://github.com/username"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#06c86c] hover:bg-[#04a857] text-white font-semibold rounded-lg py-2 text-sm transition-colors"
            >
              Save Changes
            </button>
          </form>

          {message && (
            <p className="text-center text-green-400 text-xs mt-3 animate-fadeIn">{message}</p>
          )}
        </div>

        <p className="text-gray-500 text-xs mt-8 text-center px-4">© {new Date().getFullYear()} Flavour AI. All rights reserved.</p>
      </div>
    </div>
  )
}
