import React from 'react'
import Link from 'next/link'
import Loader from '../Loader/Loader'

const Footer = ({ loading = false }) => {
    return (
        <>
            {loading && <Loader />}
            <footer className="mt-16 border-t border-[#dce8df] bg-gradient-to-b from-[#f8fcf8] to-[#eef7ef]">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-2xl font-bold text-[#1b5e20]">Flavour AI</h3>
                            <p className="mt-3 text-sm text-[#4f6657] max-w-sm">
                                Your AI-powered cooking companion for smarter meal planning, better nutrition, and faster home cooking.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold uppercase tracking-wide text-[#1b5e20]">Explore</h4>
                            <div className="mt-3 space-y-2 text-sm">
                                <Link href="/kitchen" className="block text-[#4f6657] hover:text-[#1b5e20]">Kitchen</Link>
                                <Link href="/profile" className="block text-[#4f6657] hover:text-[#1b5e20]">Profile</Link>
                                <Link href="/favourites" className="block text-[#4f6657] hover:text-[#1b5e20]">Favourites</Link>
                                <Link href="/settings" className="block text-[#4f6657] hover:text-[#1b5e20]">Settings</Link>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold uppercase tracking-wide text-[#1b5e20]">Get Started</h4>
                            <div className="mt-3 space-y-2 text-sm">
                                <Link href="/signup" className="block text-[#4f6657] hover:text-[#1b5e20]">Create Account</Link>
                                <Link href="/login" className="block text-[#4f6657] hover:text-[#1b5e20]">Sign In</Link>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-[#dce8df] flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-sm text-[#5f7666]">&copy; {new Date().getFullYear()} Flavour AI. All rights reserved.</p>
                        <p className="text-xs text-[#6b8575]">Cook smarter · Eat better · Waste less</p>
                    </div>
                </div>
            </footer>
        </>
    )
}

export default Footer
