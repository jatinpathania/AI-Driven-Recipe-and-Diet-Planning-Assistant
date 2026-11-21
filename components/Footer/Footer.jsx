import React from 'react'
import Link from 'next/link'
import Loader from '../Loader/Loader'

const COLUMNS = [
    {
        title: 'Kitchen',
        links: [
            { href: '/kitchen', label: 'AI chef' },
            { href: '/kitchen/recipes', label: 'Recipes' },
            { href: '/kitchen/meal-plan', label: 'Meal plan' },
            { href: '/kitchen/favourites', label: 'Favourites' },
        ],
    },
    {
        title: 'Account',
        links: [
            { href: '/signup', label: 'Create account' },
            { href: '/login', label: 'Sign in' },
            { href: '/kitchen/settings', label: 'Settings' },
        ],
    },
]

const Footer = ({ loading = false }) => {
    return (
        <>
            {loading && <Loader />}
            <footer className="landing-footer">
                <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr] gap-8">
                        <div className="col-span-2 md:col-span-1">
                            <p className="text-2xl font-extrabold text-[#1b5e20] tracking-tight">
                                Flavour<span className="text-[#27ae60]">.</span>AI
                            </p>
                            <p className="mt-2 text-sm text-[#4f6657]">Cook smarter. Eat better. Waste less.</p>
                            <div className="mt-4 flex gap-1.5 text-xl" aria-hidden="true">
                                {['🥦', '🍋', '🥕', '🍅', '🥑'].map((e, i) => (
                                    <span key={e} className="footer-emoji" style={{ animationDelay: `${i * 0.18}s` }}>{e}</span>
                                ))}
                            </div>
                        </div>

                        {COLUMNS.map((col) => (
                            <nav key={col.title} aria-label={col.title}>
                                <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-[#1b5e20]">{col.title}</h4>
                                <ul className="mt-3 space-y-2 text-sm">
                                    {col.links.map((l) => (
                                        <li key={l.href}>
                                            <Link href={l.href} className="text-[#4f6657] hover:text-[#1b5e20] transition-colors">
                                                {l.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        ))}
                    </div>

                    <div className="mt-10 pt-6 border-t border-[#dce8df] text-sm text-[#5f7666]">
                        &copy; {new Date().getFullYear()} Flavour AI
                    </div>
                </div>
            </footer>
        </>
    )
}

export default Footer
