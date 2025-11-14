"use client"
import SignupForm from "./SignupForm"
import Link from "next/link"
import Image from "next/image"
import Container from "@/components/ui/Container"
import FormCard from "@/components/ui/FormCard"

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#9de0b2] flex items-center justify-center">
      <div className="w-full max-w-3xl flex items-center justify-center px-4">
        <div className="relative w-full flex flex-col items-center">  
          <div className="text-center mb-4">
            <h1 className="text-3xl sm:text-4xl font-semibold">Create Account</h1>
          </div>

          <p className="text-gray-600 text-sm sm:text pb-5 text-center max-w-md">
            Sign up for your <span className="text-[#06c86c] font-semibold"><Link href="/">Flavour AI</Link></span> account
          </p>

          <FormCard>
            <SignupForm />
          </FormCard>
        </div>
      </div>
    </div>
  )
}
