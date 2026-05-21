"use client"

import React from 'react'
import { Sparkles, Play, CalendarPlus, Bookmark, Clock, Flame } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

const parseRecipeText = (text) => {
    if (!text) return null;
    
    // Quick checks to ensure it looks like a structured recipe output
    const hasIngredients = /ingredients/i.test(text);
    const hasSteps = /steps/i.test(text) || /1\.\s/i.test(text);
    if (!hasIngredients || !hasSteps) return null;

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 3) return null;

    let title = "";
    let stats = "";
    let ingredients = [];
    let steps = [];
    let currentSection = "";
    let intro = "";

    // Let's parse line by line
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();

        if (lowerLine.startsWith('ingredients:')) {
            currentSection = "ingredients";
            continue;
        } else if (lowerLine.startsWith('steps:')) {
            currentSection = "steps";
            continue;
        }

        if (currentSection === "") {
            if (!title) {
                title = line.replace(/^\*\*|^\*|\*\*$|\*$/g, '').trim();
            } else if (!stats && (line.includes('|') || line.includes('kcal') || line.includes('cal') || line.includes('min') || /\b\d+\b/.test(line))) {
                stats = line;
            } else {
                intro = (intro ? intro + " " : "") + line;
            }
        } else if (currentSection === "ingredients") {
            if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
                ingredients.push(line.replace(/^[-•*]\s*/, '').trim());
            } else if (/^\d+\.\s/.test(line)) {
                ingredients.push(line.replace(/^\d+\.\s*/, '').trim());
            } else {
                ingredients.push(line);
            }
        } else if (currentSection === "steps") {
            if (/^\d+\.\s/.test(line)) {
                steps.push(line.replace(/^\d+\.\s*/, '').trim());
            } else if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
                steps.push(line.replace(/^[-•*]\s*/, '').trim());
            } else {
                steps.push(line);
            }
        }
    }

    if (!title || ingredients.length === 0 || steps.length === 0) return null;

    return {
        title,
        stats,
        ingredients,
        steps,
        intro
    };
};

const ChatMessage = ({ message, userInitial = 'C' }) => {
    const router = useRouter()
    const isAI = message.role === 'ai' || message.role === 'assistant'

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
                .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[#10B981]">$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/`(.+?)`/g, '<code class="bg-[#1A271E] px-1.5 py-0.5 rounded text-[13px] font-mono text-[#34D399]">$1</code>')

            if (line.startsWith('- ') || line.startsWith('• ')) {
                return <li key={i} className="ml-4 list-disc text-sm text-gray-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-•]\s/, '') }} />
            }
            if (/^\d+\.\s/.test(line)) {
                return <li key={i} className="ml-4 list-decimal text-sm text-gray-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+\.\s/, '') }} />
            }
            if (line.trim() === '') return <br key={i} />
            return <p key={i} className="text-sm text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatted }} />
        })
    }

    if (!isAI) {
        return (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex justify-end gap-4 mb-6">
                <div className="bg-[#10B981] text-[#070B09] font-semibold text-sm px-5 py-3 rounded-2xl rounded-tr-sm ml-auto max-w-[500px] shadow-sm leading-relaxed">
                    {message.content}
                </div>
                <div className="w-8 h-8 rounded-full bg-[#10B981] text-[#070B09] flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {userInitial}
                </div>
            </motion.div>
        )
    }

    const parsedRecipe = parseRecipeText(message.content);

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 mb-6">
            <div className="w-8 h-8 rounded-full bg-[rgba(16,185,129,0.1)] text-[#10B981] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="w-4 h-4 text-[#10B981]" />
            </div>
            <div className="flex-1 min-w-0 space-y-3 max-w-[700px]">
                {parsedRecipe ? (
                    <div className="bg-[#111A14] border border-[#1A271E] rounded-[0_16px_16px_16px] p-5 shadow-md space-y-4">
                        <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🍳</span>
                                    <h3 className="font-bold text-gray-100 text-sm md:text-base leading-snug">
                                        {parsedRecipe.title}
                                    </h3>
                                </div>
                                {parsedRecipe.stats && (
                                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                                        {parsedRecipe.stats.split('|').map((stat, idx) => {
                                            const val = stat.trim();
                                            let label = val;
                                            if (idx === 0 && !val.toLowerCase().includes('kcal') && !val.toLowerCase().includes('cal')) label += ' kcal';
                                            if (idx === 1 && !val.toLowerCase().includes('g') && !val.toLowerCase().includes('protein')) label += ' protein';
                                            return (
                                                <span key={idx} className="px-2.5 py-0.5 bg-[rgba(16,185,129,0.1)] text-[#10B981] rounded-md text-[10px] font-bold border border-[#10B981]/15">
                                                    {label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {parsedRecipe.intro && (
                            <p className="text-xs text-[#829A8B] leading-relaxed italic">
                                {parsedRecipe.intro}
                            </p>
                        )}

                        <div className="space-y-2 border-t border-[#1A271E] pt-3">
                            <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-[#829A8B]">Ingredients</h4>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {parsedRecipe.ingredients.map((ing, idx) => (
                                    <li key={idx} className="flex items-center gap-1.5 text-xs text-gray-300">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] flex-shrink-0" />
                                        <span className="truncate">{ing}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-2.5 border-t border-[#1A271E] pt-3">
                            <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-[#829A8B]">Steps</h4>
                            <div className="space-y-2">
                                {parsedRecipe.steps.map((step, idx) => (
                                    <div key={idx} className="flex gap-2.5 items-start text-xs text-gray-300">
                                        <span className="w-4 h-4 rounded-full bg-[#10B981] text-[#070B09] flex items-center justify-center text-[9px] font-bold mt-0.5 flex-shrink-0">
                                            {idx + 1}
                                        </span>
                                        <p className="leading-relaxed">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 border-t border-[#1A271E] pt-3">
                            <button onClick={() => handleCook({
                                    name: parsedRecipe.title,
                                    emoji: '🍳',
                                    time: parsedRecipe.stats ? (parsedRecipe.stats.split('|')[2] || '10m').trim() : '10m',
                                    calories: parsedRecipe.stats ? parseInt(parsedRecipe.stats.split('|')[0]) || 200 : 200,
                                    protein: parsedRecipe.stats ? (parsedRecipe.stats.split('|')[1] || '4g').trim() : '4g',
                                    ingredients: parsedRecipe.ingredients,
                                    steps: parsedRecipe.steps
                                })}
                                className="flex-1 flex items-center justify-center gap-1 bg-[#10B981] hover:bg-[#34D399] text-black text-xs font-semibold py-2 rounded-xl transition-all shadow-sm">
                                <Play className="w-3.5 h-3.5 fill-current" /> Start Cooking
                            </button>
                            <button onClick={() => handlePlan({
                                    name: parsedRecipe.title,
                                    emoji: '🍳',
                                    calories: parsedRecipe.stats ? parseInt(parsedRecipe.stats.split('|')[0]) || 200 : 200,
                                    time: parsedRecipe.stats ? (parsedRecipe.stats.split('|')[2] || '10m').trim() : '10m',
                                    category: 'dinner'
                                })}
                                className="flex-1 flex items-center justify-center gap-1 bg-[#1A271E] hover:bg-[#24362A] text-gray-200 text-xs font-semibold py-2 rounded-xl transition-all">
                                <CalendarPlus className="w-3.5 h-3.5" /> Plan Meal
                            </button>
                            <button onClick={() => handleSave({
                                    name: parsedRecipe.title,
                                    emoji: '🍳',
                                    time: parsedRecipe.stats ? (parsedRecipe.stats.split('|')[2] || '10m').trim() : '10m',
                                    calories: parsedRecipe.stats ? parseInt(parsedRecipe.stats.split('|')[0]) || 200 : 200,
                                    protein: parsedRecipe.stats ? (parsedRecipe.stats.split('|')[1] || '4g').trim() : '4g',
                                    ingredients: parsedRecipe.ingredients,
                                    steps: parsedRecipe.steps
                                })}
                                className="px-3 rounded-xl bg-[#1A271E] hover:bg-[#24362A] text-gray-400 hover:text-[#10B981] transition-colors flex items-center justify-center">
                                <Bookmark className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#111A14] border border-[#1A271E] rounded-[0_16px_16px_16px] px-5 py-4 shadow-sm">
                        <div className="space-y-1">
                            {formatContent(message.content)}
                        </div>
                    </div>
                )}

                {message.recipeCards?.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {message.recipeCards.map((recipe, i) => (
                            <div key={i} className="bg-[#111A14] border border-[#1A271E] rounded-xl p-3 w-full sm:w-[calc(50%-4px)] hover:border-[#24362A] transition-all group">
                                <div className="flex items-start gap-2.5 mb-2.5">
                                    <span className="text-2xl">{recipe.emoji || '🍽️'}</span>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-gray-100 truncate group-hover:text-[#10B981] transition-colors">{recipe.name}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[11px] text-[#829A8B]">{typeof recipe.time === 'number' ? recipe.time + ' min' : recipe.time}</span>
                                            <span className="text-gray-600">·</span>
                                            <span className="text-[11px] text-[#829A8B]">{recipe.calories} kcal</span>
                                            <span className="text-gray-600">·</span>
                                            <span className="text-[11px] text-[#829A8B]">{recipe.protein || `${Math.round((parseInt(recipe.calories) || 350) * 0.05)}g protein`}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1.5">
                                    <button onClick={() => handleCook(recipe)}
                                        className="flex-1 flex items-center justify-center gap-1 bg-[#10B981] hover:bg-[#34D399] text-black text-[11px] font-medium py-1.5 rounded-lg transition-colors">
                                        <Play className="w-3 h-3 fill-current" /> Cook
                                    </button>
                                    <button onClick={() => handlePlan(recipe)}
                                        className="flex-1 flex items-center justify-center gap-1 bg-[#1A271E] hover:bg-[#24362A] text-gray-300 text-[11px] font-medium py-1.5 rounded-lg transition-colors">
                                        <CalendarPlus className="w-3 h-3" /> Plan
                                    </button>
                                    <button onClick={() => handleSave(recipe)}
                                        className="p-1.5 rounded-lg bg-[#1A271E] hover:bg-[#24362A] text-gray-400 hover:text-[#10B981] transition-colors">
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
