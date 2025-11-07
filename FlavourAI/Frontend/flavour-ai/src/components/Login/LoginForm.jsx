  "use client"
  import { useState } from "react"
  import { useRouter } from "next/navigation"
  import { Eye,EyeOff } from "lucide-react"
  //import { loginUser } from "@/lib/api"

  export default function LoginForm() {
    const router = useRouter()
    const [form, setForm] = useState({ email: "", password: "" })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const handleChange = (e) => {
      const { name, value } = e.target
      setForm((prev) => ({ ...prev, [name]: value }))
    }

    const validate = () => {
      if (!form.email) {
        setError("Email is required")
        return false
      }
      if (!form.password || form.password.length < 6) {
        setError("Password must be at least 6 characters")
        return false
      }
      return true
    }

    const handleSubmit = async (e) => {
      e.preventDefault()
      setError("")

      if (!validate()) return

      setLoading(true)
      try {
        const res = await loginUser(form)
        if (res?.success) {
          if (res.token) localStorage.setItem("token", res.token)
          router.push("/profile")
        } else {
          setError(res?.message || "Invalid credentials")
        }
      } catch (err) {
        setError("Something went wrong.")
      } finally {
        setLoading(false)
      }
    }

    return (
      <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 " aria-describedby="login-error ">
        

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

        <div className="flex flex-col space-y-2 mb-3">
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 pr-20 focus:outline-none focus:ring-1 focus:ring-green-500 border-gray-600 placeholder:text-xs"
              required
              minLength={6}
            />

            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white-800 hover:text-green-400 "
              aria-pressed={showPassword}
              aria-label={showPassword ? (<EyeOff className="w-5 h-5" />) : "Show password"}
            >
              {showPassword ? (<EyeOff className="w-4 h-4 opacity-60" />) : (<Eye className="w-4 h-4 opacity-60" />)}
            </button>
          </div>
        </div>

        <p id="login-error" role="alert" aria-live="assertive" className="text-red-500 text-s text-center mb-2">
          {error}
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-sm py-2 transition disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-xs text-gray-200 mt-3">
          Don't have an account ? <a href="/signup" className="text-green-400 hover:underline">Sign up</a>
        </p>

        //TODO Make a Google ,Github and Mobile Number login auth part
      </form>
    )
  }