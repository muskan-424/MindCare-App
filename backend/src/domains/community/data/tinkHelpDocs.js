/**
 * tinkHelpDocs.js
 * Local knowledge base for Tink's RAG (Retrieval-Augmented Generation).
 * Each chunk is a small, self-contained help/FAQ snippet about how the
 * MindCare app works. The RAG service scores these against the user's
 * question and feeds the top matches into the reply as grounded FACTS.
 *
 * This is the "local docs" mode (always available). When USE_PINECONE_RAG
 * is enabled a vector store can be layered on top, but local docs guarantee
 * the assistant can answer app-help questions offline / without API keys.
 */

const helpDocs = [
  {
    id: 'privacy',
    title: 'Privacy & data',
    tags: ['privacy', 'data', 'confidential', 'secure', 'safe', 'share', 'anonymous', 'gdpr', 'delete account'],
    text: 'Your entries are private. Mood logs, journals, and assessment results are visible only to you and, if you choose to connect to a care team, the therapist you are matched with. Peer matching is anonymised — other users see an alias, never your real name. You can delete your account and data anytime from Profile > Delete Account.',
  },
  {
    id: 'assessment',
    title: 'How the AI assessment works',
    tags: ['assessment', 'intake', 'multidimensional', 'check-in', 'checkin', 'ai', 'camera', 'voice', 'face', 'burnout', 'risk', 'how does the assessment work'],
    text: 'The Multidimensional Assessment is a short daily check-in that combines three signals — what you write, how you sound, and your facial expression — into one wellness reading. Each part is analysed separately and then fused into a single risk level (Low, Medium, High, Critical) with personalised suggestions. It is supportive guidance, not a medical diagnosis.',
  },
  {
    id: 'crisis',
    title: 'Crisis support',
    tags: ['crisis', 'emergency', 'suicide', 'self-harm', 'help now', 'helpline', 'danger', 'hurt myself', 'safety'],
    text: 'If you are in crisis or thinking about harming yourself, you are not alone and help is available 24/7. Use the Crisis Resources screen for helplines, or set up a trusted Emergency Contact in your Profile. In an emergency, please contact local emergency services. Tink is supportive but is not a substitute for professional or emergency care.',
  },
  {
    id: 'mood',
    title: 'Mood tracking',
    tags: ['mood', 'track', 'rating', 'feeling', 'log mood', 'mood trend', 'chart', 'history'],
    text: 'Mood tracking lets you log how you feel on a 1–10 scale with an optional note. Over time the Mood Tracker shows your trend, average, and streaks so you can spot patterns. Logging daily also powers your check-in streak and badges.',
  },
  {
    id: 'journal',
    title: 'Journaling',
    tags: ['journal', 'journaling', 'write', 'diary', 'entry', 'reflect', 'thoughts'],
    text: 'Journaling gives you a private space to write freely. After you save an entry, the app gently analyses the emotional tone and flags entries that suggest you might need extra support, with an option to talk to Tink. Your journals are private to you.',
  },
  {
    id: 'goals',
    title: 'Goal tracking',
    tags: ['goal', 'goals', 'milestone', 'progress', 'habit', 'target', 'track goals'],
    text: 'The Goal Tracker helps you set personal wellness goals (like meditation, sleep, or social connection), break them into milestones, and track progress from 0–100%. Goals automatically mark complete when you reach 100%.',
  },
  {
    id: 'appointments',
    title: 'Therapy appointments',
    tags: ['appointment', 'therapist', 'session', 'book', 'consultation', 'counselor', 'counsellor', 'doctor'],
    text: 'You can request a therapy consultation from the app. Choose a preferred speciality, dates, and time, and add a note about what you need help with. An admin reviews the request and assigns a therapist, then confirms your slot. You can view and modify requests under Profile > My Requests & Appointments.',
  },
  {
    id: 'peers',
    title: 'Peer matching',
    tags: ['peer', 'peers', 'matching', 'connect', 'community', 'others', 'similar'],
    text: 'Peer Matching connects you anonymously with other people who share similar concerns, so you can support each other. You appear under an alias, you choose whether to enable discovery, and you control who you connect with.',
  },
  {
    id: 'groups',
    title: 'Group sessions',
    tags: ['group', 'group session', 'group therapy', 'session', 'join', 'register'],
    text: 'Group Sessions are facilitator-led therapeutic meetings you can register for. Browse upcoming sessions, register for a spot, and join the room at the scheduled time from your registered list.',
  },
  {
    id: 'resources',
    title: 'Self-help & resources',
    tags: ['resource', 'resources', 'self-help', 'breathing', 'grounding', 'gratitude', 'affirmation', 'tools', 'exercise'],
    text: 'The app includes self-help tools like guided breathing, 5-4-3-2-1 grounding, gratitude prompts, and affirmations. Your care team can also assign curated resources, which appear under Profile > Curated Resources.',
  },
  {
    id: 'streaks',
    title: 'Streaks & badges',
    tags: ['streak', 'badge', 'badges', 'achievement', 'milestone', 'gamification', 'reward'],
    text: 'Checking in daily builds a streak and earns badges that celebrate your consistency. You can view your achievements and progress toward the next milestone on the Badges screen.',
  },
  {
    id: 'tink',
    title: 'About Tink',
    tags: ['tink', 'who are you', 'assistant', 'chatbot', 'bot', 'what can you do', 'help'],
    text: 'Tink is your in-app wellness companion. Tink can listen and support you, answer questions about how the app works, show your mood/journal/goal/appointment info, and help you log a mood, write a journal, set a goal, or request a therapy session — all from chat. Tink is not a licensed clinician and never gives medical diagnoses.',
  },
];

module.exports = { helpDocs };
