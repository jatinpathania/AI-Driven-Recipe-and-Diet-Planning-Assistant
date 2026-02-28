const MealPlan = require('../Model/MealPlanModel');

// Helper function to get start of week
const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
};

// @desc    Create or get meal plan for a week
// @route   POST /api/meal-plans
// @access  Public
const createMealPlan = async (req, res) => {
    try {
        const { userId, guestId, weekOf } = req.body;
        
        const startOfWeek = getStartOfWeek(weekOf || new Date());
        
        // Check if plan already exists
        let query = { weekOf: startOfWeek };
        if (userId) {
            query.userId = userId;
        } else if (guestId) {
            query.guestId = guestId;
        } else {
            return res.status(400).json({ message: 'userId or guestId required' });
        }

        let mealPlan = await MealPlan.findOne(query).populate('meals.recipeId');
        
        if (mealPlan) {
            return res.status(200).json(mealPlan);
        }

        // Create new meal plan with empty meals
        const planData = {
            weekOf: startOfWeek,
            meals: []
        };

        if (userId) {
            planData.userId = userId;
        } else {
            planData.guestId = guestId;
        }

        mealPlan = await MealPlan.create(planData);
        res.status(201).json(mealPlan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get meal plan for a specific week
// @route   GET /api/meal-plans
// @access  Public
const getMealPlan = async (req, res) => {
    try {
        const { userId, guestId, weekOf } = req.query;
        
        const startOfWeek = getStartOfWeek(weekOf || new Date());
        
        let query = { weekOf: startOfWeek };
        if (userId) {
            query.userId = userId;
        } else if (guestId) {
            query.guestId = guestId;
        } else {
            return res.status(400).json({ message: 'userId or guestId required' });
        }

        const mealPlan = await MealPlan.findOne(query).populate('meals.recipeId');
        
        if (!mealPlan) {
            return res.status(404).json({ message: 'Meal plan not found' });
        }

        res.status(200).json(mealPlan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update meal plan (add/update/remove meals)
// @route   PUT /api/meal-plans/:id
// @access  Public
const updateMealPlan = async (req, res) => {
    try {
        const { meals } = req.body;
        
        const mealPlan = await MealPlan.findById(req.params.id);
        
        if (!mealPlan) {
            return res.status(404).json({ message: 'Meal plan not found' });
        }

        if (meals) {
            mealPlan.meals = meals;
        }

        await mealPlan.save();
        const updatedPlan = await MealPlan.findById(mealPlan._id).populate('meals.recipeId');

        res.status(200).json(updatedPlan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add meal to plan
// @route   POST /api/meal-plans/:id/meals
// @access  Public
const addMeal = async (req, res) => {
    try {
        const { day, mealType, recipeId, recipeName, calories } = req.body;
        
        const mealPlan = await MealPlan.findById(req.params.id);
        
        if (!mealPlan) {
            return res.status(404).json({ message: 'Meal plan not found' });
        }

        const newMeal = {
            day,
            mealType,
            recipeId: recipeId || null,
            recipeName: recipeName || '',
            calories: calories || 0,
            completed: false
        };

        mealPlan.meals.push(newMeal);
        await mealPlan.save();
        
        const updatedPlan = await MealPlan.findById(mealPlan._id).populate('meals.recipeId');

        res.status(200).json(updatedPlan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete meal from plan
// @route   DELETE /api/meal-plans/:id/meals/:mealId
// @access  Public
const deleteMeal = async (req, res) => {
    try {
        const { id, mealId } = req.params;
        
        const mealPlan = await MealPlan.findById(id);
        
        if (!mealPlan) {
            return res.status(404).json({ message: 'Meal plan not found' });
        }

        mealPlan.meals = mealPlan.meals.filter(meal => meal._id.toString() !== mealId);
        await mealPlan.save();
        
        const updatedPlan = await MealPlan.findById(mealPlan._id).populate('meals.recipeId');

        res.status(200).json(updatedPlan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark meal as completed
// @route   PUT /api/meal-plans/:id/meals/:mealId/complete
// @access  Public
const markMealComplete = async (req, res) => {
    try {
        const { id, mealId } = req.params;
        const { completed } = req.body;
        
        const mealPlan = await MealPlan.findById(id);
        
        if (!mealPlan) {
            return res.status(404).json({ message: 'Meal plan not found' });
        }

        const meal = mealPlan.meals.id(mealId);
        
        if (!meal) {
            return res.status(404).json({ message: 'Meal not found' });
        }

        meal.completed = completed !== undefined ? completed : true;
        await mealPlan.save();
        
        const updatedPlan = await MealPlan.findById(mealPlan._id).populate('meals.recipeId');

        res.status(200).json(updatedPlan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createMealPlan,
    getMealPlan,
    updateMealPlan,
    addMeal,
    deleteMeal,
    markMealComplete
};
