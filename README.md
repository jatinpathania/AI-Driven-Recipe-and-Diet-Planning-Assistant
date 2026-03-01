# FlavourAI – AI-Driven Recipe and Diet Planning Assistant

**FlavourAI** is an intelligent, full-stack web application designed to help users discover personalized recipes and create balanced diet plans effortlessly.  
By leveraging **Artificial Intelligence** powered by Google Generative AI and OpenRouter, the app analyzes available ingredients, dietary preferences, and health goals to suggest nutritious and delicious meal options while tracking nutritional information in real-time.

---

## 🔍 Key Features

- **🧠 AI-Powered Recipe Generator:**  
  Get intelligent recipe suggestions based on ingredients you have, dietary preferences, and cooking skill level. The AI generates step-by-step cooking instructions with estimated preparation and cooking times.

- **🥗 Personalized Meal Planning:**  
  Automatically create weekly or monthly meal plans aligned with user dietary goals (weight loss, muscle gain, balanced nutrition, etc.). Plan meals for breakfast, lunch, and dinner with variety and nutritional balance.

- **🍽️ Smart Meal Decision Assistant:**  
  Can't decide what to cook? Describe your mood, available time, and ingredients, and let the AI recommend the perfect dish with full recipe details.

- **⚖️ Calorie & Nutrition Tracking:**  
  Each recipe includes detailed nutritional breakdowns (calories, protein, carbs, fats, vitamins & minerals). Log your meals and track daily nutrient intake against your personal goals.

- **❤️ Favorites & Recipe Management:**  
  Save your favorite recipes, create a personal recipe collection, and organize them by meal type or cuisine. Rate and review recipes for future reference.

- **👤 User Authentication & Profiles:**  
  Secure JWT-based authentication with social login option (Gmail). Personalized user profiles to store dietary preferences, allergies, calorie targets, and cooking preferences.

- **🍴 Virtual Cooking Sessions:**  
  Interactive step-by-step cooking guidance with timer support. Track your progress through each recipe step and get suggestions for recipe variations.

---

## 💡 Use Case
This app is especially helpful for:
- **Home Cooks & Busy Parents:** Quick recipe ideas using available ingredients without wasting food.  
- **Fitness Enthusiasts:** Detailed meal planning with calorie and macro tracking for fitness goals.  
- **Health-Conscious Individuals:** Dietary restriction management (vegetarian, vegan, gluten-free, low-carb, etc.).  
- **Nutrition Seekers:** Understanding nutritional content and making informed dietary choices.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** Next.js 16.0.1 (with Turbopack)
- **UI Library:** React 19.2.0
- **Styling:** Tailwind CSS 4.1.17, PostCSS
- **Animations:** Framer Motion, Motion React
- **Icons:** Lucide React
- **Component Library:** Radix UI, Shadcn/ui patterns
- **State Management & Auth:** NextAuth.js 4.24.13

### **Backend**
- **Runtime:** Node.js with Next.js API Routes
- **Database:** MongoDB 8.19.3 with Mongoose ODM
- **Authentication:** JWT & NextAuth.js (Google OAuth)
- **File Storage:** Cloudinary (image uploads & management)
- **Middleware:** Custom authentication middleware, CORS support

### **AI & Third-Party APIs**
- **Recipe Generation & Chat:** Google Generative AI (@google/generative-ai)
- **Advanced AI Models:** OpenRouter API (access to multiple LLMs)
- **Calorie Estimation:** Integrated calorie calculation algorithms

### **Development & Tools**
- **Code Quality:** ESLint 9, Babel React Compiler
- **Package Manager:** npm
- **Environment:** .env.local for configuration management  

---

## 📋 Project Structure
```
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (auth, recipes, meals, etc.)
│   ├── kitchen/                  # Protected dashboard pages
│   ├── login/ & signup/          # Authentication pages
│   └── page.js                   # Home page
├── components/                   # Reusable React components
│   ├── AIChef/                   # AI chat interface
│   ├── Home/                     # Landing page components
│   ├── Header/ & Footer/         # Layout components
│   ├── Auth/                     # Authentication UI
│   └── ui/                       # Generic UI components
├── lib/                          # Utility functions & configurations
│   ├── config/                   # API configurations (Gemini, OpenRouter, Cloudinary)
│   ├── db/                       # MongoDB connection
│   ├── models/                   # Mongoose schemas
│   └── middleware/               # Custom middleware
├── context/                      # React Context (Guest User, Theme)
└── utils/                        # Helper functions & API utilities
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB instance (local or cloud)
- Cloudinary account
- API keys for Google Generative AI and OpenRouter

### Installation & Setup
```bash
# Clone the repository
git clone https://github.com/jatinpathania/AI-Driven-Recipe-and-Diet-Planning-Assistant
cd AI-Driven-Recipe-and-Diet-Planning-Assistant

# Install dependencies
npm install

# Create .env.local file with required variables
cp .env.local

# Run development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables Required
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NEXTAUTH_SECRET=your_nextauth_secret
OPENROUTER_API_KEY=your_openrouter_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## 🚀 Future Enhancements
- 🗣️ **Voice-Based Search:** "What can I cook with potato and tomato?" voice commands
- 📱 **Mobile App:** Native iOS/Android application using React Native
- 👨‍👩‍👧‍👦 **Family Meal Plans:** Multi-user household meal planning with shared recipes
- 📦 **Smart Pantry Tracker:** Ingredient inventory management with expiry tracking
- 🌍 **Recipe Localization:** Regional cuisine recommendations based on location
- 🏆 **Gamification:** Achievement badges, cooking streaks, and leaderboards
- 📸 **Image-Based Recipe Search:** Upload a photo to get similar recipes
- ⚡ **Offline Mode:** Access saved recipes without internet connection

---

## 👥 Contributors
- **Jatin Pathania** – Full-Stack Developer  
- **Vaibhav Kumar** – Full-Stack Developer

---

### ✨ "Cook Smart. Eat Smart. Live Healthy."  
**FlavourAI** – Your personal AI Chef & Nutrition Assistant.
