const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const { client } = require('../../../../config/redis');

// Safe Redis helpers — gracefully no-op when Redis is not connected locally
async function safeRedisGet(key) {
  try {
    if (!client.isOpen) return null;
    return await client.get(key);
  } catch (e) {
    return null;
  }
}

async function safeRedisSet(key, ttl, value) {
  try {
    if (!client.isOpen) return;
    await client.setEx(key, ttl, value);
  } catch (e) {
    // ignore
  }
}

// @route   GET /api/quotes/
// @desc    Get a random quote of the day (cached with Redis when available)
// @access  Public
router.get('/', async (req, res) => {
  try {
    // 1. Check Redis Cache first (skipped gracefully when Redis is not connected)
    const cachedQuote = await safeRedisGet('quote_of_the_day');
    if (cachedQuote) {
      console.log('Serving quote from Redis cache');
      return res.json(JSON.parse(cachedQuote));
    }

    // 2. If not in cache, fetch from MongoDB
    const count = await Quote.countDocuments();
    if (count === 0) {
      return res.json({ quote: 'Be yourself no matter what they say!', author: 'MindCare' });
    }
    const random = Math.floor(Math.random() * count);
    const quoteDoc = await Quote.findOne().skip(random);

    const responseData = { quote: quoteDoc.quote, author: quoteDoc.author };

    // 3. Save to Redis Cache (expire in 1 hour) — skipped when Redis is offline
    await safeRedisSet('quote_of_the_day', 3600, JSON.stringify(responseData));

    res.json(responseData);
  } catch (err) {
    console.error('Quote fetch error:', err.message);
    res.status(500).json({ errors: [{ msg: 'Server error' }] });
  }
});

module.exports = router;
