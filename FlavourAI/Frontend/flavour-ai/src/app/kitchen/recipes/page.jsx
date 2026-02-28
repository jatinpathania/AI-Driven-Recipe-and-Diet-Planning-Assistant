"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Clock, Flame, Trash2, X, Loader2, Sparkles, UtensilsCrossed, Play } from 'lucide-react'
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
        <div className="flex flex-col h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 dark:from-[#0c1117] dark:via-[#0f1419] dark:to-[#0c1a14]" />
            <div className="absolute top-[-15%] right-[10%] w-[450px] h-[450px] bg-orange-200/15 dark:bg-orange-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-emerald-200/15 dark:bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="px-6 md:px-8 py-4 flex items-center justify-between flex-shrink-0 border-b border-black/[0.04] dark:border-white/[0.04]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 dark:shadow-orange-500/10">
                            <UtensilsCrossed className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">Recipes</h1>
                            <p className="text-[11px] text-gray-400 dark:text-gray-600">{recipes.length} in collection</p>
                        </div>
                    </div>
                    <button onClick={() => setShowGenerateModal(true)} className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" /> AI Generate
                    </button>
                </div>

                <div className="px-6 md:px-8 py-3">
                    <div className="flex flex-col sm:flex-row gap-2.5 max-w-5xl mx-auto w-full">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" />
                            <input type="text" placeholder="Search recipes or ingredients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] backdrop-blur-sm text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-400/40 transition-colors" />
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            {filters.map(f => (
                                <button key={f.key} onClick={() => setActiveFilter(f.key)}
                                    className={`px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${activeFilter === f.key ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white/60 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] text-gray-500 dark:text-gray-400 hover:border-emerald-400/30'}`}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-8 no-scrollbar">
                    <div className="max-w-5xl mx-auto">
                        {filtered.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">🍽️</div>
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">No recipes found</h3>
                                <p className="text-sm text-gray-400 dark:text-gray-600">Try a different search or generate a new recipe with AI</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <AnimatePresence>
                                    {filtered.map((recipe, idx) => (
                                        <motion.div key={recipe.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.04 }}
                                            className="bg-white/70 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-sm hover:border-emerald-400/30 transition-all group">
                                            <div className="h-28 bg-gradient-to-br from-emerald-50/50 to-orange-50/50 dark:from-emerald-500/[0.04] dark:to-orange-500/[0.04] flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-500">
                                                {recipe.emoji || '🍽️'}
                                            </div>
                                            <div className="p-4">
                                                <div className="flex items-start justify-between mb-1.5">
                                                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{recipe.name}</h3>
                                                    <button onClick={() => deleteRecipe(recipe.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded-lg transition-all">
                                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                    </button>
                                                </div>
                                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2.5 line-clamp-2">{recipe.description}</p>
                                                <div className="flex flex-wrap gap-1 mb-2.5">
                                                    {recipe.ingredients?.slice(0, 3).map((ing, i) => (
                                                        <span key={i} className="bg-black/[0.03] dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 text-[9px] font-medium px-1.5 py-0.5 rounded-md">{ing}</span>
                                                    ))}
                                                    {recipe.ingredients?.length > 3 && <span className="text-[9px] text-gray-400 dark:text-gray-600 px-1 py-0.5">+{recipe.ingredients.length - 3}</span>}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-medium mb-3">
                                                    <span className="flex items-center gap-1 text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-md"><Clock className="w-2.5 h-2.5" /> {recipe.time}</span>
                                                    <span className="flex items-center gap-1 text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-md"><Flame className="w-2.5 h-2.5" /> {recipe.calories} kcal</span>
                                                    <span className={`px-1.5 py-0.5 rounded-md ${recipe.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500' : recipe.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>{recipe.difficulty}</span>
                                                </div>
                                                <button onClick={() => startCookingRecipe(recipe)} className="w-full flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-medium py-2 rounded-lg transition-colors">
                                                    <Play className="w-3 h-3" /> Start Cooking
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

            <AnimatePresence>
                {showGenerateModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowGenerateModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white/90 dark:bg-[#0f1419]/95 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.06] rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">AI Recipe Generator</h2>
                                        <p className="text-[11px] text-gray-400 dark:text-gray-600">Tell me what ingredients you have</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowGenerateModal(false)} className="p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg transition-colors">
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                            <textarea placeholder="e.g. chicken, garlic, tomatoes, pasta, olive oil..." value={ingredientInput} onChange={(e) => setIngredientInput(e.target.value)} rows={3}
                                className="w-full p-3.5 bg-white/50 dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.06] rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-emerald-400/40 resize-none mb-3 transition-colors" />
                            <button onClick={handleGenerateRecipe} disabled={isGenerating || !ingredientInput.trim()}
                                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm">
                                {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Recipe</>}
                            </button>
                            {generatedRecipe && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-emerald-500/[0.06] border border-emerald-500/10 rounded-xl">
                                    <div className="flex items-center gap-3 mb-2.5">
                                        <span className="text-3xl">{generatedRecipe.emoji}</span>
                                        <div>
                                            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{generatedRecipe.name}</h3>
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500">{generatedRecipe.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 mb-3 text-[10px] font-medium">
                                        <span className="bg-white/60 dark:bg-white/[0.04] px-2 py-0.5 rounded-md text-orange-500">⏱ {generatedRecipe.time}</span>
                                        <span className="bg-white/60 dark:bg-white/[0.04] px-2 py-0.5 rounded-md text-rose-500">🔥 {generatedRecipe.calories} kcal</span>
                                        <span className="bg-white/60 dark:bg-white/[0.04] px-2 py-0.5 rounded-md text-emerald-500">{generatedRecipe.difficulty}</span>
                                    </div>
                                    {generatedRecipe.instructions && (
                                        <div className="mb-3">
                                            <h4 className="text-[10px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-1.5">Steps</h4>
                                            <ol className="text-[11px] text-gray-500 dark:text-gray-400 space-y-1">
                                                {generatedRecipe.instructions.map((step, i) => (
                                                    <li key={i} className="flex gap-2"><span className="text-emerald-500 font-medium">{i + 1}.</span>{step}</li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                    <button onClick={addGeneratedRecipe} className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors text-sm">+ Add to Collection</button>
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
