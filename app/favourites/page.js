"use client"

import Link from "next/link"

export default function FavouritesPage() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h1 className="text-3xl font-bold mb-3">Favourites</h1>
            <p className="text-zinc-400 mb-8">All your saved and liked recipes will appear here.</p>
            <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center">
            <p className="text-zinc-300 font-medium">No favourite recipes yet</p>
            <p className="text-sm text-zinc-500 mt-2">Start exploring and save recipes you love.</p>
            </div>
            <Link href="/" className="inline-block mt-8 px-5 py-2.5 rounded-lg bg-[#1b5e20] text-white font-medium hover:bg-[#144318] transition-colors">
            Discover Recipes
            </Link>
        </div>
        </div>
    )
}
