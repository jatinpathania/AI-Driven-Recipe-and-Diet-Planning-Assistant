"use client"
import SignupForm from "./SignupForm"
import Link from "next/link"

export default function SignupPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white bg-gradient-to-r from-[#0e1425] to-[#060d18]">
      
      {/* Back to Home */}
      <div className="w-full max-w-md mb-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs px-1 text-sm font-semibold text-[#135298] hover:text-[#0d3c6b] transition-all duration-200"
        >
          <span className="text-xs">← Home</span>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-4xl font-semibold">Create Account</h1>
      </div>
      <p className="text-gray-400 text-xs sm:text pb-5">
        Sign up for your <span className="text-[#06c86c] font-semibold"><a href="/">Flavour AI</a></span> account
      </p>

      {/* Signup Box */}
      <div className="w-full max-w-sm pt-5 bg-gradient-to-b from-[#0e1425] via-[#1e2838] to-[#060d18] border border-gray-800 rounded-xl shadow-md flex items-center justify-center">
        <SignupForm />
      </div>
    </div>
  )
}
