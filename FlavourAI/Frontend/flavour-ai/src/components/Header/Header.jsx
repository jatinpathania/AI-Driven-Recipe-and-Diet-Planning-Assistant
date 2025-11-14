"use client"

import Link from "next/link"
import { UserCircle2 } from "lucide-react"

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4  bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2">
        <img
          src="/icon.png"
          alt="Flavour AI"
          className="w-15 h-15 "
        />
      </Link>
      
      <Link
        href="/login"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1b5e20] text-white text-sm hover:bg-green-700 transition-all">
        <span className="sm:inline">Login</span>
      </Link> 
      
    </header>
  )
}
