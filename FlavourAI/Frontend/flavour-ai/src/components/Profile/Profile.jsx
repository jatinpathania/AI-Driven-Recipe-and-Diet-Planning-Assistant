"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Edit } from "lucide-react"

export default function Profile() {
  const router = useRouter()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch user profile data from backend
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true)
        
        // Get user ID from localStorage/cookies/context
        const userId = localStorage.getItem('userId') || 'CURRENT_USER_ID'
        
        // Try to fetch from backend API
        try {
          const response = await fetch(`http://localhost:3000/api/users/profile/${userId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })

          if (response.ok) {
            const data = await response.json()
            setUserData(data.data || data)
            setError(null)
            setLoading(false)
            return
          }
        } catch (apiError) {
          console.log('API not available, using mock data:', apiError.message)
        }

        // Fallback to mock data if API is not available
        // REMOVE THIS SECTION when backend is ready
        const mockData = {
          username: "John Doe",
          name: "John Doe",
          email: "john@example.com",
          age: 28,
          profileImage: "/icon.png",
          moodChoice: "Adventurous",
          mood: "Happy",
          personality: "You love bold flavors and trying new cuisines. Your cooking style reflects creativity and experimentation with various spices and ingredients.",
          bio: "Passionate home cook who loves exploring world cuisines",
          
          // Stats
          totalRecipes: 45,
          favoriteRecipes: 12,
          cookedRecipes: 28,
          savedRecipes: 15,
          
          // Top Recipes
          topRecipes: [
            {
              id: "1",
              name: "Chicken Tikka Masala",
              title: "Chicken Tikka Masala",
              image: null,
              cookTime: "45 min",
              rating: 4.8
            },
            {
              id: "2",
              name: "Pasta Carbonara",
              title: "Pasta Carbonara",
              image: null,
              cookTime: "30 min",
              rating: 4.5
            },
            {
              id: "3",
              name: "Beef Tacos",
              title: "Beef Tacos",
              image: null,
              cookTime: "25 min",
              rating: 4.7
            }
          ],
          
          // Suggested Recipes
          suggestedRecipes: [
            {
              id: "4",
              name: "Thai Green Curry",
              title: "Thai Green Curry",
              image: null,
              description: "Authentic Thai curry with coconut milk",
              cookTime: "40 min"
            },
            {
              id: "5",
              name: "Margherita Pizza",
              title: "Margherita Pizza",
              image: null,
              description: "Classic Italian pizza with fresh basil",
              cookTime: "35 min"
            },
            {
              id: "6",
              name: "Sushi Rolls",
              title: "Sushi Rolls",
              image: null,
              description: "Homemade sushi with fresh ingredients",
              cookTime: "50 min"
            }
          ],
          
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        setUserData(mockData)
        setError(null)
        
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#1b5e20]" />
          <p className="text-gray-400 font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 rounded-2xl shadow-lg p-8 max-w-md text-center border border-zinc-800">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Profile</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#1b5e20] text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // No data state
  if (!userData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">No profile data found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 sticky top-24">
              {/* Profile Image */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#1b5e20] to-green-600 p-1">
                    <div className="w-full h-full rounded-full bg-zinc-800 p-1 flex items-center justify-center overflow-hidden">
                      {userData.profileImage ? (
                        <img
                          src={userData.profileImage}
                          alt={userData.username || userData.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1b5e20] to-green-600 flex items-center justify-center text-2xl font-bold">
                          {(userData.username || userData.name || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div className="text-center w-full space-y-2 mb-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Name</label>
                    <p className="text-white font-semibold">{userData.username || userData.name || "User"}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Age</label>
                    <p className="text-white font-semibold">{userData.age || "Not set"}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Mood choice</label>
                    <p className="text-white font-semibold">{userData.moodChoice || userData.mood || "Happy"}</p>
                  </div>
                </div>

                <div className="w-full h-px bg-zinc-800 my-4"></div>

                {/* Personality */}
                <div className="w-full">
                  <p className="text-xs text-gray-500 text-center mb-2">Your personality according to taste</p>
                  <p className="text-white text-sm text-center leading-relaxed px-2">
                    {userData.personality || userData.bio || "Your taste profile will appear here based on your recipe preferences and cooking style."}
                  </p>
                </div>
              </div>

              {/* Edit Profile Button */}
              <button 
                onClick={() => router.push('/profile/edit')}
                className="w-full bg-transparent border-2 border-zinc-700 hover:border-[#1b5e20] text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 hover:bg-zinc-800"
              >
                <Edit size={18} />
                EDIT PROFILE
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Your Taste Stats */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Your Taste</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "SOME STATS", value: userData.totalRecipes || "0" },
                  { label: "SOME STATS", value: userData.favoriteRecipes || "0" },
                  { label: "SOME STATS", value: userData.cookedRecipes || "0" },
                  { label: "SOME STATS", value: userData.savedRecipes || "0" },
                ].map((stat, index) => (
                  <div 
                    key={index}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-[#1b5e20] transition-all"
                  >
                    <p className="text-gray-500 text-xs mb-2">{stat.label}</p>
                    <p className="text-white text-2xl font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Your Top Recipe's */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Your top Recipe's</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {userData.topRecipes && userData.topRecipes.length > 0 ? (
                  userData.topRecipes.slice(0, 3).map((recipe, index) => (
                    <div 
                      key={index}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-[#1b5e20] transition-all cursor-pointer group"
                    >
                      <div className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center relative overflow-hidden">
                        {recipe.image ? (
                          <img 
                            src={recipe.image} 
                            alt={recipe.name || recipe.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-6xl opacity-20">🍳</div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-semibold line-clamp-1">{recipe.name || recipe.title}</h3>
                        <p className="text-gray-500 text-sm mt-1">{recipe.cookTime || "30 min"}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  // Empty state
                  Array(3).fill(0).map((_, index) => (
                    <div 
                      key={index}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
                    >
                      <div className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                        <div className="text-6xl opacity-20">🍳</div>
                      </div>
                      <div className="p-4">
                        <div className="h-4 bg-zinc-800 rounded mb-2"></div>
                        <div className="h-3 bg-zinc-800 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Suggested Recipes */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Suggested Recipes <span className="text-gray-500 text-lg">( according to your past taste )</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {userData.suggestedRecipes && userData.suggestedRecipes.length > 0 ? (
                  userData.suggestedRecipes.slice(0, 3).map((recipe, index) => (
                    <div 
                      key={index}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-[#1b5e20] transition-all cursor-pointer group"
                    >
                      <div className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center relative overflow-hidden">
                        {recipe.image ? (
                          <img 
                            src={recipe.image} 
                            alt={recipe.name || recipe.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-6xl opacity-20">🍽️</div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-semibold line-clamp-1">{recipe.name || recipe.title}</h3>
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{recipe.description || "Delicious recipe suggestion"}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  // Empty state
                  Array(3).fill(0).map((_, index) => (
                    <div 
                      key={index}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
                    >
                      <div className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                        <div className="text-6xl opacity-20">🍽️</div>
                      </div>
                      <div className="p-4">
                        <div className="h-4 bg-zinc-800 rounded mb-2"></div>
                        <div className="h-3 bg-zinc-800 rounded w-full mb-1"></div>
                        <div className="h-3 bg-zinc-800 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}