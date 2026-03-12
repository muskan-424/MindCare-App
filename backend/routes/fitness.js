const express = require('express');
const router = express.Router();
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const FitnessCategory = require('../models/FitnessCategory');
const FitnessSubcategory = require('../models/FitnessSubcategory');
const FitnessContentItem = require('../models/FitnessContentItem');

async function ensureFitnessSeeded() {
  if ((await FitnessCategory.countDocuments()) > 0) return;
  const CATEGORIES = [
    { name: 'Yoga', icon: 'https://cdn-icons-png.flaticon.com/512/2647/2647625.png', order: 1 },
    { name: 'Meditation', icon: 'https://cdn-icons-png.flaticon.com/512/3663/3663335.png', order: 2 },
    { name: 'Cardio', icon: 'https://cdn-icons-png.flaticon.com/512/10043/10043015.png', order: 3 },
    { name: 'Stretching', icon: 'https://cdn-icons-png.flaticon.com/512/4144/4144158.png', order: 4 },
    { name: 'Healthy Diet', icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', order: 5 },
  ];
  const SUBCATEGORIES = [
    { categoryName: 'Yoga', name: 'Beginner Yoga Flow', icon: 'https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg', order: 1 },
    { categoryName: 'Yoga', name: 'Yoga for Anxiety Relief', icon: 'https://i.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg', order: 2 },
    { categoryName: 'Yoga', name: 'Bedtime Yoga', icon: 'https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg', order: 3 },
    { categoryName: 'Meditation', name: '5-Minute Daily Meditation', icon: 'https://i.ytimg.com/vi/O-6f5wQXSu8/hqdefault.jpg', order: 1 },
    { categoryName: 'Meditation', name: 'Sleep Meditation', icon: 'https://i.ytimg.com/vi/2OEL4P1Rz04/hqdefault.jpg', order: 2 },
    { categoryName: 'Meditation', name: 'Anxiety-Calming Breath', icon: 'https://i.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg', order: 3 },
    { categoryName: 'Cardio', name: 'Low Impact Cardio', icon: 'https://i.ytimg.com/vi/ml6cT4AZdqI/hqdefault.jpg', order: 1 },
    { categoryName: 'Cardio', name: 'Beginner HIIT', icon: 'https://i.ytimg.com/vi/ml6cT4AZdqI/hqdefault.jpg', order: 2 },
    { categoryName: 'Stretching', name: 'Full Body Stretch', icon: 'https://i.ytimg.com/vi/L_xrDAtykMI/hqdefault.jpg', order: 1 },
    { categoryName: 'Stretching', name: 'Morning Stretch', icon: 'https://i.ytimg.com/vi/L_xrDAtykMI/hqdefault.jpg', order: 2 },
    { categoryName: 'Healthy Diet', name: 'Healthy Breakfast Ideas', icon: 'https://i.ytimg.com/vi/8aV2KYf_MXw/hqdefault.jpg', order: 1 },
    { categoryName: 'Healthy Diet', name: 'Meal Prep Basics', icon: 'https://i.ytimg.com/vi/Qe4qU9oxC6o/hqdefault.jpg', order: 2 },
  ];
  const CONTENT_ITEMS = [
    { categoryName: 'Yoga', subcategoryName: 'Beginner Yoga Flow', title: '10-Minute Beginner Yoga', imageUrl: 'https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg', videoId: 'v7AYKMP6rOE' },
    { categoryName: 'Yoga', subcategoryName: 'Beginner Yoga Flow', title: 'Gentle Morning Yoga', imageUrl: 'https://i.ytimg.com/vi/KmYdVq47UOU/hqdefault.jpg', videoId: 'KmYdVq47UOU' },
    { categoryName: 'Yoga', subcategoryName: 'Yoga for Anxiety Relief', title: 'Yoga for Anxiety and Stress', imageUrl: 'https://i.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg', videoId: 'inpok4MKVLM' },
    { categoryName: 'Yoga', subcategoryName: 'Yoga for Anxiety Relief', title: 'Calming Yoga for Worry', imageUrl: 'https://i.ytimg.com/vi/b1H3xO3x_Js/hqdefault.jpg', videoId: 'b1H3xO3x_Js' },
    { categoryName: 'Yoga', subcategoryName: 'Bedtime Yoga', title: 'Bedtime Yoga for Relaxation', imageUrl: 'https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg', videoId: 'v7AYKMP6rOE' },
    { categoryName: 'Meditation', subcategoryName: '5-Minute Daily Meditation', title: 'Quick Reset Meditation', imageUrl: 'https://i.ytimg.com/vi/O-6f5wQXSu8/hqdefault.jpg', videoId: 'O-6f5wQXSu8' },
    { categoryName: 'Meditation', subcategoryName: 'Sleep Meditation', title: 'Deep Sleep Talk Down', imageUrl: 'https://i.ytimg.com/vi/2OEL4P1Rz04/hqdefault.jpg', videoId: '2OEL4P1Rz04' },
    { categoryName: 'Meditation', subcategoryName: 'Anxiety-Calming Breath', title: 'Breathing for Anxiety Relief', imageUrl: 'https://i.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg', videoId: 'inpok4MKVLM' },
    { categoryName: 'Cardio', subcategoryName: 'Low Impact Cardio', title: 'Low Impact Cardio Workout', imageUrl: 'https://i.ytimg.com/vi/ml6cT4AZdqI/hqdefault.jpg', videoId: 'ml6cT4AZdqI' },
    { categoryName: 'Cardio', subcategoryName: 'Beginner HIIT', title: 'Beginner HIIT Session', imageUrl: 'https://i.ytimg.com/vi/ml6cT4AZdqI/hqdefault.jpg', videoId: 'ml6cT4AZdqI' },
    { categoryName: 'Stretching', subcategoryName: 'Full Body Stretch', title: 'Full Body Stretch Routine', imageUrl: 'https://i.ytimg.com/vi/L_xrDAtykMI/hqdefault.jpg', videoId: 'L_xrDAtykMI' },
    { categoryName: 'Stretching', subcategoryName: 'Morning Stretch', title: '5-Minute Morning Stretch', imageUrl: 'https://i.ytimg.com/vi/L_xrDAtykMI/hqdefault.jpg', videoId: 'L_xrDAtykMI' },
    { categoryName: 'Healthy Diet', subcategoryName: 'Healthy Breakfast Ideas', title: '3 Healthy Breakfast Ideas', imageUrl: 'https://i.ytimg.com/vi/8aV2KYf_MXw/hqdefault.jpg', videoId: '8aV2KYf_MXw' },
    { categoryName: 'Healthy Diet', subcategoryName: 'Meal Prep Basics', title: 'Beginner Meal Prep Guide', imageUrl: 'https://i.ytimg.com/vi/Qe4qU9oxC6o/hqdefault.jpg', videoId: 'Qe4qU9oxC6o' },
  ];
  await FitnessCategory.insertMany(CATEGORIES);
  await FitnessSubcategory.insertMany(SUBCATEGORIES);
  await FitnessContentItem.insertMany(CONTENT_ITEMS);
}

// @route   GET /api/fitness/categories
// @desc    Get fitness categories (Yoga, Meditation, etc.)
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    await ensureFitnessSeeded();
    const categories = await FitnessCategory.find({}).sort({ order: 1 }).lean();
    const out = {};
    categories.forEach((c) => { out[c.name] = { icon: c.icon }; });
    res.json(out);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/fitness/plan
// @desc    AI-generated personalized fitness routine based on user preferences
// @access  Public
router.post('/plan', async (req, res) => {
  const {
    goal = 'general wellness',
    concerns = [],
    durationMinutes = 15,
    daysPerWeek = 5,
    preferredTypes = ['Yoga', 'Meditation'],
    freeText = ''
  } = req.body;

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'missing_api_key_placeholder') {
    return res.status(200).json(getFallbackPlan({ goal, durationMinutes, daysPerWeek, preferredTypes }));
  }

  try {
    const llm = new ChatGoogleGenerativeAI({
      modelName: 'gemini-1.5-flash',
      temperature: 0.3,
      apiKey
    });

    const prompt = `You are a friendly fitness and wellness coach for a mental health app. The user wants a personalized weekly routine.

User preferences:
- Goal: ${goal}
- Mental health concerns (consider these when picking exercises): ${Array.isArray(concerns) ? concerns.join(', ') : concerns}
- Time per day: ${durationMinutes} minutes
- Days per week: ${daysPerWeek}
- Preferred types: ${Array.isArray(preferredTypes) ? preferredTypes.join(', ') : preferredTypes}
${freeText ? `- Additional notes: ${freeText}` : ''}

Respond with ONLY a valid JSON object (no markdown, no code fence). Use this exact structure:
{
  "summary": "One short paragraph encouraging the user and summarizing the plan.",
  "weeklySchedule": [
    {
      "day": "Monday",
      "focus": "e.g. Yoga & Breathing",
      "exercises": [
        {
          "name": "Exercise name",
          "description": "One line description.",
          "durationMinutes": 5,
          "type": "Yoga",
          "youtubeId": "optional 11-char YouTube video ID or null"
        }
      ]
    }
  ]
}

Include exactly ${daysPerWeek} days in weeklySchedule. Each day should have 1-4 exercises totaling around ${durationMinutes} minutes. Mix types from: Yoga, Meditation, Cardio, Stretching, Breathing. For mental wellness, include meditation or breathing when user has anxiety/stress/sleep concerns. Use only valid YouTube IDs (11 characters) for youtubeId when you know a good tutorial, or null.`;
    const response = await llm.invoke(prompt);
    let text = '';
    if (response && typeof response.content === 'string') text = response.content;
    else if (response && Array.isArray(response.content)) text = (response.content[0] && response.content[0].text) ? response.content[0].text : JSON.stringify(response.content);
    else if (response && response.text) text = response.text;
    else text = String(response || '');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const plan = JSON.parse(jsonMatch[0]);
      if (!plan.weeklySchedule) plan.weeklySchedule = [];
      if (!plan.summary) plan.summary = 'Your personalized routine is ready. Stick to it for best results!';
      return res.json(plan);
    }
  } catch (err) {
    console.warn('Fitness plan AI error:', err.message);
  }
  res.json(getFallbackPlan({ goal, durationMinutes, daysPerWeek, preferredTypes }));
});

function getFallbackPlan({ goal, durationMinutes, daysPerWeek, preferredTypes }) {
  const types = Array.isArray(preferredTypes) && preferredTypes.length ? preferredTypes : ['Yoga', 'Meditation'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].slice(0, Math.min(7, Math.max(1, daysPerWeek)));
  const perDay = Math.max(1, Math.floor(durationMinutes / 10));
  return {
    summary: `Your ${daysPerWeek}-day routine focuses on ${types.join(' & ')} to support your goal: ${goal}. Each session is about ${durationMinutes} minutes.`,
    weeklySchedule: days.map((day, i) => ({
      day,
      focus: types[i % types.length],
      exercises: [
        { name: `${types[0]} flow`, description: 'Guided session for mind and body.', durationMinutes: Math.min(15, durationMinutes), type: types[0], youtubeId: types[0] === 'Yoga' ? 'v7AYKMP6rOE' : 'O-6f5wQXSu8' },
        ...(perDay > 1 ? [{ name: 'Breathing or stretch', description: 'Short cooldown.', durationMinutes: 5, type: 'Meditation', youtubeId: 'inpok4MKVLM' }] : [])
      ]
    }))
  };
}

// @route   GET /api/fitness/:category
// @desc    Get subcategories for a given category
// @access  Public
router.get('/:category', async (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category);
    if (category === 'plan' || category === 'categories') return res.status(404).json({ msg: 'Not found' });
    await ensureFitnessSeeded();
    const subs = await FitnessSubcategory.find({ categoryName: category }).sort({ order: 1 }).lean();
    const data = {};
    subs.forEach((s) => { data[s.name] = { icon: s.icon }; });
    if (Object.keys(data).length === 0) return res.status(404).json({ msg: 'Category not found' });
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/fitness/:category/:subcategory/getContent
// @desc    Get detailed content for a subcategory
// @access  Public
router.get('/:category/:subcategory/getContent', async (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category);
    const subcategory = decodeURIComponent(req.params.subcategory);
    await ensureFitnessSeeded();
    const items = await FitnessContentItem.find({ categoryName: category, subcategoryName: subcategory }).lean();
    const data = {};
    items.forEach((i) => { data[i.title] = i.imageUrl || ''; });
    if (Object.keys(data).length === 0) return res.status(404).json({ msg: 'Content not found' });
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
