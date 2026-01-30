# Backend API Requirements for Profile Page

## Overview
The frontend profile page expects to fetch user data from the backend. Here's what needs to be implemented.

---

## API Endpoint Required

### **GET** `/api/users/profile/:userId`

**Description:** Fetch complete user profile data

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token> (if using JWT)
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    // Basic Info
    "username": "john_doe",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 25,
    "profileImage": "https://cloudinary.com/path/to/image.jpg",
    
    // Profile Details
    "moodChoice": "Adventurous",
    "mood": "Happy",
    "personality": "You love bold flavors and trying new cuisines. Your cooking style reflects creativity and experimentation.",
    "bio": "Food enthusiast who loves cooking and trying new recipes",
    
    // Statistics (for "Your Taste" section)
    "totalRecipes": 45,
    "favoriteRecipes": 12,
    "cookedRecipes": 28,
    "savedRecipes": 15,
    
    // Top Recipes (array of recipe objects)
    "topRecipes": [
      {
        "id": "recipe123",
        "name": "Chicken Tikka Masala",
        "title": "Chicken Tikka Masala",
        "image": "https://cloudinary.com/recipe-image.jpg",
        "cookTime": "45 min",
        "rating": 4.8
      },
      {
        "id": "recipe124",
        "name": "Pasta Carbonara",
        "title": "Pasta Carbonara",
        "image": "https://cloudinary.com/recipe-image2.jpg",
        "cookTime": "30 min",
        "rating": 4.5
      }
      // ... up to 3 recipes
    ],
    
    // Suggested Recipes (array of recipe objects)
    "suggestedRecipes": [
      {
        "id": "recipe456",
        "name": "Thai Green Curry",
        "title": "Thai Green Curry",
        "image": "https://cloudinary.com/recipe-image3.jpg",
        "description": "Authentic Thai curry with coconut milk and fresh herbs",
        "cookTime": "40 min"
      },
      {
        "id": "recipe457",
        "name": "Beef Wellington",
        "title": "Beef Wellington",
        "image": "https://cloudinary.com/recipe-image4.jpg",
        "description": "Classic British dish with tender beef and puff pastry",
        "cookTime": "2 hours"
      }
      // ... up to 3 recipes
    ],
    
    // Timestamps
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-27T14:22:00Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## Database Schema Additions Needed

Update your **User Model** to include these fields:

```javascript
{
  // Existing fields
  username: String,
  email: String,
  password: String, // hashed
  
  // NEW FIELDS TO ADD:
  age: {
    type: Number,
    default: null
  },
  profileImage: {
    type: String,
    default: null
  },
  moodChoice: {
    type: String,
    default: "Neutral"
  },
  personality: {
    type: String,
    default: ""
  },
  bio: {
    type: String,
    default: ""
  },
  
  // Stats (can be computed or stored)
  totalRecipes: {
    type: Number,
    default: 0
  },
  favoriteRecipes: {
    type: Number,
    default: 0
  },
  cookedRecipes: {
    type: Number,
    default: 0
  },
  savedRecipes: {
    type: Number,
    default: 0
  },
  
  // References to recipes
  topRecipeIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  }],
  suggestedRecipeIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  }]
}
```

---

## Controller Logic Needed

### File: `Controllers/userController.js`

```javascript
const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // 1. Fetch user data
    const user = await User.findById(userId)
      .select('-password') // Don't send password
      .populate('topRecipeIds', 'name title image cookTime rating')
      .populate('suggestedRecipeIds', 'name title image description cookTime');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // 2. Format response
    const profileData = {
      username: user.username,
      name: user.name,
      email: user.email,
      age: user.age,
      profileImage: user.profileImage,
      moodChoice: user.moodChoice,
      mood: user.mood,
      personality: user.personality,
      bio: user.bio,
      
      // Stats
      totalRecipes: user.totalRecipes,
      favoriteRecipes: user.favoriteRecipes,
      cookedRecipes: user.cookedRecipes,
      savedRecipes: user.savedRecipes,
      
      // Recipes
      topRecipes: user.topRecipeIds,
      suggestedRecipes: user.suggestedRecipeIds,
      
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.status(200).json({
      success: true,
      data: profileData
    });
    
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

module.exports = { getUserProfile };
```

---

## Route Setup Needed

### File: `Routes/userRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { getUserProfile } = require('../Controllers/userController');
const authMiddleware = require('../middleware/authMiddleware'); // if using auth

// Profile endpoint
router.get('/profile/:userId', authMiddleware, getUserProfile);

module.exports = router;
```

---

## Additional Recommendations

### 1. **Statistics Calculation**
You can calculate stats dynamically instead of storing them:

```javascript
// In getUserProfile controller
const totalRecipes = await Recipe.countDocuments({ userId: userId });
const favoriteRecipes = await Favorite.countDocuments({ userId: userId });
const cookedRecipes = await CookedRecipe.countDocuments({ userId: userId });
```

### 2. **Suggested Recipes Algorithm**
Implement a recommendation system based on:
- User's past recipe views
- Favorite cuisines
- Cooking difficulty preference
- Ingredients they frequently use

```javascript
const getSuggestedRecipes = async (userId) => {
  const userPreferences = await UserPreference.findOne({ userId });
  
  const suggestions = await Recipe.find({
    cuisine: { $in: userPreferences.favoriteCuisines },
    difficulty: userPreferences.difficultyLevel
  })
  .limit(3)
  .sort({ rating: -1 });
  
  return suggestions;
};
```

### 3. **Top Recipes Logic**
Determine top recipes by:
- Most cooked by user
- Highest rated by user
- Most frequently viewed

```javascript
const getTopRecipes = async (userId) => {
  const topRecipes = await UserRecipeHistory.find({ userId })
    .populate('recipeId')
    .sort({ cookCount: -1, rating: -1 })
    .limit(3);
  
  return topRecipes.map(item => item.recipeId);
};
```

---

## Testing the API

Use this curl command or Postman:

```bash
curl -X GET http://localhost:3000/api/users/profile/USER_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected Status Codes:
- `200` - Success
- `404` - User not found
- `500` - Server error
- `401` - Unauthorized (if auth is required)

---

## Frontend Connection

The frontend automatically calls this endpoint when the profile page loads:

```javascript
// In Profile.jsx (line 18-29)
const response = await fetch(`http://localhost:3000/api/users/profile/${userId}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
})
```

Make sure:
1. ✅ Backend is running on `localhost:3000`
2. ✅ CORS is enabled for frontend origin
3. ✅ Route `/api/users/profile/:userId` exists
4. ✅ Controller returns correct JSON format
5. ✅ User ID is valid MongoDB ObjectId

---

## Questions for Backend Developer?

1. Do we have user authentication in place? (JWT/Session)
2. Is there a Recipe model with image URLs?
3. Should we track user cooking history?
4. Do we need pagination for recipes?
5. Should profile images be stored in Cloudinary?
