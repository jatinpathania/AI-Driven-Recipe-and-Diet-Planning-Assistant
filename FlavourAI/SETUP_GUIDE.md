# FlavourAI - Setup Guide 🚀

## Prerequisites

Before you begin, make sure you have installed:
- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn**

---

## 🔧 Backend Setup

### 1. Navigate to Backend Directory
```bash
cd FlavourAI/Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the `Backend` folder:
```bash
cp .env.example .env
```

Edit `.env` and add your actual values:
```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/flavourai
# OR use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/flavourai

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Cloudinary Configuration (sign up at cloudinary.com)
CLOUD_NAME=your-cloudinary-cloud-name
CLOUD_API_KEY=your-cloudinary-api-key
CLOUD_API_SECRET=your-cloudinary-api-secret

# Server Port
PORT=3000
```

### 4. Start MongoDB
If using local MongoDB:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 5. Run Backend Server
```bash
npm start

# OR for development with auto-restart:
npx nodemon server.js
```

Backend should now be running at: **http://localhost:3000**

---

## 🎨 Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd FlavourAI/Frontend/flavour-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 4. Run Frontend Development Server
```bash
npm run dev
```

Frontend should now be running at: **http://localhost:3001**

---

## 📝 Quick Start Guide

### Create an Account
1. Open **http://localhost:3001** in your browser
2. Click "Sign up"
3. Fill in:
   - Username
   - Full Name
   - Email
   - Password
4. Click "Sign Up"

### Login
1. Go to **http://localhost:3001/login**
2. Enter your email/username and password
3. Click "Login"

### View Profile
1. After logging in, you'll be redirected to **http://localhost:3001/profile**
2. Your profile will show:
   - User stats
   - Top recipes
   - Suggested recipes

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)

### User Profile
- `GET /api/users/profile/:userId` - Get user profile
- `PUT /api/users/profile` - Update profile (requires token)
- `POST /api/users/pfp` - Upload profile picture (requires token)

### Recipes
- `POST /api/recipes` - Create recipe (requires token)
- `GET /api/recipes` - Get user's recipes (requires token)
- `GET /api/recipes/:id` - Get single recipe (requires token)
- `DELETE /api/recipes/:id` - Delete recipe (requires token)
- `POST /api/recipes/upload` - Upload recipe image (requires token)

---

## 🧪 Testing the API

### Using curl (Backend must be running):

**Signup:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "test@example.com",
    "password": "password123"
  }'
```

---

## 📁 Project Structure

```
FlavourAI/
├── Backend/
│   ├── Config/           # Cloudinary & Multer config
│   ├── Controllers/      # Business logic
│   ├── middleware/       # JWT authentication
│   ├── Model/           # MongoDB schemas
│   ├── Routes/          # API routes
│   ├── db/              # Database connection
│   ├── server.js        # Entry point
│   └── .env             # Environment variables
│
└── Frontend/
    └── flavour-ai/
        ├── src/
        │   ├── app/          # Next.js pages
        │   ├── components/   # React components
        │   └── utils/        # API helper functions
        └── .env.local        # Frontend environment variables
```

---

## 🐛 Troubleshooting

### Backend won't start
- ✅ Check if MongoDB is running
- ✅ Verify `.env` file exists with correct values
- ✅ Run `npm install` again

### Frontend won't connect to backend
- ✅ Ensure backend is running on port 3000
- ✅ Check `.env.local` has correct API URL
- ✅ Check browser console for CORS errors

### Login/Signup not working
- ✅ Open browser DevTools → Network tab
- ✅ Check if API requests are being made
- ✅ Verify backend logs for errors

### MongoDB connection error
- ✅ Check MongoDB is running: `mongosh`
- ✅ Verify MONGODB_URI in `.env`
- ✅ For Atlas, check IP whitelist

---

## 🎯 What's Implemented

✅ **Backend:**
- User authentication (JWT)
- Login/Signup endpoints
- Profile management
- Recipe CRUD operations
- Image upload to Cloudinary
- MongoDB integration

✅ **Frontend:**
- Login/Signup forms
- Profile page
- API integration
- JWT token management
- Responsive UI

---

## 📌 Next Steps

- [ ] Integrate AI (OpenAI API) for recipe generation
- [ ] Add recipe search and filtering
- [ ] Implement diet plan creation
- [ ] Add nutrition tracking
- [ ] Create recipe sharing feature
- [ ] Add user favorites system
- [ ] Implement password reset flow

---

## 📞 Need Help?

If you encounter issues:
1. Check the terminal for error messages
2. Inspect browser console (F12)
3. Verify all environment variables are set
4. Ensure MongoDB is running

---

## 🎉 You're All Set!

Your FlavourAI application is now fully functional with:
- Complete authentication system
- User profile management
- Recipe management
- Image uploads
- Frontend-Backend integration

Happy coding! 🚀
