const express = require('express');
const router = express.Router();
const upload = require('../Config/multer'); 
const { uploadToCloudinary } = require('../Config/cloudinary'); 

router.post('/upload', 
    // Use the Multer middleware here. 
    // 'recipeImage' must match the field name in your frontend form (e.g., <input type="file" name="recipeImage">)
    upload.single('recipeImage'), 
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file provided.' });
            }

            // 3. Pass the file buffer to your Cloudinary uploader
            const uploadResult = await uploadToCloudinary(req.file);

            // 4. Store the URL and Public ID in your database (MongoDB logic goes here)
            // Example of what you would do next:
            // const newRecipe = await Recipe.create({ 
            //     name: req.body.name, 
            //     imageUrl: uploadResult.url, 
            //     imageId: uploadResult.public_id 
            // });

            res.status(200).json({ 
                success: true, 
                message: 'Image uploaded and recipe saved!', 
                imageUrl: uploadResult.url 
            });
        } catch (error) {
            console.error('Recipe upload failed:', error);
            // Don't forget to handle the error thrown by uploadToCloudinary
            res.status(500).json({ success: false, message: error.message });
        }
});

module.exports = router;