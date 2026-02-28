const express = require('express');
const router = express.Router();
const upload = require('../Config/multer'); 
const { uploadToCloudinary, deleteFromCloudinary } = require('../Config/cloudinary'); 
const { protect } = require('../middleware/authMiddleware');
const User = require('../Model/UserModel');
const Recipe = require('../Model/RecipeModel');

// @desc    Get user profile
// @route   GET /api/users/profile/:userId
// @access  Public
router.get('/profile/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('-password')
            .populate('topRecipeIds', 'recipeName description ingredients imageUrl')
            .populate('suggestedRecipeIds', 'recipeName description ingredients imageUrl')
            .populate('favoriteRecipes', 'recipeName description imageUrl');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Get user's top recipes (most recent)
        const topRecipes = await Recipe.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(3)
            .select('recipeName description ingredients imageUrl');

        res.status(200).json({
            success: true,
            data: {
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                profileImage: user.profileImage,
                age: user.age,
                bio: user.bio,
                moodChoice: user.moodChoice,
                personality: user.personality,
                totalRecipes: user.totalRecipes,
                favoriteRecipes: user.favoriteRecipes,
                topRecipes: topRecipes,
                suggestedRecipes: user.suggestedRecipeIds || []
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const { fullName, age, bio, moodChoice } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Update fields if provided
        if (fullName !== undefined) user.fullName = fullName;
        if (age !== undefined) user.age = age;
        if (bio !== undefined) user.bio = bio;
        if (moodChoice !== undefined) user.moodChoice = moodChoice;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
});

// @desc    Upload profile picture
// @route   POST /api/users/pfp
// @access  Private
router.post('/pfp', protect, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No image file provided' 
            });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Delete old profile picture if exists
        if (user.profileImageId) {
            await deleteFromCloudinary(user.profileImageId).catch(err => 
                console.warn(`Failed to delete old profile picture: ${err.message}`)
            );
        }

        // Upload new profile picture
        const uploadResult = await uploadToCloudinary(req.file, { 
            folder: `flavour_ai/profile_pictures/${req.user._id}`,
            transformation: [
                { width: 300, height: 300, crop: "thumb", gravity: "face" }
            ]
        });

        // Update user profile
        user.profileImage = uploadResult.url;
        user.profileImageId = uploadResult.public_id;
        await user.save();

        res.status(200).json({ 
            success: true, 
            message: 'Profile picture updated successfully',
            data: {
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error('Profile picture upload failed:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

module.exports = router;