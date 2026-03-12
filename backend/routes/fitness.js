const express = require('express');
const router = express.Router();
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

// Static catalog of fitness data so the app works
// even when no external APIs are available.

const FITNESS_CATEGORIES = {
  Yoga: {
    icon: 'https://cdn-icons-png.flaticon.com/512/2647/2647625.png'
  },
  Meditation: {
    icon: 'https://cdn-icons-png.flaticon.com/512/3663/3663335.png'
  },
  Cardio: {
    icon: 'https://cdn-icons-png.flaticon.com/512/10043/10043015.png'
  },
  Stretching: {
    icon: 'https://cdn-icons-png.flaticon.com/512/4144/4144158.png'
  },
  'Healthy Diet': {
    icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png'
  }
};

// Subcategories per category (e.g. Beginner Yoga, Sleep Meditation)
const FITNESS_SUBCATEGORIES = {
  Yoga: {
    'Beginner Yoga Flow': {
      icon: 'https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg'
    },
    'Yoga for Anxiety Relief': {
      icon: 'https://i.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg'
    },
    'Bedtime Yoga': {
      icon: 'https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg'
    }
  },
  Meditation: {
    '5-Minute Daily Meditation': {
      icon: 'https://i.ytimg.com/vi/O-6f5wQXSu8/hqdefault.jpg'
    },
    'Sleep Meditation': {
      icon: 'https://i.ytimg.com/vi/2OEL4P1Rz04/hqdefault.jpg'
    },
    'Anxiety-Calming Breath': {
      icon: 'https://i.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg'
    }
  },
  Cardio: {
    'Low Impact Cardio': {
      icon: 'https://i.ytimg.com/vi/ml6cT4AZdqI/hqdefault.jpg'
    },
    'Beginner HIIT': {
      icon: 'https://i.ytimg.com/vi/ml6cT4AZdqI/hqdefault.jpg'
    }
  },
  Stretching: {
    'Full Body Stretch': {
      icon: 'https://i.ytimg.com/vi/L_xrDAtykMI/hqdefault.jpg'
    },
    'Morning Stretch': {
      icon: 'https://i.ytimg.com/vi/L_xrDAtykMI/hqdefault.jpg'
    }
  },
  'Healthy Diet': {
    'Healthy Breakfast Ideas': {
      icon: 'https://i.ytimg.com/vi/8aV2KYf_MXw/hqdefault.jpg'
    },
    'Meal Prep Basics': {
      icon: 'https://i.ytimg.com/vi/Qe4qU9oxC6o/hqdefault.jpg'
    }
  }
};

// Individual content items per (category, subcategory).
// The front-end expects an object: { [title]: imageUrl }
const FITNESS_CONTENT = {
  Yoga: {
    'Beginner Yoga Flow': {
      '10-Minute Beginner Yoga': 'https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg',
      'Gentle Morning Yoga': 'https://i.ytimg.com/vi/KmYdVq47UOU/hqdefault.jpg'
    },
    'Yoga for Anxiety Relief': {
      'Yoga for Anxiety and Stress': 'https://i.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg',
      'Calming Yoga for Worry': 'https://i.ytimg.com/vi/b1H3xO3x_Js/hqdefault.jpg'
    },
    'Bedtime Yoga': {
      'Bedtime Yoga for Relaxation': 'https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg'
    }
  },
  Meditation: {
    '5-Minute Daily Meditation': {
      'Quick Reset Meditation': 'https://i.ytimg.com/vi/O-6f5wQXSu8/hqdefault.jpg'
    },
    'Sleep Meditation': {
      'Deep Sleep Talk Down': 'https://i.ytimg.com/vi/2OEL4P1Rz04/hqdefault.jpg'
    },
    'Anxiety-Calming Breath': {
      'Breathing for Anxiety Relief': 'https://i.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg'
    }
  },
  Cardio: {
    'Low Impact Cardio': {
      'Low Impact Cardio Workout': 'https://i.ytimg.com/vi/ml6cT4AZdqI/hqdefault.jpg'
    },
    'Beginner HIIT': {
      'Beginner HIIT Session': 'https://i.ytimg.com/vi/ml6cT4AZdqI/hqdefault.jpg'
    }
  },
  Stretching: {
    'Full Body Stretch': {
      'Full Body Stretch Routine': 'https://i.ytimg.com/vi/L_xrDAtykMI/hqdefault.jpg'
    },
    'Morning Stretch': {
      '5-Minute Morning Stretch': 'https://i.ytimg.com/vi/L_xrDAtykMI/hqdefault.jpg'
    }
  },
  'Healthy Diet': {
    'Healthy Breakfast Ideas': {
      '3 Healthy Breakfast Ideas': 'https://i.ytimg.com/vi/8aV2KYf_MXw/hqdefault.jpg'
    },
    'Meal Prep Basics': {
      'Beginner Meal Prep Guide': 'https://i.ytimg.com/vi/Qe4qU9oxC6o/hqdefault.jpg'
    }
  }
};

// @route   GET /api/fitness/categories
// @desc    Get fitness categories (Yoga, Meditation, etc.)
// @access  Public
router.get('/categories', (req, res) => {
  try {
    res.json(FITNESS_CATEGORIES);
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
router.get('/:category', (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category);
    const data = FITNESS_SUBCATEGORIES[category];

    if (!data) {
      return res.status(404).json({ msg: 'Category not found' });
    }

    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/fitness/:category/:subcategory/getContent
// @desc    Get detailed content for a subcategory
// @access  Public
router.get('/:category/:subcategory/getContent', (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category);
    const subcategory = decodeURIComponent(req.params.subcategory);

    const categoryContent = FITNESS_CONTENT[category];
    if (!categoryContent || !categoryContent[subcategory]) {
      return res.status(404).json({ msg: 'Content not found' });
    }

    res.json(categoryContent[subcategory]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
