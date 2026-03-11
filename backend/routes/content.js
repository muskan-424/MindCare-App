const express = require('express');
const router = express.Router();
const ytSearch = require('yt-search');

// Map of predefined safe categories to aggressive YouTube search strings
const SAFETY_MAPPINGS = {
    'meditation': 'guided meditation calm sleep anxiety 10 minute',
    'motivation': 'motivational speech self improvement mental health',
    'sleep': 'sleep stories rain sounds deep sleep relaxation',
    'relaxing_music': 'peaceful piano deep focus lo-fi ambient relaxation',
    'therapy': 'therapy advice psychologists mental health tips coping strategies'
};

// @route   GET /api/content/search
// @desc    Get safe, moderated YouTube content by category
// @access  Public
router.get('/search', async (req, res) => {
    const category = req.query.category;

    if (!category || !SAFETY_MAPPINGS[category]) {
        return res.status(400).json({
            errors: [{ msg: 'Invalid or missing content category. Must be one of: ' + Object.keys(SAFETY_MAPPINGS).join(', ') }]
        });
    }

    try {
        // We enforce the backend safety query to ensure zero arbitrary user search strings reach YouTube
        const safeQuery = SAFETY_MAPPINGS[category];
        const results = await ytSearch(safeQuery);

        // Grab the first 10 video results
        const videos = results.videos.slice(0, 10).map(v => ({
            videoId: v.videoId,
            title: v.title,
            thumbnail: v.thumbnail,
            timestamp: v.timestamp,
            author: v.author.name,
            views: v.views
        }));

        res.json(videos);
    } catch (err) {
        console.error('Content Search Error:', err.message);
        res.status(500).send('Server Error retrieving safe content');
    }
});

module.exports = router;
