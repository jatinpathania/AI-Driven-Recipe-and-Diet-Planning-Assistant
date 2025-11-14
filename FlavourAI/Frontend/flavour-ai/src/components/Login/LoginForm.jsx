  "use client"
  import { useState } from "react"
  import { useRouter } from "next/navigation"
  import { Eye,EyeOff } from "lucide-react"

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
      <form onSubmit={handleSubmit} className="w-full" aria-describedby="login-error ">
        

  <div className="flex flex-col space-y-2 mb-3">
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className=" border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500 border-gray-200 placeholder:text-xs  text-black"
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
              className="w-full border rounded-xl p-2 pr-20 focus:outline-none focus:ring-1 focus:ring-green-500 border-gray-200 placeholder:text-xs text-black"
              
              required
              minLength={6}
            />

            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-black hover:text-green-600 "
              aria-pressed={showPassword}
              aria-label={showPassword ? (<EyeOff className="w-5 h-5 " />) : "Show password"}
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
          className="w-full relative px-6 py-2 rounded-full text-white font-medium 
           bg-gradient-to-b from-[#3a3a3a] to-[#1e1e1e] border border-[#555555]/30 shadow-[inset_0_1px_0_#ffffff1a,0_2px_4px_rgba(0,0,0,0.5)] hover:from-[#4a4a4a] hover:to-[#222222] active:scale-[0.98] transition-all duration-200"
        >
          <span>{loading ? "Logging in..." : "Login"}</span>
        </button>

        <p className="text-center text-xs text-gray-400 mt-3 ">
          Don't have an account ? <a href="/signup" className=" font-semibold text-green-400 hover:underline">Sign up</a>
        </p>
        
        
        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-black/30" />
          <div className="text-xs text-gray-400">Or sign in with</div>
          <div className="flex-1 h-px bg-black/30" />
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            className=" flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm shadow-sm hover:shadow-md transition"
            onClick={() => {/* stub: add social login handler if needed */}}
          >
            <svg className="w-4 h-4" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path fill="#4285F4" d="M533.5 278.4c0-18.5-1.5-36.3-4.3-53.6H272v101.5h147.1c-6.4 34.7-25.7 64.1-54.8 83.7v69.6h88.4c51.7-47.6 81.8-117.8 81.8-201.2z"/>
              <path fill="#34A853" d="M272 544.3c73.7 0 135.6-24.4 180.8-66.3l-88.4-69.6c-24.6 16.5-56 26.3-92.4 26.3-71 0-131.2-47.9-152.6-112.2H28.6v70.6C73.6 483.8 166 544.3 272 544.3z"/>
              <path fill="#FBBC05" d="M119.4 323.1c-5.6-16.5-8.8-34.1-8.8-52s3.2-35.5 8.8-52V148.3H28.6C10.1 185.8 0 225.2 0 265.1s10.1 79.3 28.6 116.8l90.8-58.8z"/>
              <path fill="#EA4335" d="M272 107.4c39.9 0 75.7 13.7 104 40.5l78-78C407.7 24.4 345.8 0 272 0 166 0 73.6 60.5 28.6 148.3l90.8 70.6C140.8 155.3 201 107.4 272 107.4z"/>
            </svg>
            <span>Google</span>
          </button>
        </div>

      </form>
    )
  }