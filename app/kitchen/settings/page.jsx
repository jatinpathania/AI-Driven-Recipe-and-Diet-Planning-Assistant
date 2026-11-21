"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, Target, Leaf, ChefHat, Ruler, Clock, Trash2, Keyboard, Download } from 'lucide-react'
import MobileMenuButton from '@/components/Layout/MobileMenuButton'
import ThemeSwitch from '@/components/ui/ThemeSwitch'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useKitchenTheme } from '@/context/KitchenThemeContext'
import { useKitchenData } from '@/context/KitchenDataContext'
import { useToast } from '@/components/ui/Toaster'
import { KEYS } from '@/lib/store/local'

const DIETS = [
    { id: 'none', label: 'No restriction', emoji: '🍽️' },
    { id: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
    { id: 'vegan', label: 'Vegan', emoji: '🌱' },
    { id: 'pescatarian', label: 'Pescatarian', emoji: '🐟' },
    { id: 'keto', label: 'Keto', emoji: '🥑' },
    { id: 'high-protein', label: 'High protein', emoji: '💪' },
]

const SKILLS = [
    { id: 'beginner', label: 'Beginner', hint: 'Extra detail in every step' },
    { id: 'intermediate', label: 'Intermediate', hint: 'Balanced instructions' },
    { id: 'confident', label: 'Confident', hint: 'Short, to the point' },
]

const ALLERGENS = ['Peanuts', 'Tree nuts', 'Dairy', 'Eggs', 'Gluten', 'Shellfish', 'Soy', 'Sesame']

const GOAL_PRESETS = [1500, 1800, 2000, 2200, 2500]

export default function SettingsPage() {
    const router = useRouter()
    const toast = useToast()
    const { theme, toggleTheme } = useKitchenTheme()
    const { settings, updateSettings, resetKitchen } = useKitchenData()
    const [confirmReset, setConfirmReset] = useState(false)

    const set = (patch, message) => {
        updateSettings(patch)
        if (message) toast(message, { type: 'success' })
    }

    const toggleAllergen = (item) => {
        const avoid = settings.avoid || []
        const next = avoid.includes(item) ? avoid.filter((a) => a !== item) : [...avoid, item]
        updateSettings({ avoid: next })
    }

    const exportData = () => {
        const payload = {}
        for (const [name, key] of Object.entries(KEYS)) {
            try {
                const raw = localStorage.getItem(key)
                if (raw !== null) payload[name] = JSON.parse(raw)
            } catch {
                // a value that isn't JSON (the calorie goal is a bare number) — keep the raw string
                payload[name] = localStorage.getItem(key)
            }
        }

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `flavour-ai-data-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
        toast('Your kitchen data has been downloaded', { type: 'success' })
    }

    const resetAll = () => {
        setConfirmReset(false)
        resetKitchen()
        toast('Kitchen data cleared', { type: 'info' })
        router.push('/kitchen')
    }

    return (
        <div className="flex flex-col h-dvh relative overflow-hidden w-full bg-[var(--bg-base)] text-[var(--text-main)]">
            <div className="relative z-10 flex flex-col h-full w-full">
                <header className="px-4 sm:px-6 md:px-10 py-4 sm:py-5 flex items-center justify-between flex-shrink-0 border-b border-[var(--border)] min-h-[64px] sm:min-h-[72px] gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <MobileMenuButton />
                        <div className="hidden xs:flex w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 items-center justify-center text-white shadow-lg shrink-0">
                            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg font-bold text-[var(--text-main)] truncate">Settings</h1>
                            <p className="text-[11px] text-[var(--text-muted)] truncate">Tune how Flavour.AI cooks with you</p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto overscroll-contain elegant-scrollbar py-6 sm:py-8 w-full">
                    <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 md:px-10 space-y-5">

                        <Section icon={Target} title="Daily calorie goal" hint="Used across the calorie tracker and your dashboard.">
                            <div className="flex flex-wrap gap-2">
                                {GOAL_PRESETS.map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => set({ dailyCalorieGoal: g }, `Goal set to ${g} kcal`)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${settings.dailyCalorieGoal === g
                                            ? 'bg-[#10B981] text-black'
                                            : 'bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                            }`}
                                    >
                                        {g}
                                    </button>
                                ))}
                                <label className="sr-only" htmlFor="custom-goal">Custom daily calorie goal</label>
                                <input
                                    id="custom-goal"
                                    type="number"
                                    min={800}
                                    max={6000}
                                    value={settings.dailyCalorieGoal}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value, 10)
                                        if (Number.isFinite(v)) updateSettings({ dailyCalorieGoal: v })
                                    }}
                                    className="w-24 rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-xs font-bold text-[var(--text-main)] outline-none focus:border-[#10B981]"
                                />
                            </div>
                        </Section>

                        <Section icon={Leaf} title="Diet" hint="The AI chef keeps this in mind when suggesting recipes.">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {DIETS.map((d) => (
                                    <button
                                        key={d.id}
                                        onClick={() => set({ diet: d.id })}
                                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all active:scale-[0.98] ${settings.diet === d.id
                                            ? 'border-[#10B981] bg-[#10B981]/10 text-[var(--text-main)]'
                                            : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--border-light)]'
                                            }`}
                                    >
                                        <span aria-hidden="true">{d.emoji}</span>
                                        <span className="truncate">{d.label}</span>
                                    </button>
                                ))}
                            </div>
                        </Section>

                        <Section icon={ChefHat} title="Cooking confidence" hint="Changes how much detail each step gives you.">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {SKILLS.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => set({ skill: s.id })}
                                        className={`rounded-xl border px-3 py-3 text-left transition-all active:scale-[0.98] ${settings.skill === s.id
                                            ? 'border-[#10B981] bg-[#10B981]/10'
                                            : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-light)]'
                                            }`}
                                    >
                                        <span className="block text-xs font-bold text-[var(--text-main)]">{s.label}</span>
                                        <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">{s.hint}</span>
                                    </button>
                                ))}
                            </div>
                        </Section>

                        <Section icon={Clock} title="Avoid these" hint="Ingredients to keep out of suggestions.">
                            <div className="flex flex-wrap gap-2">
                                {ALLERGENS.map((a) => {
                                    const on = (settings.avoid || []).includes(a)
                                    return (
                                        <button
                                            key={a}
                                            onClick={() => toggleAllergen(a)}
                                            aria-pressed={on}
                                            className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95 ${on
                                                ? 'border-rose-400/40 bg-rose-500/10 text-rose-300'
                                                : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                                }`}
                                        >
                                            {a}
                                        </button>
                                    )
                                })}
                            </div>
                        </Section>

                        <Section icon={Ruler} title="Units" hint="How quantities are shown in recipes.">
                            <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1">
                                {[{ id: 'metric', label: 'Metric (g, ml)' }, { id: 'imperial', label: 'Imperial (oz, cups)' }].map((u) => (
                                    <button
                                        key={u.id}
                                        onClick={() => set({ units: u.id })}
                                        className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${settings.units === u.id ? 'bg-[#10B981] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                            }`}
                                    >
                                        {u.label}
                                    </button>
                                ))}
                            </div>
                        </Section>

                        <Section icon={Settings} title="Appearance" hint="Light or dark, across the whole kitchen.">
                            <ThemeSwitch theme={theme} toggleTheme={toggleTheme} />
                        </Section>

                        <Section icon={Keyboard} title="Keyboard" hint="Shortcuts that work anywhere in the app.">
                            <div className="space-y-2">
                                {[
                                    ['Open command palette', ['⌘', 'K']],
                                    ['Close any dialog', ['Esc']],
                                    ['Move through results', ['↑', '↓']],
                                ].map(([label, keys]) => (
                                    <div key={label} className="flex items-center justify-between rounded-xl bg-[var(--bg-card)] px-3 py-2.5">
                                        <span className="text-xs text-[var(--text-muted)]">{label}</span>
                                        <span className="flex gap-1">
                                            {keys.map((k) => (
                                                <kbd key={k} className="rounded-md border border-[var(--border-light)] bg-[var(--bg-hover)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-main)]">
                                                    {k}
                                                </kbd>
                                            ))}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        <Section icon={Download} title="Your data" hint="Everything lives in this browser. Take it or wipe it.">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={exportData}
                                    className="flex items-center gap-1.5 rounded-xl bg-[var(--bg-hover)] px-4 py-2.5 text-xs font-bold text-[var(--text-main)] transition-colors hover:bg-[var(--border)]"
                                >
                                    <Download className="h-3.5 w-3.5" /> Export as JSON
                                </button>
                                <button
                                    onClick={() => setConfirmReset(true)}
                                    className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-rose-400 transition-colors hover:bg-rose-500/10"
                                >
                                    <Trash2 className="h-3.5 w-3.5" /> Clear kitchen data
                                </button>
                            </div>
                        </Section>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmReset}
                title="Clear all kitchen data?"
                message="This removes your recipes, favourites, shopping list, meal plan and calorie history from this browser. Your account itself is untouched. This cannot be undone."
                onConfirm={resetAll}
                onCancel={() => setConfirmReset(false)}
                confirmText="Yes, clear it"
                cancelText="Cancel"
                isDangerous
            />
        </div>
    )
}

function Section({ icon: Icon, title, hint, children }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="premium-card p-5"
        >
            <div className="mb-4 flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--brand-light)] text-[var(--brand)]">
                    <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                    <h2 className="text-sm font-bold text-[var(--text-main)]">{title}</h2>
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{hint}</p>
                </div>
            </div>
            {children}
        </motion.section>
    )
}
