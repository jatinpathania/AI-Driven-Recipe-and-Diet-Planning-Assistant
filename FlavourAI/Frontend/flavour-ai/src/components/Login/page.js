"use client"
import LoginForm from "./LoginForm"
import Header from "@/components/Header/Header"
import Link from "next/link"
import Image from "next/image"
import FormCard from "@/components/ui/FormCard"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#9de0b2] flex items-center justify-center">
      <div className="w-full max-w-3xl flex items-center justify-center px-4">
        <div className="w-full flex flex-col items-center">
          {/* <div className="w-full max-w-md mb-4 text-left">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold text-[#135298] hover:text-black transition-all duration-200"
            >
              <span className="text-sm">← Home</span>
            </Link>
          </div> */}

          <h1 className="text-3xl sm:text-4xl font-semibold text-black mb-2">Welcome Back</h1>
          <p className="text-gray-600 text-sm sm:text-base mb-6 text-center max-w-md">
            Sign in to your <span className="text-[#06c86c] font-semibold"><a href="/">Flavour AI</a></span> account
          </p>

          <FormCard>
            <LoginForm />
          </FormCard>
        </div>
      </div>
    </div>
  )
}