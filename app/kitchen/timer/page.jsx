"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, Plus, X, Play, Pause, RotateCcw, Trash2, Loader2 } from 'lucide-react'

const PRESETS = [
    { label: 'Soft Boiled Egg', emoji: '🥚', minutes: 6 },
    { label: 'Pasta Al Dente', emoji: '🍝', minutes: 10 },
    { label: 'Rice', emoji: '🍚', minutes: 18 },
    { label: 'Steak Medium', emoji: '🥩', minutes: 8 },
    { label: 'Bread Bake', emoji: '🍞', minutes: 35 },
    { label: 'Tea Steep', emoji: '🍵', minutes: 4 },
    { label: 'Quick Sauté', emoji: '🍳', minutes: 5 },
    { label: 'Slow Simmer', emoji: '🫕', minutes: 45 },
]

const TimerPage = () => {
    const [timers, setTimers] = useState([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [customMinutes, setCustomMinutes] = useState('')
    const [customLabel, setCustomLabel] = useState('')
    const intervalsRef = useRef({})

    useEffect(() => {
        return () => {
            Object.values(intervalsRef.current).forEach(clearInterval)
        }
    }, [])

    const addTimer = (label, emoji, minutes) => {
        const id = Date.now()
        setTimers(prev => [...prev, { id, label, emoji, totalSeconds: minutes * 60, remaining: minutes * 60, isRunning: false, isDone: false }])
    }

    const startTimer = (id) => {
        setTimers(prev => prev.map(t => t.id === id ? { ...t, isRunning: true } : t))
        intervalsRef.current[id] = setInterval(() => {
            setTimers(prev => prev.map(t => {
                if (t.id !== id) return t
                if (t.remaining <= 1) {
                    clearInterval(intervalsRef.current[id])
                    try { new Audio('/notification.mp3').play() } catch {}
                    return { ...t, remaining: 0, isRunning: false, isDone: true }
                }
                return { ...t, remaining: t.remaining - 1 }
            }))
        }, 1000)
    }

    const pauseTimer = (id) => {
        clearInterval(intervalsRef.current[id])
        setTimers(prev => prev.map(t => t.id === id ? { ...t, isRunning: false } : t))
    }

    const resetTimer = (id) => {
        clearInterval(intervalsRef.current[id])
        setTimers(prev => prev.map(t => t.id === id ? { ...t, remaining: t.totalSeconds, isRunning: false, isDone: false } : t))
    }

    const deleteTimer = (id) => {
        clearInterval(intervalsRef.current[id])
        setTimers(prev => prev.filter(t => t.id !== id))
    }

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const getProgress = (timer) => timer.totalSeconds > 0 ? ((timer.totalSeconds - timer.remaining) / timer.totalSeconds) * 100 : 0

    const handleAddCustom = () => {
        const mins = parseInt(customMinutes)
        if (mins > 0) {
            addTimer(customLabel || `${mins} min timer`, '⏱️', mins)
            setCustomMinutes('')
            setCustomLabel('')
            setShowAddModal(false)
        }
    }

    return (
        <div className="flex flex-col h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 dark:from-[#0c1117] dark:via-[#0f1419] dark:to-[#0c1a14]" />
            <div className="absolute top-[-10%] left-[20%] w-[400px] h-[400px] bg-purple-200/12 dark:bg-purple-500/[0.02] rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[15%] w-[450px] h-[450px] bg-emerald-200/15 dark:bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="px-6 md:px-8 py-4 flex items-center justify-between flex-shrink-0 border-b border-black/[0.04] dark:border-white/[0.04]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 dark:shadow-purple-500/10">
                            <Timer className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Timers</h1>
                            <p className="text-[11px] text-gray-400 dark:text-gray-600">{timers.length > 0 ? `${timers.length} active` : 'No timers set'}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> New Timer
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="max-w-4xl mx-auto p-6">
                        {timers.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                                    <Timer className="w-7 h-7 text-gray-300 dark:text-gray-700" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">No Timers Running</h2>
                                <p className="text-sm text-gray-400 dark:text-gray-600 mb-6">Start a timer from these presets</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                                    {PRESETS.map((preset) => (
                                        <button key={preset.label} onClick={() => { addTimer(preset.label, preset.emoji, preset.minutes); }}
                                            className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 backdrop-blur-sm hover:border-emerald-400/30 transition-all group text-center">
                                            <span className="text-2xl block mb-1.5">{preset.emoji}</span>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{preset.label}</p>
                                            <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">{preset.minutes} min</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                    <AnimatePresence>
                                        {timers.map((timer) => (
                                            <motion.div key={timer.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                                className={`bg-white/70 dark:bg-white/[0.03] border rounded-2xl p-5 backdrop-blur-sm transition-all relative overflow-hidden ${timer.isDone ? 'border-red-400/40' : timer.isRunning ? 'border-emerald-400/30' : 'border-black/[0.06] dark:border-white/[0.06]'}`}>
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/[0.03] dark:bg-white/[0.03]">
                                                    <div className={`h-full transition-all ${timer.isDone ? 'bg-red-400' : 'bg-emerald-400'}`} style={{ width: `${getProgress(timer)}%` }} />
                                                </div>

                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl">{timer.emoji}</span>
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{timer.label}</h3>
                                                            <p className="text-[10px] text-gray-400 dark:text-gray-600">{formatTime(timer.totalSeconds)} total</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => deleteTimer(timer.id)}
                                                        className="p-1 hover:bg-red-500/10 rounded-lg transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5 text-gray-300 dark:text-gray-700 hover:text-red-400" />
                                                    </button>
                                                </div>

                                                <div className="text-center my-4">
                                                    <span className={`text-4xl font-bold font-mono ${timer.isDone ? 'text-red-400 animate-pulse' : timer.isRunning ? 'text-emerald-500' : 'text-gray-800 dark:text-gray-100'}`}>
                                                        {formatTime(timer.remaining)}
                                                    </span>
                                                    {timer.isDone && <p className="text-xs text-red-400 font-medium mt-1">Time&apos;s up!</p>}
                                                </div>

                                                <div className="flex justify-center gap-2">
                                                    {timer.isDone ? (
                                                        <button onClick={() => resetTimer(timer.id)}
                                                            className="flex items-center gap-1.5 px-4 py-2 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors">
                                                            <RotateCcw className="w-3.5 h-3.5" /> Reset
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => timer.isRunning ? pauseTimer(timer.id) : startTimer(timer.id)}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl text-sm font-medium text-emerald-600 dark:text-emerald-400 transition-colors">
                                                                {timer.isRunning ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Start</>}
                                                            </button>
                                                            <button onClick={() => resetTimer(timer.id)}
                                                                className="p-2 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors">
                                                                <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                <div className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 backdrop-blur-sm">
                                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-3">Quick Add</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {PRESETS.map((preset) => (
                                            <button key={preset.label} onClick={() => addTimer(preset.label, preset.emoji, preset.minutes)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-black/[0.03] dark:bg-white/[0.04] rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                                <span>{preset.emoji}</span> {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showAddModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white/90 dark:bg-[#0f1419]/95 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.06] rounded-2xl w-full max-w-md p-6 shadow-2xl">
                            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4">Custom Timer</h2>
                            <input type="text" placeholder="Timer label (optional)" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)}
                                className="w-full p-3 bg-white/50 dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.06] rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-400/40 mb-3 transition-colors" />
                            <input type="number" placeholder="Minutes" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                                className="w-full p-3 bg-white/50 dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.06] rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-400/40 mb-4 transition-colors" autoFocus />
                            <div className="flex gap-2.5">
                                <button onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 font-medium rounded-xl hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors text-sm">Cancel</button>
                                <button onClick={handleAddCustom} disabled={!customMinutes || parseInt(customMinutes) <= 0}
                                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl disabled:opacity-40 transition-colors text-sm">Start Timer</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default TimerPage
