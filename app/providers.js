"use client"

import { SessionProvider } from "next-auth/react"
import { GuestUserProvider } from "@/context/GuestUserContext"
import SessionExpiredBanner from "@/components/ui/SessionExpiredBanner"

export default function Providers({ children }) {
    return (
        <SessionProvider>
            <GuestUserProvider>
                <SessionExpiredBanner />
                {children}
            </GuestUserProvider>
        </SessionProvider>
    )
}