const { batchTranslateStrings } = require('../../../shared/batchTranslate');
const { normalizeLanguage } = require('../../../shared/locale');

const BASE_QUESTIONS = {
  text: [
    'What has felt most emotionally difficult for you this week?',
    'Describe one moment today where you felt overwhelmed or disconnected.',
    'What thoughts keep returning when your stress rises?',
    'If you could change one thing about how you felt today, what would it be?',
    'Describe a situation recently where you felt proud of how you handled a challenge.',
    'What is taking up the most mental space for you right now?',
    'How would you describe your energy levels over the last 48 hours?',
    'Are there any physical sensations (tight chest, headaches, fatigue) you are noticing?',
    'When you wake up, what is the very first feeling you experience?',
    'Describe how you feel about the expectations placed upon you right now.',
    'Is there a conversation or interaction that is weighing heavily on your mind?',
    'What is one self-care activity you neglected recently because you felt too drained?',
    'Did you find yourself reacting with frustration to something minor today? What was it?',
    'How connected or isolated do you feel from your support system right now?',
    'If your current mood was a weather pattern, how would you describe it?',
    'Write about a moment today where you actually felt a sense of relief or peace.',
    'Describe how supported you feel in your current academic or work environment.',
    'What is an underlying worry you haven\'t spoken out loud recently?',
    'How is your sleep quality affecting your emotional stability during the day?',
    'Did you feel a lack of motivation to complete everyday tasks today? Describe your feelings toward them.',
  ],
  voice: [
    'In your own words, how would you describe your current emotional state?',
    'Talk through what has been most draining for you recently.',
    'Describe what support would feel most helpful right now.',
  ],
};

function getRandomSubset(arr, n) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

function getSessionQuestions(textCount = 8) {
  const selectedTextPrompts = getRandomSubset(BASE_QUESTIONS.text, textCount);
  return {
    textPrompts: selectedTextPrompts,
    voicePrompts: BASE_QUESTIONS.voice,
    policyVersion: 'question-policy-v2-dynamic-8',
  };
}

async function getLocalizedSessionQuestions(language, textCount = 8) {
  const base = getSessionQuestions(textCount);
  const lang = normalizeLanguage(language);
  if (lang === 'en') return base;

  const combined = [...base.textPrompts, ...base.voicePrompts];
  const translated = await batchTranslateStrings(combined, lang);
  const textPrompts = translated.slice(0, base.textPrompts.length);
  const voicePrompts = translated.slice(base.textPrompts.length);

  return {
    textPrompts,
    voicePrompts,
    policyVersion: `${base.policyVersion}-${lang}`,
  };
}

module.exports = { getSessionQuestions, getLocalizedSessionQuestions };
