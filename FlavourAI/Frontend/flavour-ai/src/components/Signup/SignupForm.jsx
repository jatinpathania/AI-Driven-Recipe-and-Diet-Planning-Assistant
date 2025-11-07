"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

export default function SignupForm() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    if (!form.name) return setError("Name is required"), false
    if (!form.email) return setError("Email is required"), false
    if (form.password.length < 6) return setError("Password must be at least 6 characters"), false
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match"), false
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (!validate()) return
    setLoading(true)
    try {
      // Replace with actual signup call later (e.g. signupUser(form))
      console.log("User registered:", form)
      router.push("/login")
    } catch (err) {
      setError("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 w-full">
      {/* Name */}
      <div className="flex flex-col space-y-2 mb-3">
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className="border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500 border-gray-600 placeholder:text-xs"
          required
        />
      </div>

      {/* Email */}
      <div className="flex flex-col space-y-2 mb-3">
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500 border-gray-600 placeholder:text-xs"
          required
        />
      </div>

      {/* Password */}
      <div className="relative mb-3">
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500 border-gray-600 placeholder:text-xs"
          required
          minLength={6}
        />
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-400 "
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff className="w-4 h-4 opacity-60" /> : <Eye className="w-4 h-4 opacity-60" />}
        </button>
      </div>

      {/* Confirm Password */}
      <div className="relative mb-3">
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          className="w-full border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500 border-gray-600 placeholder:text-xs"
          required
          minLength={6}
        />
      </div>

      {/* Error */}
      {error && <p className="text-red-500 text-xs text-center mb-2">{error}</p>}

      {/* Signup Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 transition disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Sign Up"}
      </button>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 mt-3">
        Already have an account?{" "}
        <a href="/login" className="text-[#06c86c] hover:underline font-medium">
          Login
        </a>
      </p>
      //TODO Make a Google ,Github and Mobile Number signup auth part
    </form>
  )
}
