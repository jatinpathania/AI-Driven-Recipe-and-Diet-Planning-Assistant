const express = require("express");
const dotenv = require('dotenv');
const cors = require('cors');

// Initialize dotenv before anything else
dotenv.config();

const PORT = process.env.PORT || 5000;
const connectDB = require('./db/connectDB');

// Import routes
const authRoutes = require('./Routes/authRoutes');
const recipeRoutes = require('./Routes/recipeRoutes');
const userRoutes = require('./Routes/userRoutes');
const cookingSessionRoutes = require('./Routes/cookingSessionRoutes');
const mealPlanRoutes = require('./Routes/mealPlanRoutes');
const calorieRoutes = require('./Routes/calorieRoutes');
const chatRoutes = require('./Routes/chatRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', cookingSessionRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/calories', calorieRoutes);
app.use('/api/chat', chatRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'FlavourAI API is running!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);
});