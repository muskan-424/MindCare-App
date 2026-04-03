const express = require('express');
const router = express.Router();
const ytSearch = require('yt-search');

const { auth } = require('../middleware/auth');
const AssessmentFusionResult = require('../models/AssessmentFusionResult');

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
// @access  Private
router.get('/search', auth, async (req, res) => {
    const category = req.query.category;

    if (!category || (!SAFETY_MAPPINGS[category] && category !== 'recommended')) {
        return res.status(400).json({
            errors: [{ msg: 'Invalid category. Must be one of: recommended, ' + Object.keys(SAFETY_MAPPINGS).join(', ') }]
        });
    }

    try {
        let safeQuery = '';
        if (category === 'recommended') {
            const fusion = await AssessmentFusionResult.findOne({ user: req.user.id }).sort({ createdAt: -1 });
            if (fusion) {
                const keywords = [ fusion.riskLevel ];
                if (fusion.recommendations && fusion.recommendations[0]) {
                    keywords.push(fusion.recommendations[0]);
                }
                safeQuery = `mental health coping strategies ${keywords.join(' ')} relaxation safe`;
            } else {
                safeQuery = SAFETY_MAPPINGS['meditation']; // fallback to meditation
            }
        } else {
            safeQuery = SAFETY_MAPPINGS[category];
        }

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
