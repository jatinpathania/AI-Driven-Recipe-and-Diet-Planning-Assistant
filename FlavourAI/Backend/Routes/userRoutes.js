const express = require('express');
const router = express.Router();
const upload = require('../Config/multer'); 
const { uploadToCloudinary, deleteFromCloudinary } = require('../Config/cloudinary'); 
let userProfileData = {
    'user_auth_id_123': {
        pfpUrl: null,
        pfpId: null 
    }
};

router.post('/pfp', 
    // In a real app, authentication middleware goes here: authMiddleware, 
    upload.single('profilePicture'), // Multer middleware expects 'profilePicture' field
    async (req, res) => {
        // Mocking user ID retrieval after authentication
        // const userId = req.user.id; 
        const userId = 'user_auth_id_123'; // Replace with actual authenticated user ID

        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No image file provided.' });
            }

            // 1. Delete old asset (Cleanup)
            const oldPublicId = userProfileData[userId].pfpId;
            if (oldPublicId) {
                // We use catch() here to prevent a crash if the old image is already gone
                await deleteFromCloudinary(oldPublicId).catch(err => 
                    console.warn(`[Cleanup Warning] Failed to delete old PFP: ${err.message}`)
                );
            }

            // 2. Upload the new file to Cloudinary
            const uploadResult = await uploadToCloudinary(req.file, { 
                // Set folder dynamically based on user ID for organization
                folder: `flavour_ai/profile_pictures/${userId}`,
                // Optional: Force a square aspect ratio thumbnail on the image delivery
                transformation: [
                    { width: 300, height: 300, crop: "thumb", gravity: "face" }
                ]
            });

            // 3. Update the database (REPLACE THIS MOCK LOGIC)
            // Example: await User.findByIdAndUpdate(userId, { 
            //     pfpUrl: uploadResult.url, 
            //     pfpId: uploadResult.public_id 
            // });
            userProfileData[userId].pfpUrl = uploadResult.url;
            userProfileData[userId].pfpId = uploadResult.public_id;

            res.status(200).json({ 
                success: true, 
                message: 'Profile picture updated!', 
                pfpUrl: uploadResult.url 
            });

        } catch (error) {
            console.error('User PFP Upload Error:', error.message);
            res.status(500).json({ success: false, message: "Server Error: Could not upload profile picture." });
        }
    }
);

module.exports = router;