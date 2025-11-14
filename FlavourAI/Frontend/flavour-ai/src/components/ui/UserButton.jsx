"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { UserCircle2 } from "lucide-react"

export default function UserButton() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  
  useEffect(() => {
    const user = localStorage.getItem("user") 
    setIsLoggedIn(!!user)
  }, [])

  if (isLoggedIn) {
    return (
      <button
        onClick={() => router.push("/profile")}
        className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
        aria-label="Profile"
      >
        <UserCircle2 size={24} className="text-gray-800 dark:text-gray-200" />
      </button>
    )
  }

  return (
    <button
      onClick={() => router.push("/login")}
      className="px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold transition-all"
    >
      Login
    </button>
  )
}
