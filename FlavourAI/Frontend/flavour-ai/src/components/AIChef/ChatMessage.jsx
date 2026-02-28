"use client"

import React from 'react'
import { Sparkles, Play, CalendarPlus, Bookmark } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

const ChatMessage = ({ message }) => {
    const router = useRouter()
    const isAI = message.role === 'ai'

    const handleCook = (recipe) => {
        const data = { id: Date.now().toString(), ...recipe }
        const saved = JSON.parse(localStorage.getItem('flavourai_recipes') || '[]')
        if (!saved.some(r => r.name === data.name)) {
            localStorage.setItem('flavourai_recipes', JSON.stringify([data, ...saved]))
        }
        localStorage.setItem('flavourai_cooking_recipe', JSON.stringify(data))
        router.push('/kitchen/cook')
    }

    const handlePlan = (recipe) => {
        localStorage.setItem('flavourai_add_to_meal', JSON.stringify({
            name: recipe.name, emoji: recipe.emoji,
            calories: recipe.calories, time: recipe.time,
            category: recipe.category || 'dinner',
        }))
        router.push('/kitchen/meal-plan')
    }

    const handleSave = (recipe) => {
        const data = { id: Date.now().toString(), ...recipe }
        const saved = JSON.parse(localStorage.getItem('flavourai_recipes') || '[]')
        if (!saved.some(r => r.name === data.name)) {
            localStorage.setItem('flavourai_recipes', JSON.stringify([data, ...saved]))
        }
    }

    const formatContent = (text) => {
        if (!text) return null
        return text.split('\n').map((line, i) => {
            const formatted = line
                .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-800 dark:text-gray-100">$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/`(.+?)`/g, '<code class="bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded text-[13px] font-mono">$1</code>')

            if (line.startsWith('- ') || line.startsWith('• ')) {
                return <li key={i} className="ml-4 list-disc text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-•]\s/, '') }} />
            }
            if (/^\d+\.\s/.test(line)) {
                return <li key={i} className="ml-4 list-decimal text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+\.\s/, '') }} />
            }
            return <p key={i} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatted }} />
        })
    }

    if (!isAI) {
        return (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex justify-end">
                <div className="bg-emerald-500 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-md max-w-[80%] shadow-sm">
                    {message.content}
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0 space-y-3">
                <div className="bg-white/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl rounded-tl-md px-4 py-3 backdrop-blur-md max-w-[90%]">
                    <div className="space-y-1">
                        {formatContent(message.content)}
                    </div>
                </div>

                {message.recipeCards?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {message.recipeCards.map((recipe, i) => (
                            <div key={i} className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl p-3 w-full sm:w-[calc(50%-4px)] backdrop-blur-sm hover:border-emerald-400/30 transition-all group">
                                <div className="flex items-start gap-2.5 mb-2.5">
                                    <span className="text-2xl">{recipe.emoji || '🍽️'}</span>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{recipe.name}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[11px] text-gray-400 dark:text-gray-500">{typeof recipe.time === 'number' ? recipe.time + ' min' : recipe.time}</span>
                                            <span className="text-gray-300 dark:text-gray-700">·</span>
                                            <span className="text-[11px] text-gray-400 dark:text-gray-500">{recipe.calories} kcal</span>
                                            {recipe.difficulty && (
                                                <>
                                                    <span className="text-gray-300 dark:text-gray-700">·</span>
                                                    <span className="text-[11px] text-emerald-500">{recipe.difficulty}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1.5">
                                    <button onClick={() => handleCook(recipe)}
                                        className="flex-1 flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-medium py-1.5 rounded-lg transition-colors">
                                        <Play className="w-3 h-3" /> Cook
                                    </button>
                                    <button onClick={() => handlePlan(recipe)}
                                        className="flex-1 flex items-center justify-center gap-1 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-gray-600 dark:text-gray-400 text-[11px] font-medium py-1.5 rounded-lg transition-colors">
                                        <CalendarPlus className="w-3 h-3" /> Plan
                                    </button>
                                    <button onClick={() => handleSave(recipe)}
                                        className="p-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-gray-400 dark:text-gray-500 hover:text-emerald-500 transition-colors">
                                        <Bookmark className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    )
}

export default ChatMessage
