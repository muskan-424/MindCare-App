const express = require('express');
const router = express.Router();

// @route   GET /api/fitness/categories
// @desc    Get fitness categories
// @access  Public
router.get('/categories', (req, res) => {
    try {
        // We are serving the categories directly from our own backend now!
        const categories = {
            "Yoga": { icon: "https://raw.githubusercontent.com/muskan-424/MindCare-App/main/src/assets/fitness/yoga.png" },
            "Meditation": { icon: "https://raw.githubusercontent.com/muskan-424/MindCare-App/main/src/assets/fitness/meditation.png" },
            "Cardio": { icon: "https://raw.githubusercontent.com/muskan-424/MindCare-App/main/src/assets/fitness/cardio.png" },
            "Stretching": { icon: "https://raw.githubusercontent.com/muskan-424/MindCare-App/main/src/assets/fitness/stretching.png" },
            "Healthy Diet": { icon: "https://raw.githubusercontent.com/muskan-424/MindCare-App/main/src/assets/fitness/diet.png" }
        };

        // If you don't have those specific PNGs in your github, we can use reliable external icons:
        const fallbackCategories = {
            "Yoga": { icon: "https://cdn-icons-png.flaticon.com/512/2647/2647625.png" },
            "Meditation": { icon: "https://cdn-icons-png.flaticon.com/512/3663/3663335.png" },
            "Cardio": { icon: "https://cdn-icons-png.flaticon.com/512/10043/10043015.png" },
            "Stretching": { icon: "https://cdn-icons-png.flaticon.com/512/4144/4144158.png" },
            "Diet": { icon: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png" }
        };

        res.json(fallbackCategories);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
