"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { AlertTriangle } from 'lucide-react'
import { clearUserData } from '@/utils/api'

export function triggerGuestLoginPopup() {
    const event = new CustomEvent('flavour:guest-login-required')
    window.dispatchEvent(event)
}

export default function SessionExpiredBanner() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [guestLoginOpen, setGuestLoginOpen] = useState(false)

    useEffect(() => {
        const handleExpired = () => {
            setIsOpen(true)
        }

        const handleGuestLoginRequired = () => {
            setGuestLoginOpen(true)
        }

        window.addEventListener('flavour:session-expired', handleExpired)
        window.addEventListener('flavour:guest-login-required', handleGuestLoginRequired)
        return () => {
            window.removeEventListener('flavour:session-expired', handleExpired)
            window.removeEventListener('flavour:guest-login-required', handleGuestLoginRequired)
        }
    }, [])

    const handleOk = async () => {
        setIsOpen(false)
        clearUserData()
        await signOut({ redirect: false })
        window.history.replaceState(null, '', '/login')
        router.push('/login')
    }

    const handleSignIn = () => {
        setGuestLoginOpen(false)
        router.push('/login')
    }

    const handleSignUp = () => {
        setGuestLoginOpen(false)
        router.push('/signup')
    }

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-4">
                    <div className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-amber-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-900">Session expired</p>
                                <p className="mt-0.5 text-sm text-slate-600">Your session expired. You need to log in again.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleOk}
                                className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {guestLoginOpen && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="rounded-3xl border border-emerald-200 bg-white/98 shadow-2xl backdrop-blur-xl p-8 w-[90vw] max-w-lg">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Unlock Full Access</h2>
                            <p className="text-lg text-slate-600 mb-2">You&apos;ve reached the limit for guest users.</p>
                            <p className="text-base text-slate-500 mb-8">Sign in or create an account to continue enjoying personalized recipes, meal plans, and unlimited chat access with our AI Chef.</p>
                            
                            <div className="bg-emerald-50 rounded-2xl p-5 mb-8 text-left">
                                <h3 className="font-semibold text-slate-900 mb-3 text-center">With an account, you get:</h3>
                                <ul className="space-y-2 text-sm text-slate-700">
                                    <li className="flex items-start gap-3">
                                        <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                                        <span>Unlimited access to AI Chef for personalized cooking advice</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                                        <span>Save your favorite recipes and meal plans</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                                        <span>Track your calorie intake and nutrition</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                                        <span>Create custom meal plans tailored to your preferences</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="flex gap-3 flex-col sm:flex-row">
                            <button
                                type="button"
                                onClick={handleSignIn}
                                className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition-all hover:bg-emerald-700 active:scale-95"
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={handleSignUp}
                                className="flex-1 rounded-xl border-2 border-emerald-600 bg-white px-6 py-3 text-base font-semibold text-emerald-600 transition-all hover:bg-emerald-50 active:scale-95"
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
