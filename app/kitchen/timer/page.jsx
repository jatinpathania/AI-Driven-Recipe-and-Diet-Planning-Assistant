"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, Plus, X, Play, Pause, RotateCcw, Trash2, Loader2 } from 'lucide-react'

const PRESETS = [
    { label: 'Soft Boiled Egg', emoji: '🥚', minutes: 6 },
    { label: 'Pasta Al Dente', emoji: '🍝', minutes: 10 },
    { label: 'Rice', emoji: '🍚', minutes: 18 },
    { label: 'Baked Salmon', emoji: '🐟', minutes: 12 },
    { label: 'Bread Bake', emoji: '🍞', minutes: 35 },
    { label: 'Tea Steep', emoji: '🍵', minutes: 4 },
    { label: 'Stir Fry', emoji: '🍳', minutes: 5 },
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
        <div className="flex flex-col h-screen relative overflow-hidden w-full bg-[var(--bg-base)] text-[var(--text-main)]">
            <div className="relative z-10 flex flex-col h-full">
                {/* Unified Header */}
                <div className="px-6 md:px-10 py-5 flex items-center justify-between flex-shrink-0 border-b border-[#1A271E] min-h-[72px]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/10 shrink-0">
                            <Timer className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-[#F3F4F6]">Kitchen Timers</h1>
                            <p className="text-[11px] text-[#829A8B]">{timers.length > 0 ? `${timers.length} running active` : 'No active timers'}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1.5 bg-[#10B981] hover:bg-[#34D399] text-black px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] shadow-md shadow-emerald-500/10">
                        <Plus className="w-3.5 h-3.5" /> New Timer
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto elegant-scrollbar py-8 w-full">
                    <div className="max-w-4xl mx-auto px-6 md:px-10">
                    <div className="w-full">
                        {timers.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-[#111A14] border border-[#1A271E] flex items-center justify-center mx-auto mb-5 shadow-inner shadow-black/40">
                                    <Timer className="w-7 h-7 text-[#10B981] animate-pulse" />
                                </div>
                                <h2 className="text-base font-extrabold text-[#F3F4F6] mb-1">No Timers Running</h2>
                                <p className="text-xs text-[#829A8B] mb-8">Start a quick timer from these pre-configured chef presets</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
                                    {PRESETS.map((preset) => (
                                        <button key={preset.label} onClick={() => { addTimer(preset.label, preset.emoji, preset.minutes); }}
                                            className="premium-card premium-card-interactive p-5 text-center group active:scale-95 duration-200">
                                            <span className="text-3xl block mb-2 select-none group-hover:scale-110 transition-transform">{preset.emoji}</span>
                                            <p className="text-[13px] font-extrabold text-[#F3F4F6] truncate group-hover:text-[#10B981] transition-colors">{preset.label}</p>
                                            <p className="text-[10px] text-[#829A8B] font-extrabold mt-1 uppercase tracking-widest bg-[#1A271E]/50 px-2 py-0.5 rounded-md inline-block">{preset.minutes} min</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <AnimatePresence>
                                        {timers.map((timer) => (
                                            <motion.div key={timer.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                                className={`premium-card p-6 transition-all relative overflow-hidden flex flex-col justify-between ${
                                                    timer.isDone 
                                                        ? 'border-red-500/50 shadow-lg shadow-red-950/20' 
                                                        : timer.isRunning 
                                                            ? 'border-[#10B981]/50 shadow-lg shadow-emerald-950/20 ring-1 ring-[#10B981]/20' 
                                                            : ''
                                                }`}>
                                                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#1A271E]">
                                                    <div className={`h-full transition-all duration-300 ${timer.isDone ? 'bg-red-500' : 'bg-gradient-to-r from-[#10B981] to-emerald-400'}`} style={{ width: `${getProgress(timer)}%` }} />
                                                </div>

                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className="text-2xl select-none flex-shrink-0">{timer.emoji}</span>
                                                        <div className="min-w-0">
                                                            <h3 className="text-[13px] font-extrabold text-[#F3F4F6] truncate">{timer.label}</h3>
                                                            <p className="text-[9px] text-[#829A8B] font-extrabold uppercase tracking-widest mt-0.5">{formatTime(timer.totalSeconds)} total</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => deleteTimer(timer.id)}
                                                        className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0">
                                                        <Trash2 className="w-3.5 h-3.5 text-[#829A8B] hover:text-red-400" />
                                                    </button>
                                                </div>

                                                <div className="text-center my-5 select-none">
                                                    <span className={`text-4xl font-extrabold font-mono tracking-wider ${timer.isDone ? 'text-red-500 animate-pulse' : timer.isRunning ? 'text-[#10B981]' : 'text-[#F3F4F6]'}`}>
                                                        {formatTime(timer.remaining)}
                                                    </span>
                                                    {timer.isDone && <p className="text-[10px] text-red-400 font-extrabold mt-1.5 uppercase tracking-widest animate-pulse">Time&apos;s up!</p>}
                                                </div>

                                                <div className="flex justify-center gap-2 mt-2">
                                                    {timer.isDone ? (
                                                        <button onClick={() => resetTimer(timer.id)}
                                                            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1A271E] rounded-xl text-xs font-extrabold text-[#829A8B] hover:text-white hover:bg-[#24362A] transition-all active:scale-[0.97] uppercase tracking-wider w-full justify-center">
                                                            <RotateCcw className="w-3.5 h-3.5" /> Restart
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => timer.isRunning ? pauseTimer(timer.id) : startTimer(timer.id)}
                                                                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all active:scale-[0.97] uppercase tracking-wider flex-1 justify-center ${timer.isRunning ? 'bg-[rgba(16,185,129,0.1)] text-[#10B981] hover:bg-[rgba(16,185,129,0.2)] hover:border-[#10B981]/30 border border-transparent' : 'bg-[#10B981] text-black hover:bg-[#34D399]'}`}>
                                                                {timer.isRunning ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5 fill-black stroke-none" /> Start</>}
                                                            </button>
                                                            <button onClick={() => resetTimer(timer.id)}
                                                                className="p-2.5 bg-[#1A271E] rounded-xl hover:bg-[#24362A] hover:text-white text-[#829A8B] transition-all active:scale-[0.97]">
                                                                <RotateCcw className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                <div className="premium-card p-6">
                                    <h3 className="text-xs font-bold text-[#829A8B] uppercase tracking-wider mb-4 pb-2 border-b border-[#1A271E]/50">Quick Preset Boost</h3>
                                    <div className="flex flex-wrap gap-2.5">
                                        {PRESETS.map((preset) => (
                                            <button key={preset.label} onClick={() => addTimer(preset.label, preset.emoji, preset.minutes)}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-[#1A271E]/40 border border-[#1A271E] rounded-xl text-[11px] text-[#F3F4F6] font-extrabold hover:text-[#10B981] hover:border-[#10B981]/40 transition-colors active:scale-95 duration-150">
                                                <span className="select-none">{preset.emoji}</span> <span>{preset.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showAddModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0B120E] border border-[#24362A] rounded-2xl w-full max-w-md p-6 shadow-2xl">
                            <h2 className="text-base font-bold text-[#F3F4F6] mb-4">Custom Timer</h2>
                            <input type="text" placeholder="Timer label (optional)" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)}
                                className="w-full p-3 bg-[#111A14] border border-[#1A271E] rounded-xl text-sm text-[#F3F4F6] placeholder-[#829A8B] outline-none focus:border-[#10B981] mb-3 transition-colors" />
                            <input type="number" placeholder="Minutes" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                                className="w-full p-3 bg-[#111A14] border border-[#1A271E] rounded-xl text-sm text-[#F3F4F6] placeholder-[#829A8B] outline-none focus:border-[#10B981] mb-4 transition-colors" autoFocus />
                            <div className="flex gap-2.5">
                                <button onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2.5 bg-[#1A271E] text-[#F3F4F6] font-bold rounded-xl hover:bg-[#24362A] transition-colors text-sm">Cancel</button>
                                <button onClick={handleAddCustom} disabled={!customMinutes || parseInt(customMinutes) <= 0}
                                    className="flex-1 py-2.5 bg-[#10B981] hover:bg-[#34D399] text-black font-bold rounded-xl disabled:opacity-40 transition-colors text-sm">Start Timer</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default TimerPage
