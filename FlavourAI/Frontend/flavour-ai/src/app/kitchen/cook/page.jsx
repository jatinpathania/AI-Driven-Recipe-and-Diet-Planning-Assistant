"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Clock, ArrowLeft, ArrowRight, Check, Play, Pause, RotateCcw, Utensils, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const CookPage = () => {
    const router = useRouter()
    const [recipe, setRecipe] = useState(null)
    const [currentStep, setCurrentStep] = useState(0)
    const [completedSteps, setCompletedSteps] = useState(new Set())
    const [timerSeconds, setTimerSeconds] = useState(0)
    const [timerRunning, setTimerRunning] = useState(false)
    const [timerTarget, setTimerTarget] = useState(0)
    const [cookingStarted, setCookingStarted] = useState(false)
    const [cookingFinished, setCookingFinished] = useState(false)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [elapsedRunning, setElapsedRunning] = useState(false)
    const timerRef = useRef(null)
    const elapsedRef = useRef(null)

    useEffect(() => {
        const saved = localStorage.getItem('flavourai_cooking_recipe')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                if (!parsed.steps || !Array.isArray(parsed.steps)) {
                    parsed.steps = parsed.instructions ? (Array.isArray(parsed.instructions) ? parsed.instructions : parsed.instructions.split('\n').filter(s => s.trim())) : ['Follow the recipe instructions']
                }
                if (!parsed.ingredients || !Array.isArray(parsed.ingredients)) {
                    parsed.ingredients = ['Ingredients as per recipe']
                }
                setRecipe(parsed)
            } catch {}
        }
    }, [])

    useEffect(() => {
        if (timerRunning && timerTarget > 0) {
            timerRef.current = setInterval(() => {
                setTimerSeconds(prev => {
                    if (prev >= timerTarget) {
                        clearInterval(timerRef.current)
                        setTimerRunning(false)
                        try { new Audio('/notification.mp3').play() } catch {}
                        return timerTarget
                    }
                    return prev + 1
                })
            }, 1000)
        }
        return () => clearInterval(timerRef.current)
    }, [timerRunning, timerTarget])

    useEffect(() => {
        if (elapsedRunning) {
            elapsedRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000)
        }
        return () => clearInterval(elapsedRef.current)
    }, [elapsedRunning])

    const startCooking = () => {
        setCookingStarted(true)
        setElapsedRunning(true)
    }

    const toggleStepComplete = (index) => {
        const updated = new Set(completedSteps)
        if (updated.has(index)) updated.delete(index)
        else updated.add(index)
        setCompletedSteps(updated)
    }

    const nextStep = () => {
        if (recipe && currentStep < recipe.steps.length - 1) setCurrentStep(prev => prev + 1)
    }

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1)
    }

    const finishCooking = () => {
        setElapsedRunning(false)
        setCookingFinished(true)
    }

    const setQuickTimer = (minutes) => {
        setTimerTarget(minutes * 60)
        setTimerSeconds(0)
        setTimerRunning(true)
    }

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const timerProgress = timerTarget > 0 ? (timerSeconds / timerTarget) * 100 : 0
    const circumference = 2 * Math.PI * 54

    if (!recipe) {
        return (
            <div className="flex flex-col h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 dark:from-[#0c1117] dark:via-[#0f1419] dark:to-[#0c1a14]" />
                <div className="relative z-10 flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                            <Utensils className="w-7 h-7 text-gray-300 dark:text-gray-700" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">No Recipe Selected</h2>
                        <p className="text-sm text-gray-400 dark:text-gray-600 mb-4">Pick a recipe to start cooking</p>
                        <Link href="/kitchen/recipes" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
                            Browse Recipes
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    if (cookingFinished) {
        return (
            <div className="flex flex-col h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 dark:from-[#0c1117] dark:via-[#0f1419] dark:to-[#0c1a14]" />
                <div className="absolute top-[20%] left-[30%] w-[300px] h-[300px] bg-emerald-200/20 dark:bg-emerald-500/[0.04] rounded-full blur-[100px] pointer-events-none" />
                <div className="relative z-10 flex-1 flex items-center justify-center">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Cooking Complete!</h2>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mb-1">{recipe.name || recipe.title}</p>
                        <p className="text-emerald-500 font-semibold text-lg mb-6">Total time: {formatTime(elapsedTime)}</p>
                        <div className="flex gap-3 justify-center">
                            <Link href="/kitchen" className="px-5 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors">Back to Kitchen</Link>
                            <Link href="/kitchen/recipes" className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">More Recipes</Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 dark:from-[#0c1117] dark:via-[#0f1419] dark:to-[#0c1a14]" />
            <div className="absolute top-[-10%] right-[15%] w-[400px] h-[400px] bg-orange-200/12 dark:bg-orange-500/[0.02] rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[20%] w-[350px] h-[350px] bg-emerald-200/15 dark:bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="px-6 md:px-8 py-4 flex items-center justify-between flex-shrink-0 border-b border-black/[0.04] dark:border-white/[0.04]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20 dark:shadow-orange-500/10">
                            <ChefHat className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate max-w-[200px]">{recipe.name || recipe.title || 'Cooking'}</h1>
                            <p className="text-[11px] text-gray-400 dark:text-gray-600">{cookingStarted ? `Step ${currentStep + 1} of ${recipe.steps.length} · ${formatTime(elapsedTime)}` : `${recipe.steps.length} steps`}</p>
                        </div>
                    </div>
                    {cookingStarted && (
                        <button onClick={finishCooking} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
                            Finish
                        </button>
                    )}
                </div>

                {!cookingStarted ? (
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="max-w-3xl mx-auto p-6 space-y-4">
                            <div className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm">
                                <div className="text-center mb-4">
                                    <span className="text-4xl">{recipe.emoji || '🍳'}</span>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-3">{recipe.name || recipe.title}</h2>
                                    {(recipe.cookTime || recipe.time) && (
                                        <div className="flex items-center justify-center gap-1 mt-1.5 text-gray-400 dark:text-gray-600 text-xs">
                                            <Clock className="w-3 h-3" />
                                            <span>{recipe.cookTime || recipe.time}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Ingredients</h3>
                                <div className="space-y-1.5">
                                    {recipe.ingredients.map((ing, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                                            <span>{typeof ing === 'string' ? ing : ing.name || ing.item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Steps Overview</h3>
                                <div className="space-y-2">
                                    {recipe.steps.map((step, i) => (
                                        <div key={i} className="flex gap-3 items-start p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02]">
                                            <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{typeof step === 'string' ? step : step.instruction || step.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button onClick={startCooking}
                                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl transition-colors shadow-sm text-base flex items-center justify-center gap-2">
                                <Play className="w-5 h-5" /> Start Cooking
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="max-w-4xl mx-auto p-6">
                            <div className="w-full bg-black/[0.04] dark:bg-white/[0.04] rounded-full h-1.5 mb-6">
                                <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${((completedSteps.size) / recipe.steps.length) * 100}%` }} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2 space-y-4">
                                    <motion.div key={currentStep} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                        className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">{currentStep + 1}</span>
                                            <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-600 font-medium">Current Step</span>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-[15px]">{typeof recipe.steps[currentStep] === 'string' ? recipe.steps[currentStep] : recipe.steps[currentStep]?.instruction || recipe.steps[currentStep]?.text}</p>
                                        <div className="flex items-center justify-between mt-5">
                                            <button onClick={prevStep} disabled={currentStep === 0}
                                                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 transition-colors">
                                                <ArrowLeft className="w-4 h-4" /> Previous
                                            </button>
                                            <button onClick={() => toggleStepComplete(currentStep)}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${completedSteps.has(currentStep) ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'}`}>
                                                <Check className="w-3.5 h-3.5" /> {completedSteps.has(currentStep) ? 'Done' : 'Mark Done'}
                                            </button>
                                            <button onClick={nextStep} disabled={currentStep === recipe.steps.length - 1}
                                                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 transition-colors">
                                                Next <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>

                                    <div className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 backdrop-blur-sm">
                                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-2">All Steps</h3>
                                        <div className="space-y-1">
                                            {recipe.steps.map((step, i) => (
                                                <button key={i} onClick={() => setCurrentStep(i)}
                                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm transition-all ${currentStep === i ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : completedSteps.has(i) ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'}`}>
                                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${completedSteps.has(i) ? 'bg-emerald-500 text-white' : currentStep === i ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-black/[0.04] dark:bg-white/[0.06] text-gray-400'}`}>{completedSteps.has(i) ? <Check className="w-3 h-3" /> : i + 1}</span>
                                                    <span className={`truncate ${completedSteps.has(i) ? 'line-through' : ''}`}>{typeof step === 'string' ? step : step.instruction || step.text}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm text-center">
                                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-4">Timer</h3>
                                        <div className="relative w-32 h-32 mx-auto mb-4">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="64" cy="64" r="54" fill="none" strokeWidth="6" className="stroke-black/[0.04] dark:stroke-white/[0.04]" />
                                                <circle cx="64" cy="64" r="54" fill="none" strokeWidth="6" strokeLinecap="round"
                                                    className={timerSeconds >= timerTarget && timerTarget > 0 ? 'stroke-red-400' : 'stroke-emerald-400'}
                                                    strokeDasharray={circumference} strokeDashoffset={circumference - (timerProgress / 100) * circumference} />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className={`text-2xl font-bold font-mono ${timerSeconds >= timerTarget && timerTarget > 0 ? 'text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>{formatTime(timerTarget > 0 ? timerTarget - timerSeconds : 0)}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-center gap-2 mb-3">
                                            <button onClick={() => setTimerRunning(!timerRunning)} disabled={timerTarget === 0}
                                                className="w-9 h-9 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center transition-colors disabled:opacity-30">
                                                {timerRunning ? <Pause className="w-4 h-4 text-emerald-500" /> : <Play className="w-4 h-4 text-emerald-500" />}
                                            </button>
                                            <button onClick={() => { setTimerSeconds(0); setTimerRunning(false) }}
                                                className="w-9 h-9 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors">
                                                <RotateCcw className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-1.5">
                                            {[1, 2, 3, 5, 10, 15].map(min => (
                                                <button key={min} onClick={() => setQuickTimer(min)}
                                                    className="px-2.5 py-1 text-[11px] bg-black/[0.03] dark:bg-white/[0.04] rounded-lg text-gray-500 dark:text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">{min}m</button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 backdrop-blur-sm">
                                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-2">Ingredients</h3>
                                        <div className="space-y-1">
                                            {recipe.ingredients.map((ing, i) => (
                                                <div key={i} className="flex items-center gap-1.5 text-[13px] text-gray-600 dark:text-gray-400">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                                                    {typeof ing === 'string' ? ing : ing.name || ing.item}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CookPage
