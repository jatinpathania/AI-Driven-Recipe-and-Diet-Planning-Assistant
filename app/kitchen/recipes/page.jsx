"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Clock, Flame, Trash2, X, Loader2, Sparkles, Play, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useGuestUser } from '@/context/GuestUserContext'
import { generateRecipe as generateRecipeFromIngredients } from '@/utils/api'

const RecipesPage = () => {
    const { userId, isGuest } = useGuestUser()
    const router = useRouter()
    const [recipes, setRecipes] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [showGenerateModal, setShowGenerateModal] = useState(false)
    const [ingredientInput, setIngredientInput] = useState('')
    const [generatedRecipe, setGeneratedRecipe] = useState(null)
    const [activeFilter, setActiveFilter] = useState('all')

    const sampleRecipes = [
        { id: '1', name: 'Pasta Carbonara', emoji: '🍝', time: '25 min', calories: 450, difficulty: 'Medium', description: 'Creamy Italian classic with eggs, cheese, pancetta, and pepper.', ingredients: ['Spaghetti', 'Eggs', 'Pecorino Romano', 'Pancetta', 'Black Pepper'], category: 'dinner' },
        { id: '2', name: 'Avocado Toast', emoji: '🥑', time: '10 min', calories: 280, difficulty: 'Easy', description: 'Trendy breakfast with creamy avocado on crispy sourdough.', ingredients: ['Sourdough Bread', 'Avocado', 'Lemon', 'Red Pepper Flakes', 'Salt'], category: 'breakfast' },
        { id: '3', name: 'Chicken Stir Fry', emoji: '🍜', time: '20 min', calories: 380, difficulty: 'Easy', description: 'Quick Asian-inspired stir fry with colorful vegetables.', ingredients: ['Chicken Breast', 'Bell Peppers', 'Soy Sauce', 'Ginger', 'Garlic'], category: 'dinner' },
        { id: '4', name: 'Greek Salad', emoji: '🥗', time: '15 min', calories: 220, difficulty: 'Easy', description: 'Fresh Mediterranean salad with feta and olives.', ingredients: ['Cucumber', 'Tomatoes', 'Red Onion', 'Feta Cheese', 'Kalamata Olives'], category: 'lunch' },
        { id: '5', name: 'Banana Smoothie', emoji: '🍌', time: '5 min', calories: 190, difficulty: 'Easy', description: 'Creamy, protein-packed smoothie for any time of day.', ingredients: ['Banana', 'Greek Yogurt', 'Honey', 'Milk', 'Ice'], category: 'breakfast' },
        { id: '6', name: 'Beef Tacos', emoji: '🌮', time: '30 min', calories: 520, difficulty: 'Medium', description: 'Seasoned ground beef tacos with fresh toppings.', ingredients: ['Ground Beef', 'Taco Shells', 'Lettuce', 'Tomato', 'Sour Cream'], category: 'dinner' },
    ]

    useEffect(() => {
        const saved = localStorage.getItem('flavourai_recipes')
        if (saved) {
            setRecipes(JSON.parse(saved))
        } else {
            setRecipes(sampleRecipes)
            localStorage.setItem('flavourai_recipes', JSON.stringify(sampleRecipes))
        }
    }, [])

    const saveRecipes = (updated) => {
        setRecipes(updated)
        localStorage.setItem('flavourai_recipes', JSON.stringify(updated))
    }

    const handleGenerateRecipe = async () => {
        if (!ingredientInput.trim()) return
        setIsGenerating(true)
        setGeneratedRecipe(null)
        try {
            const response = await generateRecipeFromIngredients(ingredientInput)
            if (response.success && response.recipe) {
                setGeneratedRecipe({
                    id: Date.now().toString(),
                    name: response.recipe.recipeName || response.recipe.name,
                    emoji: response.recipe.emoji || '🍽️',
                    time: (response.recipe.time || 30) + ' min',
                    calories: response.recipe.calories || 0,
                    difficulty: response.recipe.difficulty || 'Medium',
                    description: response.recipe.description || '',
                    ingredients: response.recipe.ingredients || [],
                    instructions: response.recipe.instructions || [],
                    category: (response.recipe.tags && response.recipe.tags[0]?.toLowerCase()) || 'dinner'
                })
            }
        } catch (error) {
            console.error('Error generating recipe:', error)
        }
        setIsGenerating(false)
    }

    const addGeneratedRecipe = () => {
        if (generatedRecipe) {
            saveRecipes([generatedRecipe, ...recipes])
            setShowGenerateModal(false)
            setGeneratedRecipe(null)
            setIngredientInput('')
        }
    }

    const deleteRecipe = (id) => saveRecipes(recipes.filter(r => r.id !== id))

    const startCookingRecipe = (recipe) => {
        localStorage.setItem('flavourai_cooking_recipe', JSON.stringify(recipe))
        router.push('/kitchen/cook')
    }

    const filters = [
        { key: 'all', label: 'All' },
        { key: 'breakfast', label: '🌅 Breakfast' },
        { key: 'lunch', label: '☀️ Lunch' },
        { key: 'dinner', label: '🌙 Dinner' },
        { key: 'snack', label: '🍿 Snack' }
    ]

    const filtered = recipes.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.ingredients?.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()))
        const matchesFilter = activeFilter === 'all' || r.category === activeFilter
        return matchesSearch && matchesFilter
    })

    return (
        <div className="flex flex-col h-screen relative overflow-hidden w-full bg-[var(--bg-base)] text-[var(--text-main)]">
            <div className="relative z-10 flex flex-col h-full">
                {/* Unified Header */}
                <div className="px-6 md:px-10 py-5 flex items-center justify-between flex-shrink-0 border-b border-[#1A271E] min-h-[72px]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/10 shrink-0">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-[#F3F4F6]">Recipes</h1>
                            <p className="text-[11px] text-[#829A8B]">{recipes.length} in collection</p>
                        </div>
                    </div>
                    <button onClick={() => setShowGenerateModal(true)} className="flex items-center gap-1.5 bg-[#10B981] hover:bg-[#34D399] text-black px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] shadow-md shadow-emerald-500/10">
                        <Sparkles className="w-3.5 h-3.5" /> AI Generate
                    </button>
                </div>

                <div className="px-6 md:px-10 py-4 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#829A8B]" />
                            <input type="text" placeholder="Search recipes or ingredients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#111A14] border border-[#1A271E] text-sm text-[#F3F4F6] placeholder-[#829A8B] outline-none focus:border-[#10B981] transition-colors" />
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            {filters.map(f => (
                                <button key={f.key} onClick={() => setActiveFilter(f.key)}
                                    className={`px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${activeFilter === f.key ? 'bg-[#10B981] text-black shadow-sm' : 'bg-[#111A14] border border-[#1A271E] text-[#829A8B] hover:text-[#F3F4F6] hover:border-[#10B981]/40'}`}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto elegant-scrollbar pb-8 w-full">
                    <div className="max-w-4xl mx-auto px-6 md:px-10">
                    <div className="w-full">
                        {filtered.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">🍽️</div>
                                <h3 className="text-lg font-semibold text-[#F3F4F6] mb-2">No recipes found</h3>
                                <p className="text-sm text-[#829A8B]">Try a different search or generate a new recipe with AI</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                                <AnimatePresence>
                                    {filtered.map((recipe, idx) => (
                                        <motion.div key={recipe.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.04 }}
                                            className="premium-card premium-card-interactive overflow-hidden flex flex-col h-full group">
                                            <div className="h-28 bg-[#1A271E]/40 flex items-center justify-center text-5xl group-hover:scale-105 transition-transform duration-500 select-none">
                                                {recipe.emoji || '🍽️'}
                                            </div>
                                            <div className="p-5 flex flex-col flex-1">
                                                <div className="flex items-start justify-between mb-1.5 gap-2">
                                                    <h3 className="font-bold text-[#F3F4F6] text-[13px] leading-tight group-hover:text-[#10B981] transition-colors line-clamp-1">{recipe.name}</h3>
                                                    <button onClick={(e) => { e.stopPropagation(); deleteRecipe(recipe.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0">
                                                        <Trash2 className="w-3.5 h-3.5 text-red-400/80 hover:text-red-400" />
                                                    </button>
                                                </div>
                                                <p className="text-[11px] text-[#829A8B] mb-3 line-clamp-2 min-h-[32px]">{recipe.description}</p>
                                                
                                                <div className="flex flex-wrap gap-1 mb-3.5 mt-auto">
                                                    {recipe.ingredients?.slice(0, 3).map((ing, i) => (
                                                        <span key={i} className="bg-[#1A271E]/60 text-[#829A8B] text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">{ing}</span>
                                                    ))}
                                                    {recipe.ingredients?.length > 3 && <span className="text-[9px] text-[#829A8B] px-1 py-0.5 font-bold">+{recipe.ingredients.length - 3}</span>}
                                                </div>
                                                
                                                <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-extrabold mb-4 uppercase tracking-wider">
                                                    <span className="flex items-center gap-1 text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded"><Clock className="w-2.5 h-2.5" /> {recipe.time}</span>
                                                    <span className="flex items-center gap-1 text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded"><Flame className="w-2.5 h-2.5" /> {recipe.calories} kcal</span>
                                                    <span className={`px-2 py-0.5 rounded ${recipe.difficulty === 'Easy' ? 'bg-[#10B981]/10 text-[#10B981]' : recipe.difficulty === 'Medium' ? 'bg-amber-400/10 text-amber-400' : 'bg-rose-400/10 text-rose-400'}`}>{recipe.difficulty}</span>
                                                </div>
                                                <button onClick={() => startCookingRecipe(recipe)} className="w-full flex items-center justify-center gap-1.5 bg-[#10B981] hover:bg-[#34D399] text-black text-[11px] font-extrabold py-2.5 rounded-xl transition-all active:scale-[0.98] mt-auto shadow-sm">
                                                    <Play className="w-3 h-3 fill-black stroke-none" /> Start Cooking
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showGenerateModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowGenerateModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0B120E] border border-[#24362A] rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[rgba(16,185,129,0.1)] flex items-center justify-center text-[#10B981]">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-[#F3F4F6]">AI Recipe Generator</h2>
                                        <p className="text-[11px] text-[#829A8B]">Tell me what ingredients you have</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowGenerateModal(false)} className="p-2 hover:bg-[#1A271E] rounded-lg text-[#829A8B] transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <textarea placeholder="e.g. chicken, garlic, tomatoes, pasta, olive oil..." value={ingredientInput} onChange={(e) => setIngredientInput(e.target.value)} rows={3}
                                className="w-full p-3.5 bg-[#111A14] border border-[#1A271E] rounded-xl text-sm text-[#F3F4F6] placeholder-[#829A8B] outline-none focus:border-[#10B981] resize-none mb-3 transition-colors" />
                            <button onClick={handleGenerateRecipe} disabled={isGenerating || !ingredientInput.trim()}
                                className="w-full py-2.5 bg-[#10B981] hover:bg-[#34D399] text-black font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm">
                                {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Recipe</>}
                            </button>
                            {generatedRecipe && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-[#111A14] border border-[#1A271E] rounded-xl">
                                    <div className="flex items-center gap-3 mb-2.5">
                                        <span className="text-3xl">{generatedRecipe.emoji}</span>
                                        <div>
                                            <h3 className="font-semibold text-[#F3F4F6] text-sm">{generatedRecipe.name}</h3>
                                            <p className="text-[11px] text-[#829A8B]">{generatedRecipe.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 mb-3 text-[10px] font-bold uppercase tracking-wider">
                                        <span className="bg-[#1A271E] px-2 py-0.5 rounded-md text-orange-400">⏱ {generatedRecipe.time}</span>
                                        <span className="bg-[#1A271E] px-2 py-0.5 rounded-md text-rose-400">🔥 {generatedRecipe.calories} kcal</span>
                                        <span className="bg-[#1A271E] px-2 py-0.5 rounded-md text-[#10B981]">{generatedRecipe.difficulty}</span>
                                    </div>
                                    {generatedRecipe.instructions && (
                                        <div className="mb-3">
                                            <h4 className="text-[10px] font-bold text-[#829A8B] uppercase tracking-wider mb-1.5">Steps</h4>
                                            <ol className="text-[11px] text-[#F3F4F6] space-y-1">
                                                {generatedRecipe.instructions.map((step, i) => (
                                                    <li key={i} className="flex flex-col gap-1 mb-2">
                                                        <div className="flex gap-2">
                                                            <span className="text-[#10B981] font-bold">{i + 1}.</span>
                                                            <span className="leading-relaxed">
                                                                {typeof step === 'string' ? step : step.step || step.instruction || step.text}
                                                            </span>
                                                        </div>
                                                        {(typeof step !== 'string' && step.timeInMinutes) ? (
                                                            <span className="text-[10px] text-[#10B981] font-medium ml-4 border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.1)] px-1.5 py-0.5 rounded w-fit">
                                                                🕒 {step.timeInMinutes} mins
                                                            </span>
                                                        ) : null}
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                    <button onClick={addGeneratedRecipe} className="w-full py-2 bg-[#10B981] hover:bg-[#34D399] text-black font-bold rounded-lg transition-colors text-sm">+ Add to Collection</button>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default RecipesPage
