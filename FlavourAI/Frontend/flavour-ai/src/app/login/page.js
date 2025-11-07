"use client"
import LoginForm from "./LoginForm"
import Link from "next/link"

export default function LoginPage() {
    return(

        
        <div className="flex flex-col items-center justify-center min-h-screen text-white bg-gray-50 bg-gradient-to-r from-[#0e1425] to-[#060d18]" >
          <div className=" w-full max-w-md mb-6">
        <Link
          href="/"
          className="flex items-center justify-left gap-2 text-xs px-1 text-sm font-semibold text-[#135298] hover: hover:text-black transition-all duration-200"
        >
          <span className=" text-xs">← Home</span>
        </Link>
      </div>
          <div className="">
            <h1 className="text-4xl font-semibold">Welcome Back</h1>
          </div>
          <p className="text-gray-400 text-xs sm:text pb-5 ">
             Sign in to your <span className="text-[#06c86c] font-semibold " ><a href="/">Flavour AI</a></span> account
          </p>
      <div className="w-full max-w-sm pt-5 bg-white rounded-lg shadow-md   flex items-center justify-center bg-gradient-to-b from-[#0e1425] via-[#1e2838] to-[#060d18] border-1 border-gray-800 gray-100">
        <LoginForm />
      </div>
    </div>
    )
}