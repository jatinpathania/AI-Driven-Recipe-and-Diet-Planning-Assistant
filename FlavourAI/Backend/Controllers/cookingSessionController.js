const CookingSession = require('../Model/CookingSessionModel');
const Recipe = require('../Model/RecipeModel');

// @desc    Create a new cooking session
// @route   POST /api/sessions
// @access  Public (supports guest users)
const createSession = async (req, res) => {
    try {
        const { recipeId, userId, guestId } = req.body;

        // Verify recipe exists
        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        // Create steps from recipe instructions
        const steps = recipe.instructions.map((instruction, index) => ({
            stepNumber: index + 1,
            description: instruction,
            duration: 0, // Can be set based on instruction analysis
            completed: false
        }));

        const sessionData = {
            recipeId,
            steps,
            totalDuration: recipe.time ? recipe.time * 60 : 0, // Convert minutes to seconds
            remainingTime: recipe.time ? recipe.time * 60 : 0
        };

        // Set userId or guestId
        if (userId) {
            sessionData.userId = userId;
        } else if (guestId) {
            sessionData.guestId = guestId;
        }

        const session = await CookingSession.create(sessionData);
        const populatedSession = await CookingSession.findById(session._id).populate('recipeId');

        res.status(201).json(populatedSession);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get cooking session by ID
// @route   GET /api/sessions/:id
// @access  Public
const getSession = async (req, res) => {
    try {
        const session = await CookingSession.findById(req.params.id).populate('recipeId');
        
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.status(200).json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get active sessions for user/guest
// @route   GET /api/sessions
// @access  Public
const getSessions = async (req, res) => {
    try {
        const { userId, guestId } = req.query;
        
        let query = { status: { $ne: 'completed' } };
        
        if (userId) {
            query.userId = userId;
        } else if (guestId) {
            query.guestId = guestId;
        } else {
            return res.status(400).json({ message: 'userId or guestId required' });
        }

        const sessions = await CookingSession.find(query)
            .populate('recipeId')
            .sort({ createdAt: -1 });

        res.status(200).json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update cooking session
// @route   PUT /api/sessions/:id
// @access  Public
const updateSession = async (req, res) => {
    try {
        const { status, remainingTime } = req.body;
        
        const session = await CookingSession.findById(req.params.id);
        
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (status) {
            session.status = status;
            if (status === 'in_progress' && !session.startedAt) {
                session.startedAt = new Date();
            }
            if (status === 'completed') {
                session.completedAt = new Date();
            }
        }

        if (remainingTime !== undefined) {
            session.remainingTime = remainingTime;
        }

        await session.save();
        const updatedSession = await CookingSession.findById(session._id).populate('recipeId');

        res.status(200).json(updatedSession);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark step as complete
// @route   PUT /api/sessions/:id/steps/:stepNumber
// @access  Public
const markStepComplete = async (req, res) => {
    try {
        const { id, stepNumber } = req.params;
        
        const session = await CookingSession.findById(id);
        
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const step = session.steps.find(s => s.stepNumber === parseInt(stepNumber));
        
        if (!step) {
            return res.status(404).json({ message: 'Step not found' });
        }

        step.completed = true;
        step.completedAt = new Date();

        // Check if all steps are completed
        const allCompleted = session.steps.every(s => s.completed);
        if (allCompleted) {
            session.status = 'completed';
            session.completedAt = new Date();
        }

        await session.save();
        const updatedSession = await CookingSession.findById(session._id).populate('recipeId');

        res.status(200).json(updatedSession);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete cooking session
// @route   DELETE /api/sessions/:id
// @access  Public
const deleteSession = async (req, res) => {
    try {
        const session = await CookingSession.findById(req.params.id);
        
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        await session.deleteOne();
        res.status(200).json({ message: 'Session deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createSession,
    getSession,
    getSessions,
    updateSession,
    markStepComplete,
    deleteSession
};
