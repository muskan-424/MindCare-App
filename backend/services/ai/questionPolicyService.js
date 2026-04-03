const BASE_QUESTIONS = {
  text: [
    'What has felt most emotionally difficult for you this week?',
    'Describe one moment today where you felt overwhelmed or disconnected.',
    'What thoughts keep returning when your stress rises?',
  ],
  voice: [
    'In your own words, how would you describe your current emotional state?',
    'Talk through what has been most draining for you recently.',
    'Describe what support would feel most helpful right now.',
  ],
};

function getSessionQuestions() {
  return {
    textPrompts: BASE_QUESTIONS.text,
    voicePrompts: BASE_QUESTIONS.voice,
    policyVersion: 'question-policy-v1',
  };
}

module.exports = { getSessionQuestions };
