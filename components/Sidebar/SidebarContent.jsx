import React from 'react'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import Image from 'next/image'

const SidebarContent = ({ mainNav, toolNav, isActive, NavLink, logoWordIndex, logoWords, avatar, initial, displayName, displaySubtitle, setIsOpen, handleLogout }) => (
    <div className="flex flex-col h-full relative overflow-hidden bg-gradient-to-b from-white/80 via-white/60 to-emerald-50/40 dark:from-[#0c1117] dark:via-[#0f1419] dark:to-[#0c1a14] border-r border-black/[0.06] dark:border-white/[0.04] backdrop-blur-2xl">
        <div className="absolute top-[-20%] left-[-30%] w-[200px] h-[200px] bg-emerald-200/20 dark:bg-emerald-500/[0.04] rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[180px] h-[180px] bg-blue-200/15 dark:bg-blue-500/[0.03] rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full">
            <div className="p-4 pb-3">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10">
                        <Image src="/icon.png" alt="Flavour" width={20} height={20} className="relative z-10" />
                        <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    </div>
                    <div className="leading-none">
                        <div className="flex items-baseline gap-0">
                            <span className="text-[15px] font-bold text-gray-800 dark:text-gray-100">Flavour</span>
                            <span className="text-[15px] font-bold text-emerald-500">.</span>
                        </div>
                        <div className="h-4 overflow-hidden">
                            <div className="transition-transform duration-500 ease-in-out" style={{ transform: `translateY(-${logoWordIndex * 16}px)` }}>
                                {logoWords.map((w, i) => (
                                    <p key={i} className="text-[10px] font-medium text-emerald-500/70 h-4 leading-4">{w}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            <nav className="flex-1 px-3 space-y-5 overflow-y-auto no-scrollbar">
                <div>
                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider px-3 mb-2">Main</p>
                    <div className="space-y-0.5">
                        {mainNav.map(item => <NavLink key={item.path} item={item} />)}
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider px-3 mb-2">Tools</p>
                    <div className="space-y-0.5">
                        {toolNav.map(item => <NavLink key={item.path} item={item} />)}
                    </div>
                </div>
            </nav>

            <div className="p-3 border-t border-black/[0.04] dark:border-white/[0.04]">
                <div className="flex items-center gap-3 group relative">
                    <Link href="/kitchen/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 flex-1 px-2 py-2 rounded-xl hover:bg-white/40 dark:hover:bg-white/[0.04] transition-all">
                        {avatar ? (
                            <Image src={avatar} alt={displayName} width={32} height={32} className="rounded-lg" />
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10">
                                {initial}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{displayName}</p>
                            <p className="text-[10px] text-emerald-500 font-medium">{displaySubtitle}</p>
                        </div>
                    </Link>
                    <button onClick={handleLogout}
                        className="p-2 rounded-lg opacity-70 hover:opacity-100 hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all cursor-pointer">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    </div>
)

export default SidebarContent
