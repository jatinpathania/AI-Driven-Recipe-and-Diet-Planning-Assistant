const CalorieLog = require('../Model/CalorieLogModel');

// Helper to get start and end of day
const getStartOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const getEndOfDay = (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};

// @desc    Log food entry
// @route   POST /api/calories/log
// @access  Public
const logFood = async (req, res) => {
    try {
        const { userId, guestId, date, food } = req.body;
        
        const logDate = getStartOfDay(date || new Date());
        
        // Find or create calorie log for the day
        let query = { date: logDate };
        if (userId) {
            query.userId = userId;
        } else if (guestId) {
            query.guestId = guestId;
        } else {
            return res.status(400).json({ message: 'userId or guestId required' });
        }

        let calorieLog = await CalorieLog.findOne(query);
        
        if (!calorieLog) {
            const logData = {
                date: logDate,
                foods: [],
                dailyGoal: 2000
            };
            if (userId) {
                logData.userId = userId;
            } else {
                logData.guestId = guestId;
            }
            calorieLog = await CalorieLog.create(logData);
        }

        // Add food entry
        calorieLog.foods.push(food);
        await calorieLog.save();

        res.status(200).json(calorieLog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get food log for a specific date
// @route   GET /api/calories/log
// @access  Public
const getFoodLog = async (req, res) => {
    try {
        const { userId, guestId, date } = req.query;
        
        const logDate = getStartOfDay(date || new Date());
        
        let query = { date: logDate };
        if (userId) {
            query.userId = userId;
        } else if (guestId) {
            query.guestId = guestId;
        } else {
            return res.status(400).json({ message: 'userId or guestId required' });
        }

        let calorieLog = await CalorieLog.findOne(query);
        
        // Create empty log if doesn't exist
        if (!calorieLog) {
            const logData = {
                date: logDate,
                foods: [],
                dailyGoal: 2000
            };
            if (userId) {
                logData.userId = userId;
            } else {
                logData.guestId = guestId;
            }
            calorieLog = await CalorieLog.create(logData);
        }

        res.status(200).json(calorieLog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete food entry
// @route   DELETE /api/calories/log/:logId/food/:foodId
// @access  Public
const deleteFood = async (req, res) => {
    try {
        const { logId, foodId } = req.params;
        
        const calorieLog = await CalorieLog.findById(logId);
        
        if (!calorieLog) {
            return res.status(404).json({ message: 'Calorie log not found' });
        }

        calorieLog.foods = calorieLog.foods.filter(food => food._id.toString() !== foodId);
        await calorieLog.save();

        res.status(200).json(calorieLog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update daily calorie goal
// @route   PUT /api/calories/goal
// @access  Public
const updateGoal = async (req, res) => {
    try {
        const { userId, guestId, date, dailyGoal } = req.body;
        
        const logDate = getStartOfDay(date || new Date());
        
        let query = { date: logDate };
        if (userId) {
            query.userId = userId;
        } else if (guestId) {
            query.guestId = guestId;
        } else {
            return res.status(400).json({ message: 'userId or guestId required' });
        }

        let calorieLog = await CalorieLog.findOne(query);
        
        if (!calorieLog) {
            const logData = {
                date: logDate,
                foods: [],
                dailyGoal
            };
            if (userId) {
                logData.userId = userId;
            } else {
                logData.guestId = guestId;
            }
            calorieLog = await CalorieLog.create(logData);
        } else {
            calorieLog.dailyGoal = dailyGoal;
            await calorieLog.save();
        }

        res.status(200).json(calorieLog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get weekly calorie statistics
// @route   GET /api/calories/weekly
// @access  Public
const getWeeklyStats = async (req, res) => {
    try {
        const { userId, guestId, startDate } = req.query;
        
        const start = getStartOfDay(startDate || new Date());
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        
        let query = {
            date: { $gte: start, $lt: end }
        };
        
        if (userId) {
            query.userId = userId;
        } else if (guestId) {
            query.guestId = guestId;
        } else {
            return res.status(400).json({ message: 'userId or guestId required' });
        }

        const logs = await CalorieLog.find(query).sort({ date: 1 });
        
        // Fill in missing days with empty logs
        const weeklyData = [];
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(start);
            currentDate.setDate(currentDate.getDate() + i);
            
            const existingLog = logs.find(log => 
                log.date.toDateString() === currentDate.toDateString()
            );
            
            if (existingLog) {
                weeklyData.push(existingLog);
            } else {
                weeklyData.push({
                    date: currentDate,
                    totalCalories: 0,
                    dailyGoal: 2000,
                    foods: []
                });
            }
        }

        res.status(200).json(weeklyData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    logFood,
    getFoodLog,
    deleteFood,
    updateGoal,
    getWeeklyStats
};
