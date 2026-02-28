const express = require('express');
const router = express.Router();
const {
    createSession,
    getSession,
    getSessions,
    updateSession,
    markStepComplete,
    deleteSession
} = require('../Controllers/cookingSessionController');

// Routes
router.post('/', createSession);
router.get('/', getSessions);
router.get('/:id', getSession);
router.put('/:id', updateSession);
router.put('/:id/steps/:stepNumber', markStepComplete);
router.delete('/:id', deleteSession);

module.exports = router;
