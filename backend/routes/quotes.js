const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const { client } = require('../config/redis');

// @route   GET /api/quotes/
// @desc    Get a random quote of the day (cached with Redis)
// @access  Public
router.get('/', async (req, res) => {
  try {
    // 1. Check Redis Cache first
    const cachedQuote = await client.get('quote_of_the_day');
    if (cachedQuote) {
      console.log('Serving quote from Redis cache');
      return res.json(JSON.parse(cachedQuote));
    }

    // 2. If not in cache, fetch from MongoDB
    const count = await Quote.countDocuments();
    if (count === 0) {
      return res.json({ quote: 'Be yourself no matter what they say!' });
    }
    const random = Math.floor(Math.random() * count);
    const quoteDoc = await Quote.findOne().skip(random);
    
    const responseData = { quote: quoteDoc.quote, author: quoteDoc.author };

    // 3. Save to Redis Cache (expire in 1 hour = 3600 seconds)
    await client.setEx('quote_of_the_day', 3600, JSON.stringify(responseData));
    console.log('Serving quote from MongoDB and cached in Redis');

    res.json(responseData);
  } catch (err) {
    console.error('Quote fetch error:', err.message);
    res.status(500).json({ errors: [{ msg: 'Server error' }] });
  }
});

module.exports = router;
