/**
 * tinkChatService.js
 * ------------------------------------------------------------------
 * The "brain" behind Tink — MindCare's conversational AI assistant.
 *
 * Responsibilities:
 *   1. Build a rich, language-aware system prompt (persona + safety +
 *      long-term memory + user context).
 *   2. Call Google Gemini in STRUCTURED JSON mode so a single request
 *      returns the reply, quick-reply suggestions, a detected intent,
 *      a crisis flag and the detected language.
 *   3. Provide deterministic crisis keyword detection as a safety net.
 *   4. Maintain a rolling conversation "summary" used as memory.
 *
 * This service is intentionally dependency-light (uses global fetch,
 * available on Node >= 18) so it works in serverless cold starts.
 */

const { config } = require('../../../../config/env');

const GEMINI_FALLBACKS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-1.5-flash'];

/** Deduplicated model list for a given role/complexity. */
function pickModels({ message = '', facts = '', history = [], role = 'reply' } = {}) {
  const fast = [config.ai.fastModel, ...GEMINI_FALLBACKS];
  const quality = [config.ai.qualityModel, ...GEMINI_FALLBACKS];
  if (role === 'classify' || role === 'summary' || role === 'refine' || role === 'translate') {
    return { models: [...new Set(fast)], tier: 'fast' };
  }
  const complexity = String(message).length + String(facts).length + (history?.length || 0) * 50;
  const tier = complexity >= config.ai.complexityChars ? 'quality' : 'fast';
  return { models: [...new Set(tier === 'quality' ? quality : fast)], tier };
}

// ── Supported languages (code → human-readable name for the prompt) ──────────
const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  pa: 'Punjabi',
  mr: 'Marathi',
  bn: 'Bengali',
  te: 'Telugu',
  ta: 'Tamil',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  ar: 'Arabic',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
  ru: 'Russian',
};

// ── Crisis detection keywords (multi-lingual, deterministic safety net) ──────
const CRISIS_PATTERNS = [
  /\bsuicid/i, /\bkill myself\b/i, /\bend my life\b/i, /\bwant to die\b/i,
  /\bself[-\s]?harm\b/i, /\bhurt myself\b/i, /\bcut myself\b/i, /\bno reason to live\b/i,
  /\bcan'?t go on\b/i, /\bbetter off dead\b/i, /\btake my (own )?life\b/i,
  /आत्महत्या/, /खुदकुशी/, /मरना चाहता/, /मरना चाहती/, /जान दे/,
  /আত্মহত্যা/, /தற்கொலை/, /ఆత్మహత్య/, / آذي نفسي/, /انتحار/,
  /自杀/, /想死/, /自殺/,
];

function detectCrisis(text) {
  if (!text || typeof text !== 'string') return false;
  return CRISIS_PATTERNS.some(re => re.test(text));
}

// ── Localized fallback strings (rule/mock mode; en + hi + pa + mr) ───────────
const FALLBACK_STRINGS = {
  en: {
    mock_reply: "I'm here with you. (My AI connection isn't configured right now, but I'm still listening — how are you feeling?)",
    error_reply: "I'm so sorry — I'm having trouble thinking clearly right now. I'm still here though. Could you tell me a little more about what's going on?",
    verification_note: "I'm not fully sure I understood — here's what I can tell you from what I found. Feel free to rephrase if this misses the mark.",
    rule_draft: "Sure — I've prepared this for you: {summary}. Review the card below and tap confirm when you're ready.",
    rule_more_info: "I'm here to help. Could you tell me a little more about what you're looking for?",
    login_required: "I'd love to help with that, but I can't access your personal info until you're logged in. Please log in and ask me again.",
    mock_suggestions: ["I feel anxious", "I feel low", "I just need to talk"],
    error_suggestions: ['Try again', 'I feel overwhelmed', 'Just venting'],
    card_crisis_title: 'You are not alone',
    card_crisis_subtitle: 'Free, confidential help is available 24/7 in India',
    card_crisis_resources: 'View crisis resources',
    card_crisis_emergency: 'Emergency contact',
  },
  hi: {
    mock_reply: 'मैं आपके साथ हूँ। (अभी AI कनेक्शन कॉन्फ़िगर नहीं है, लेकिन मैं सुन रहा हूँ — आप कैसा महसूस कर रहे हैं?)',
    error_reply: 'माफ़ कीजिए — अभी मुझे साफ़ सोचने में परेशानी हो रही है। फिर भी मैं यहाँ हूँ। क्या आप थोड़ा और बता सकते हैं?',
    verification_note: 'मुझे पूरी तरह समझ नहीं आया — यह मिला। अगर गलत लगे तो दोबारा लिखें।',
    rule_draft: 'ठीक है — मैंने यह तैयार किया: {summary}। नीचे कार्ड देखें और तैयार होने पर पुष्टि करें।',
    rule_more_info: 'मैं मदद के लिए यहाँ हूँ। क्या आप थोड़ा और बता सकते हैं कि आप क्या ढूँढ रहे हैं?',
    login_required: 'मैं मदद करना चाहूँगा, लेकिन लॉग इन किए बिना आपकी जानकारी नहीं देख सकता। कृपया लॉग इन करके फिर पूछें।',
    mock_suggestions: ['मुझे घबराहट है', 'मेरा मन उदास है', 'मुझे बस बात करनी है'],
    error_suggestions: ['फिर प्रयास करें', 'मैं परेशान हूँ', 'बस दिल की बात'],
    card_crisis_title: 'आप अकेले नहीं हैं',
    card_crisis_subtitle: 'भारत में 24/7 मुफ़्त, गोपनीय सहायता उपलब्ध है',
    card_crisis_resources: 'संकट संसाधन देखें',
    card_crisis_emergency: 'आपातकालीन संपर्क',
  },
  pa: {
    mock_reply: 'ਮੈਂ ਤੁਹਾਡੇ ਨਾਲ ਹਾਂ। (AI ਕਨੈਕਸ਼ਨ ਹੁਣ ਕੌਨਫਿਗਰ ਨਹੀਂ, ਪਰ ਮੈਂ ਸੁਣ ਰਿਹਾ ਹਾਂ — ਤੁਸੀਂ ਕਿਵੇਂ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ?)',
    error_reply: 'ਮਾਫ਼ ਕਰਨਾ — ਹੁਣ ਸਾਫ਼ ਸੋਚਣ ਵਿੱਚ ਮੁਸ਼ਕਲ ਆ ਰਹੀ ਹੈ। ਫਿਰ ਵੀ ਮੈਂ ਇੱਥੇ ਹਾਂ। ਕੀ ਤੁਸੀਂ ਹੋਰ ਦੱਸ ਸਕਦੇ ਹੋ?',
    verification_note: 'ਮੈਨੂੰ ਪੂਰੀ ਤਰ੍ਹਾਂ ਸਮਝ ਨਹੀਂ ਆਈ — ਇਹ ਮਿਲਿਆ। ਗਲਤ ਲੱਗੇ ਤਾਂ ਦੁਬਾਰਾ ਲਿਖੋ।',
    rule_draft: 'ਠੀਕ ਹੈ — ਮੈਂ ਇਹ ਤਿਆਰ ਕੀਤਾ: {summary}। ਹੇਠਾਂ ਕਾਰਡ ਦੇਖੋ ਅਤੇ ਤਿਆਰ ਹੋਣ ਤੇ ਪੁਸ਼ਟੀ ਕਰੋ।',
    rule_more_info: 'ਮੈਂ ਮਦਦ ਲਈ ਇੱਥੇ ਹਾਂ। ਕੀ ਤੁਸੀਂ ਹੋਰ ਦੱਸ ਸਕਦੇ ਹੋ?',
    login_required: 'ਮੈਂ ਮਦਦ ਕਰਨਾ ਚਾਹੁੰਦਾ ਹਾਂ, ਪਰ ਲੌਗ ਇਨ ਕੀਤੇ ਬਿਨਾਂ ਜਾਣਕਾਰੀ ਨਹੀਂ ਵੇਖ ਸਕਦਾ। ਕਿਰਪਾ ਕਰਕੇ ਲੌਗ ਇਨ ਕਰੋ।',
    mock_suggestions: ['ਮੈਨੂੰ ਘਬਰਾਹਟ ਹੈ', 'ਮੇਰਾ ਮਨ ਉਦਾਸ ਹੈ', 'ਮੈਨੂੰ ਬਸ ਗੱਲ ਕਰਨੀ ਹੈ'],
    error_suggestions: ['ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼', 'ਮੈਂ ਪਰੇਸ਼ਾਨ ਹਾਂ', 'ਬਸ ਦਿਲ ਦੀ ਗੱਲ'],
    card_crisis_title: 'ਤੁਸੀਂ ਇਕੱਲੇ ਨਹੀਂ ਹੋ',
    card_crisis_subtitle: 'ਭਾਰਤ ਵਿੱਚ 24/7 ਮੁਫ਼ਤ, ਗੁਪਤ ਮਦਦ ਉਪਲਬਧ ਹੈ',
    card_crisis_resources: 'ਸੰਕਟ ਸਰੋਤ ਵੇਖੋ',
    card_crisis_emergency: 'ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ',
  },
  mr: {
    mock_reply: 'मी तुमच्यासोबत आहे. (AI कनेक्शन आत्ता कॉन्फिगर नाही, पण मी ऐकत आहे — तुम्हाला कसे वाटते?)',
    error_reply: 'माफ करा — आत्ता स्पष्ट विचार करण्यात अडचण येत आहे. तरीही मी इथे आहे. थोडे अधिक सांगू शकाल का?',
    verification_note: 'मला पूर्णपणे समजले नाही — हे सापडले. चुकीचे वाटल्यास पुन्हा लिहा.',
    rule_draft: 'ठीक आहे — मी हे तयार केले: {summary}. खालील कार्ड पहा आणि तयार असाल तेव्हा पुष्टी करा.',
    rule_more_info: 'मी मदतीसाठी इथे आहे. तुम्ही काय शोधत आहात थोडे अधिक सांगू शकाल का?',
    login_required: 'मला मदत करायची आहे, पण लॉग इन न करता माहिती पाहू शकत नाही. कृपया लॉग इन करा.',
    mock_suggestions: ['मला घाबराट वाटते', 'मी उदास आहे', 'मला फक्त बोलायचे आहे'],
    error_suggestions: ['पुन्हा प्रयत्न', 'मी अधिक भारावलेला आहे', 'फक्त मनातले शब्द'],
    card_crisis_title: 'तुम्ही एकटे नाही',
    card_crisis_subtitle: 'भारतात 24/7 विनामूल्य, गोपनीय मदत उपलब्ध',
    card_crisis_resources: 'संकट संसाधने पहा',
    card_crisis_emergency: 'आणीबाणी संपर्क',
  },
  bn: {
    mock_reply: 'আমি আপনার সাথে আছি। (এখন AI সংযোগ কনফিগার করা নেই, তবে আমি শুনছি — আপনি কেমন অনুভব করছেন?)',
    error_reply: 'দুঃখিত — এখন স্পষ্টভাবে ভাবতে সমস্যা হচ্ছে। তবুও আমি এখানে আছি। আর একটু বলবেন?',
    verification_note: 'আমি পুরোপুরি বুঝতে পারিনি — এটা পেয়েছি। ভুল মনে হলে আবার লিখুন।',
    rule_draft: 'ঠিক আছে — আমি এটি প্রস্তুত করেছি: {summary}। নিচের কার্ড দেখুন এবং প্রস্তুত হলে নিশ্চিত করুন।',
    rule_more_info: 'আমি সাহায্যের জন্য এখানে আছি। আপনি কী খুঁজছেন আর একটু বলবেন?',
    login_required: 'আমি সাহায্য করতে চাই, কিন্তু লগ ইন না করে আপনার তথ্য দেখতে পারি না। লগ ইন করে আবার জিজ্ঞাসা করুন।',
    mock_suggestions: ['আমি উদ্বিগ্ন', 'আমার মন খারাপ', 'শুধু কথা বলতে চাই'],
    error_suggestions: ['আবার চেষ্টা করুন', 'আমি অভিভূত', 'শুধু মনের কথা'],
    card_crisis_title: 'আপনি একা নন',
    card_crisis_subtitle: 'ভারতে ২৪/৭ বিনামূল্যে, গোপনীয় সহায়তা উপলব্ধ',
    card_crisis_resources: 'সংকট সম্পদ দেখুন',
    card_crisis_emergency: 'জরুরি যোগাযোগ',
  },
  te: {
    mock_reply: 'నేను మీతో ఉన్నాను. (AI కనెక్షన్ ఇప్పుడు కాన్ఫిగర్ కాలేదు, కానీ నేను వింటున్నాను — మీరు ఎలా భావిస్తున్నారు?)',
    error_reply: 'క్షమించండి — ఇప్పుడు స్పష్టంగా ఆలోచించడంలో ఇబ్బంది. అయినా నేను ఇక్కడ ఉన్నాను. మరింత చెప్పగలరా?',
    verification_note: 'నాకు పూర్తిగా అర్థం కాలేదు — ఇది దొరికింది. తప్పుగా అనిపిస్తే మళ్లీ రాయండి.',
    rule_draft: 'సరే — నేను ఇది సిద్ధం చేశాను: {summary}. క్రింద కార్డ్ చూడండి మరియు సిద్ధంగా ఉన్నప్పుడు నిర్ధారించండి.',
    rule_more_info: 'సహాయం చేయడానికి నేను ఇక్కడ ఉన్నాను. మీరు ఏమి వెతుకుతున్నారో మరింత చెప్పగలరా?',
    login_required: 'నేను సహాయం చేయాలనుకుంటున్నాను, కానీ లాగిన్ చేయకుండా మీ సమాచారాన్ని చూడలేను. దయచేసి లాగిన్ చేసి మళ్లీ అడగండి.',
    mock_suggestions: ['నాకు ఆందోళన', 'నాకు విచారం', 'కేవలం మాట్లాడాలి'],
    error_suggestions: ['మళ్లీ ప్రయత్నించండి', 'నేను ఒత్తిడిలో ఉన్నాను', 'కేవలం మనసులో మాట'],
    card_crisis_title: 'మీరు ఒంటరిగా లేరు',
    card_crisis_subtitle: 'భారతదేశంలో 24/7 ఉచిత, గోప్య సహాయం అందుబాటులో ఉంది',
    card_crisis_resources: 'సంక్షోభ వనరులు చూడండి',
    card_crisis_emergency: 'అత్యవసర సంప్రదింపు',
  },
  ta: {
    mock_reply: 'நான் உங்களுடன் இருக்கிறேன். (AI இணைப்பு இப்போது அமைக்கப்படவில்லை, ஆனால் நான் கேட்கிறேன் — நீங்கள் எப்படி உணர்கிறீர்கள்?)',
    error_reply: 'மன்னிக்கவும் — இப்போது தெளிவாக சிந்திக்க சிரமமாக உள்ளது. இருந்தாலும் நான் இங்கே இருக்கிறேன். இன்னும் கொஞ்சம் சொல்ல முடியுமா?',
    verification_note: 'எனக்கு முழுமையாகப் புரியவில்லை — இதைக் கண்டேன். தவறாக இருந்தால் மீண்டும் எழுதுங்கள்.',
    rule_draft: 'சரி — நான் இதைத் தயார் செய்துள்ளேன்: {summary}. கீழே உள்ள அட்டையைப் பார்த்து தயாரான பிறகு உறுதிப்படுத்துங்கள்.',
    rule_more_info: 'உதவ நான் இங்கே இருக்கிறேன். நீங்கள் எதைத் தேடுகிறீர்கள் என்று இன்னும் கொஞ்சம் சொல்ல முடியுமா?',
    login_required: 'நான் உதவ விரும்புகிறேன், ஆனால் உள்நுழையாமல் உங்கள் தகவலைப் பார்க்க முடியாது. தயவுசெய்து உள்நுழைந்து மீண்டும் கேளுங்கள்.',
    mock_suggestions: ['எனக்கு கவலை', 'எனக்கு சோகம்', 'வெறும் பேச வேண்டும்'],
    error_suggestions: ['மீண்டும் முயற்சிக்கவும்', 'நான் அதிகமாக அழுத்தத்தில்', 'வெறும் மனதின் பேச்சு'],
    card_crisis_title: 'நீங்கள் தனியாக இல்லை',
    card_crisis_subtitle: 'இந்தியாவில் 24/7 இலவச, ரகசிய உதவி கிடைக்கிறது',
    card_crisis_resources: 'நெருக்கடி வளங்களைப் பார்க்கவும்',
    card_crisis_emergency: 'அவசர தொடர்பு',
  },
  gu: {
    mock_reply: 'હું તમારી સાથે છું. (AI કનેક્શન હમણાં કોન્ફિગર નથી, પણ હું સાંભળી રહ્યો છું — તમે કેવું અનુભવો છો?)',
    error_reply: 'માફ કરશો — હમણાં સ્પષ્ટ વિચારવામાં મુશ્કેલી આવી રહી છે. છતાં હું અહીં છું. થોડું વધુ કહી શકો?',
    verification_note: 'મને સંપૂર્ણ સમજાયું નહીં — આ મળ્યું. ખોટું લાગે તો ફરી લખો.',
    rule_draft: 'ઠીક છે — મેં આ તૈયાર કર્યું: {summary}. નીચે કાર્ડ જુઓ અને તૈયાર હો ત્યારે પુષ્ટિ કરો.',
    rule_more_info: 'મદદ માટે હું અહીં છું. તમે શું શોધી રહ્યા છો થોડું વધુ કહી શકો?',
    login_required: 'હું મદદ કરવા માંગુ છું, પણ લૉગ ઇન કર્યા વગર તમારી માહિતી જોઈ શકતો નથી. કૃપા કરીને લૉગ ઇન કરી ફરી પૂછો.',
    mock_suggestions: ['મને ચિંતા છે', 'હું ઉદાસ છું', 'ફક્ત વાત કરવી છે'],
    error_suggestions: ['ફરી પ્રયાસ કરો', 'હું ઓવરવ્હેલ્મ છું', 'ફક્ત મનની વાત'],
    card_crisis_title: 'તમે એકલા નથી',
    card_crisis_subtitle: 'ભારતમાં 24/7 મફત, ગુપ્ત મદદ ઉપલબ્ધ છે',
    card_crisis_resources: 'સંકટ સંસાધનો જુઓ',
    card_crisis_emergency: 'ઇમરજન્સી સંપર્ક',
  },
  kn: {
    mock_reply: 'ನಾನು ನಿಮ್ಮ ಜೊತೆ ಇದ್ದೇನೆ. (AI ಸಂಪರ್ಕ ಈಗ ಕಾನ್ಫಿಗರ್ ಆಗಿಲ್ಲ, ಆದರೆ ನಾನು ಕೇಳುತ್ತಿದ್ದೇನೆ — ನೀವು ಹೇಗೆ ಭಾವಿಸುತ್ತಿದ್ದೀರಿ?)',
    error_reply: 'ಕ್ಷಮಿಸಿ — ಈಗ ಸ್ಪಷ್ಟವಾಗಿ ಯೋಚಿಸಲು ತೊಂದರೆಯಾಗುತ್ತಿದೆ. ಆದರೂ ನಾನು ಇಲ್ಲಿದ್ದೇನೆ. ಇನ್ನಷ್ಟು ಹೇಳಬಹುದೇ?',
    verification_note: 'ನನಗೆ ಸಂಪೂರ್ಣವಾಗಿ ಅರ್ಥವಾಗಲಿಲ್ಲ — ಇದು ಸಿಕ್ಕಿತು. ತಪ್ಪಾಗಿದ್ದರೆ ಮತ್ತೆ ಬರೆಯಿರಿ.',
    rule_draft: 'ಸರಿ — ನಾನು ಇದನ್ನು ತಯಾರಿಸಿದ್ದೇನೆ: {summary}. ಕೆಳಗಿನ ಕಾರ್ಡ್ ನೋಡಿ ಮತ್ತು ಸಿದ್ಧರಾದಾಗ ದೃಢೀಕರಿಸಿ.',
    rule_more_info: 'ಸಹಾಯ ಮಾಡಲು ನಾನು ಇಲ್ಲಿದ್ದೇನೆ. ನೀವು ಏನು ಹುಡುಕುತ್ತಿದ್ದೀರಿ ಇನ್ನಷ್ಟು ಹೇಳಬಹುದೇ?',
    login_required: 'ನಾನು ಸಹಾಯ ಮಾಡಲು ಬಯಸುತ್ತೇನೆ, ಆದರೆ ಲಾಗ್ ಇನ್ ಮಾಡದೆ ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ನೋಡಲು ಸಾಧ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಲಾಗ್ ಇನ್ ಮಾಡಿ ಮತ್ತೆ ಕೇಳಿ.',
    mock_suggestions: ['ನನಗೆ ಆತಂಕ', 'ನಾನು ದುಃಖಿಯಾಗಿದ್ದೇನೆ', 'ಕೇವಲ ಮಾತನಾಡಬೇಕು'],
    error_suggestions: ['ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ', 'ನಾನು ಒತ್ತಡದಲ್ಲಿದ್ದೇನೆ', 'ಕೇವಲ ಮನಸ್ಸಿನ ಮಾತು'],
    card_crisis_title: 'ನೀವು ಒಬ್ಬರಲ್ಲ',
    card_crisis_subtitle: 'ಭಾರತದಲ್ಲಿ 24/7 ಉಚಿತ, ಗೌಪ್ಯ ಸಹಾಯ ಲಭ್ಯವಿದೆ',
    card_crisis_resources: 'ಬಿಕ್ಕಟ್ಟು ಸಂಪನ್ಮೂಲಗಳನ್ನು ನೋಡಿ',
    card_crisis_emergency: 'ತುರ್ತು ಸಂಪರ್ಕ',
  },
  ml: {
    mock_reply: 'ഞാൻ നിങ്ങളോടൊപ്പമുണ്ട്. (AI കണക്ഷൻ ഇപ്പോൾ കോൺഫിഗർ ചെയ്തിട്ടില്ല, പക്ഷേ ഞാൻ കേൾക്കുന്നു — നിങ്ങൾ എങ്ങനെ അനുഭവിക്കുന്നു?)',
    error_reply: 'ക്ഷമിക്കണം — ഇപ്പോൾ വ്യക്തമായി ചിന്തിക്കാൻ ബുദ്ധിമുട്ടാണ്. എങ്കിലും ഞാൻ ഇവിടെയുണ്ട്. കുറച്ചുകൂടി പറയാമോ?',
    verification_note: 'എനിക്ക് പൂർണ്ണമായി മനസ്സിലായില്ല — ഇത് കിട്ടി. തെറ്റാണെന്ന് തോന്നുന്നുവെങ്കിൽ വീണ്ടും എഴുതുക.',
    rule_draft: 'ശരി — ഞാൻ ഇത് തയ്യാറാക്കി: {summary}. താഴെയുള്ള കാർഡ് നോക്കി തയ്യാറാകുമ്പോൾ സ്ഥിരീകരിക്കുക.',
    rule_more_info: 'സഹായിക്കാൻ ഞാൻ ഇവിടെയുണ്ട്. നിങ്ങൾ എന്താണ് തിരയുന്നതെന്ന് കുറച്ചുകൂടി പറയാമോ?',
    login_required: 'ഞാൻ സഹായിക്കാൻ ആഗ്രഹിക്കുന്നു, പക്ഷേ ലോഗിൻ ചെയ്യാതെ നിങ്ങളുടെ വിവരങ്ങൾ കാണാൻ കഴിയില്ല. ദയവായി ലോഗിൻ ചെയ്ത് വീണ്ടും ചോദിക്കുക.',
    mock_suggestions: ['എനിക്ക് ആശങ്ക', 'എനിക്ക് വ്യാകുലത', 'വെറും സംസാരിക്കണം'],
    error_suggestions: ['വീണ്ടും ശ്രമിക്കുക', 'ഞാൻ അതിക്രമിച്ചിരിക്കുന്നു', 'വെറും മനസ്സിലെ വാക്കുകൾ'],
    card_crisis_title: 'നിങ്ങൾ ഒറ്റയല്ല',
    card_crisis_subtitle: 'ഇന്ത്യയിൽ 24/7 സൗജന്യ, രഹസ്യ സഹായം ലഭ്യമാണ്',
    card_crisis_resources: 'അടിയന്തര വിഭവങ്ങൾ കാണുക',
    card_crisis_emergency: 'അടിയന്തര ബന്ധം',
  },
};

function fallbackString(language, key, vars = {}) {
  const pack = FALLBACK_STRINGS[language] || FALLBACK_STRINGS.en;
  let text = pack[key] || FALLBACK_STRINGS.en[key] || '';
  Object.entries(vars).forEach(([k, v]) => {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  });
  return text;
}

function fallbackList(language, key) {
  const pack = FALLBACK_STRINGS[language] || FALLBACK_STRINGS.en;
  const list = pack[key] || FALLBACK_STRINGS.en[key];
  return Array.isArray(list) ? list : [];
}

function getVerificationNote(language = 'en') {
  return fallbackString(language, 'verification_note');
}

// ── Intent → actionable card mapping (rendered as rich cards in the app) ─────
const INTENT_CARDS = {
  breathing: { type: 'action', intent: 'breathing', icon: 'leaf', titleKey: 'card_breathing_title', subtitleKey: 'card_breathing_subtitle', title: 'Try a breathing exercise', subtitle: '60-second calm-down', route: 'Breathing' },
  grounding: { type: 'action', intent: 'grounding', icon: 'hand-left', titleKey: 'card_grounding_title', subtitleKey: 'card_grounding_subtitle', title: '5-4-3-2-1 grounding', subtitle: 'Reconnect with the present', route: 'Grounding' },
  journaling: { type: 'action', intent: 'journaling', icon: 'book', titleKey: 'card_journaling_title', subtitleKey: 'card_journaling_subtitle', title: 'Write it down', subtitle: 'Open your journal', route: 'Story' },
  mood_check: { type: 'action', intent: 'mood_check', icon: 'happy', titleKey: 'card_mood_check_title', subtitleKey: 'card_mood_check_subtitle', title: 'Log your mood', subtitle: 'Track how you feel', route: 'MoodTracker' },
  gratitude: { type: 'action', intent: 'gratitude', icon: 'heart', titleKey: 'card_gratitude_title', subtitleKey: 'card_gratitude_subtitle', title: 'Gratitude moment', subtitle: 'Note one good thing', route: 'Gratitude' },
  professional_help: { type: 'action', intent: 'professional_help', icon: 'medkit', titleKey: 'card_professional_help_title', subtitleKey: 'card_professional_help_subtitle', title: 'Talk to a therapist', subtitle: 'Book a session', route: 'Appointments' },
};

function buildCrisisCard(language = 'en') {
  return {
    type: 'crisis',
    icon: 'alert-circle',
    titleKey: 'card_crisis_title',
    title: fallbackString(language, 'card_crisis_title'),
    subtitleKey: 'card_crisis_subtitle',
    subtitle: fallbackString(language, 'card_crisis_subtitle'),
    actions: [
      { labelKey: 'card_crisis_call_vandrevala', label: 'Vandrevala Foundation', phone: '18602662345' },
      { labelKey: 'card_crisis_call_icall', label: 'iCall (TISS)', phone: '9152987821' },
      { labelKey: 'card_crisis_call_kiran', label: 'Kiran Helpline', phone: '18005990019' },
      { labelKey: 'card_crisis_resources', label: fallbackString(language, 'card_crisis_resources'), route: 'CrisisResources' },
      { labelKey: 'card_crisis_emergency', label: fallbackString(language, 'card_crisis_emergency'), route: 'EmergencyContact' },
    ],
  };
}

function buildCardsForResponse(intent, crisis, language = 'en') {
  const cards = [];
  if (crisis) cards.push(buildCrisisCard(language));
  if (intent && INTENT_CARDS[intent]) cards.push(INTENT_CARDS[intent]);
  return cards;
}

// ── System prompt construction ───────────────────────────────────────────────
function buildSystemPrompt({ language, summary, userContext }) {
  const langName = LANGUAGE_NAMES[language] || 'English';

  const memoryBlock = summary
    ? `\nWHAT YOU REMEMBER ABOUT THIS PERSON (from earlier in your relationship):\n${summary}\n`
    : '';

  const ctxBits = [];
  if (userContext) {
    if (userContext.name) ctxBits.push(`Their name is ${userContext.name}.`);
    if (Array.isArray(userContext.concerns) && userContext.concerns.length) {
      ctxBits.push(`They have shared these concerns before: ${userContext.concerns.join(', ')}.`);
    }
    if (userContext.recentMood != null) ctxBits.push(`Their most recent self-rated mood was ${userContext.recentMood}/10.`);
  }
  const ctxBlock = ctxBits.length ? `\nCONTEXT ABOUT THE USER:\n${ctxBits.join(' ')}\n` : '';

  return `You are "Tink", a warm, emotionally intelligent mental-health companion inside the MindCare app.

PERSONALITY:
- Compassionate, validating, non-judgmental, and genuinely curious about the person.
- You speak like a caring friend who happens to be wise about mental health — not clinical or robotic.
- Keep replies concise and mobile-friendly (2-5 short sentences). Use the occasional warm emoji, never overdo it.
- Reflect feelings back, ask one gentle open question, and offer one small, doable next step when helpful.

BOUNDARIES:
- You are NOT a licensed clinician. Never diagnose or prescribe.
- If the person expresses thoughts of suicide, self-harm, or being in danger, respond with calm warmth, take it seriously, encourage contacting a trusted person or a crisis helpline, and set "crisis" to true.

GUARDRAILS (must always follow):
- NEVER invent facts, numbers, dates, IDs, names, or app data. Only state data that is given to you in a FACTS section. If you don't have something, say you don't have it and point to where it can be found in the app.
- NEVER ask for passwords, OTPs, verification codes, or payment/card details — MindCare will never request these in chat.
- Do not make promises on behalf of therapists, admins, or the app (e.g. guaranteed timings).

LANGUAGE — VERY IMPORTANT:
- The user's preferred app language is ${langName}.
- Detect the language and style the user actually writes in and MATCH it:
  - Pure ${langName} or another language → reply fully in that language.
  - Code-mixed (e.g. Hinglish "bohot stress ho raha hai", Punjlish, Banglish, Spanglish) → reply in the SAME code-mixed style using the same script the user used.
  - Pure English → reply in English.
- Mirror their tone and energy naturally.
${memoryBlock}${ctxBlock}
OUTPUT FORMAT:
Respond ONLY with a JSON object matching the provided schema. Fields:
- "reply": your message to the user (in the correct language/style).
- "suggestions": 2-3 SHORT phrases the USER might tap to reply next (first person, e.g. "I feel anxious", "Tell me more"). In the same language as your reply. Keep each under 6 words.
- "intent": the single most helpful in-app action for them right now, one of: "none", "breathing", "grounding", "journaling", "mood_check", "gratitude", "professional_help".
- "crisis": true only if there is any sign of self-harm, suicide, or danger.
- "detectedLanguage": the ISO code you detected (e.g. "en", "hi", "es").
- "mood": your read of their emotional state, one of: "positive", "neutral", "low", "distressed".`;
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    reply: { type: 'STRING' },
    suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
    intent: { type: 'STRING', enum: ['none', 'breathing', 'grounding', 'journaling', 'mood_check', 'gratitude', 'professional_help'] },
    crisis: { type: 'BOOLEAN' },
    detectedLanguage: { type: 'STRING' },
    mood: { type: 'STRING', enum: ['positive', 'neutral', 'low', 'distressed'] },
  },
  required: ['reply'],
};

function getApiKey() {
  return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || null;
}

// Convert [{role|isUser, text}] history into Gemini "contents" (must start with a user turn)
function buildContents(history) {
  const normalized = (history || [])
    .map(m => ({
      role: (m.role === 'user' || m.isUser) ? 'user' : 'model',
      text: (m && m.text != null) ? String(m.text) : '',
    }))
    .filter(m => m.text.trim());

  const firstUser = normalized.findIndex(m => m.role === 'user');
  const relevant = firstUser === -1 ? [] : normalized.slice(firstUser);

  return relevant.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
}

async function callGemini(apiKey, model, body) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  // Abort a hung upstream so it can't stall the request; callers fall back to rule mode.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.ai.geminiTimeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

function safeParseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_) {
    // Try to extract the first {...} block in case the model added prose
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (_e) { return null; }
    }
    return null;
  }
}

/**
 * Generate Tink's response.
 * @param {Object} params
 * @param {string} params.message      - the user's new message
 * @param {Array}  params.history      - prior turns [{role|isUser, text}]
 * @param {string} params.language     - preferred app language code
 * @param {string} params.summary      - rolling memory summary
 * @param {Object} params.userContext  - { name, concerns, recentMood }
 * @returns {Promise<{reply, suggestions, intent, crisis, detectedLanguage, mood, cards}>}
 */
async function generateTinkResponse({ message, history = [], language = 'en', summary = '', userContext = null }) {
  const apiKey = getApiKey();
  const keywordCrisis = detectCrisis(message);

  if (!apiKey || process.env.USE_MOCK_CHATBOT === 'true') {
    const reply = fallbackString(language, 'mock_reply');
    return {
      reply,
      suggestions: fallbackList(language, 'mock_suggestions'),
      intent: 'none',
      crisis: keywordCrisis,
      detectedLanguage: language,
      mood: 'neutral',
      cards: buildCardsForResponse('none', keywordCrisis, language),
    };
  }

  const systemPrompt = buildSystemPrompt({ language, summary, userContext });
  const contents = buildContents(history);
  contents.push({ role: 'user', parts: [{ text: String(message || '') }] });

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 700,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  let parsed = null;
  let lastErr = null;
  const { models, tier } = pickModels({ message, history, role: 'reply' });

  for (const model of models) {
    try {
      const { ok, status, data } = await callGemini(apiKey, model, body);
      if (!ok) {
        lastErr = data?.error?.message || `HTTP ${status}`;
        if (status === 404) continue; // try next model
        if (status === 503 || status === 429) continue; // try next model on overload
        continue;
      }
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      parsed = safeParseJson(text);
      if (parsed && parsed.reply) break;
      // Model returned but unparsable — keep raw text as reply
      if (text) { parsed = { reply: text.trim() }; break; }
    } catch (err) {
      lastErr = err.message;
    }
  }

  if (!parsed) {
    return {
      reply: fallbackString(language, 'error_reply'),
      suggestions: fallbackList(language, 'error_suggestions'),
      intent: 'none',
      crisis: keywordCrisis,
      detectedLanguage: language,
      mood: 'neutral',
      cards: buildCardsForResponse('none', keywordCrisis, language),
      error: lastErr,
    };
  }

  const intent = INTENT_CARDS[parsed.intent] ? parsed.intent : 'none';
  const crisis = Boolean(parsed.crisis) || keywordCrisis;
  const suggestions = Array.isArray(parsed.suggestions)
    ? parsed.suggestions.filter(s => typeof s === 'string' && s.trim()).slice(0, 3)
    : [];

  return {
    reply: String(parsed.reply || '').trim() || "I'm here with you. How can I help?",
    suggestions,
    intent,
    crisis,
    detectedLanguage: parsed.detectedLanguage || language,
    mood: ['positive', 'neutral', 'low', 'distressed'].includes(parsed.mood) ? parsed.mood : 'neutral',
    cards: buildCardsForResponse(intent, crisis, language),
    modelTier: tier,
  };
}

/**
 * Update the rolling memory summary after a turn. Keeps it short.
 * Uses a fast Gemini call; on any failure returns the previous summary
 * so memory degrades gracefully rather than breaking the chat.
 */
async function updateConversationSummary({ previousSummary = '', userMessage, assistantReply }) {
  const apiKey = getApiKey();
  if (!apiKey) return previousSummary;

  const prompt = `You maintain a concise running memory of a mental-health support chat.
Update the memory with anything important from the latest exchange (feelings, events, people, goals, coping strategies, risks). Keep it factual, under 120 words, third person ("The user ...").

EXISTING MEMORY:
${previousSummary || '(none yet)'}

LATEST EXCHANGE:
User: ${userMessage}
Tink: ${assistantReply}

Return ONLY the updated memory text.`;

  const { models } = pickModels({ role: 'summary' });
  for (const model of models) {
    try {
      const { ok, status, data } = await callGemini(apiKey, model, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 256 },
      });
      if (!ok) { if (status === 404) continue; return previousSummary; }
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim()) return text.trim().slice(0, 1500);
      return previousSummary;
    } catch (_) {
      return previousSummary;
    }
  }
  return previousSummary;
}

// ─────────────────────────── INTENT CLASSIFICATION ──────────────────────────

const INTENTS = [
  'support', 'help',
  'lookup_mood', 'lookup_journal', 'lookup_goals', 'lookup_appointments',
  'discovery_groups',
  'action_log_mood', 'action_add_journal', 'action_set_goal', 'action_book_session',
];

// Rule-based keyword classifier (Hindi/English/Hinglish) — the always-available fallback.
function ruleClassify(message) {
  const m = String(message || '').toLowerCase();
  const has = (...words) => words.some(w => m.includes(w));
  const entities = {};

  if (detectCrisis(message)) return { intent: 'support', entities: { crisis: true }, confidence: 0.9 };

  // Actions (check before lookups; "log my mood" vs "show my mood")
  if (has('log my mood', 'log mood', 'record my mood', 'set my mood', 'mood ', 'rate my mood', 'mood dikha de', 'mood log')) {
    const num = m.match(/\b([1-9]|10)\b/);
    if (has('log', 'record', 'set', 'add') && num) {
      entities.rating = Number(num[1]);
      return { intent: 'action_log_mood', entities, confidence: 0.7 };
    }
  }
  if (has('add a journal', 'write a journal', 'new journal', 'journal entry', 'journal likh', 'write journal')) {
    return { intent: 'action_add_journal', entities, confidence: 0.7 };
  }
  if (has('set a goal', 'create a goal', 'new goal', 'add a goal', 'goal banao', 'goal set')) {
    entities.title = '';
    return { intent: 'action_set_goal', entities, confidence: 0.7 };
  }
  if (has('book', 'appointment', 'therapist session', 'see a therapist', 'consultation', 'counsel', 'session book')) {
    return { intent: 'action_book_session', entities, confidence: 0.6 };
  }

  // Lookups
  if (has('my mood', 'mood history', 'mood trend', 'how have i been', 'last 7', 'mera mood', 'mood dikha')) {
    return { intent: 'lookup_mood', entities, confidence: 0.7 };
  }
  if (has('my journal', 'recent journal', 'journals', 'journal dikha')) {
    return { intent: 'lookup_journal', entities, confidence: 0.7 };
  }
  if (has('my goal', 'goals', 'goal progress', 'goal dikha')) {
    return { intent: 'lookup_goals', entities, confidence: 0.7 };
  }
  if (has('my appointment', 'appointments', 'my session', 'my booking', 'appointment dikha')) {
    return { intent: 'lookup_appointments', entities, confidence: 0.7 };
  }
  if (has('group session', 'group therapy', 'upcoming session', 'join a group')) {
    return { intent: 'discovery_groups', entities, confidence: 0.7 };
  }

  // Help / FAQ
  if (has('how do', 'how does', 'what is', 'what are', 'privacy', 'data', 'escrow', 'crisis', 'how to', 'explain', 'help me understand', 'kaise')) {
    return { intent: 'help', entities, confidence: 0.55 };
  }

  return { intent: 'support', entities, confidence: 0.5 };
}

const CLASSIFY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    intent: { type: 'STRING', enum: INTENTS },
    confidence: { type: 'NUMBER' },
    entities: {
      type: 'OBJECT',
      properties: {
        rating: { type: 'NUMBER' },
        note: { type: 'STRING' },
        content: { type: 'STRING' },
        title: { type: 'STRING' },
        description: { type: 'STRING' },
        category: { type: 'STRING' },
        speciality: { type: 'STRING' },
        preferredTime: { type: 'STRING' },
      },
    },
  },
  required: ['intent'],
};

/**
 * Classify the user's message into an intent (+ entities + confidence).
 * Uses Gemini structured output when available, else the rule-based fallback.
 */
async function classifyIntent({ message, history = [] }) {
  const rule = ruleClassify(message);
  const apiKey = getApiKey();
  if (!apiKey || process.env.USE_MOCK_CHATBOT === 'true') return { ...rule, mode: 'rule' };

  const sys = `You are an intent classifier for "Tink", the MindCare wellness app assistant.
Classify the user's latest message into exactly one intent and extract any entities.

Intents:
- support: emotional conversation, venting, feelings, advice, anything not below.
- help: questions about how the app works (privacy, assessment, crisis support, journaling, etc.).
- lookup_mood / lookup_journal / lookup_goals / lookup_appointments: user wants to SEE their own existing data.
- discovery_groups: user wants to find/see upcoming group sessions.
- action_log_mood: user wants to record a NEW mood (extract rating 1-10 and note).
- action_add_journal: user wants to write a NEW journal entry (extract content).
- action_set_goal: user wants to create a NEW goal (extract title, description, category).
- action_book_session: user wants to request a therapy appointment (extract speciality, preferredTime, note).

Return JSON only. If unsure, prefer "support".`;

  const contents = buildContents(history);
  contents.push({ role: 'user', parts: [{ text: String(message || '') }] });

  const { models } = pickModels({ message, history, role: 'classify' });
  for (const model of models) {
    try {
      const { ok, status, data } = await callGemini(apiKey, model, {
        system_instruction: { parts: [{ text: sys }] },
        contents,
        generationConfig: { temperature: 0.1, maxOutputTokens: 300, responseMimeType: 'application/json', responseSchema: CLASSIFY_SCHEMA },
      });
      if (!ok) { if (status === 404) continue; return { ...rule, mode: 'rule' }; }
      const parsed = safeParseJson(data?.candidates?.[0]?.content?.parts?.[0]?.text);
      if (parsed && INTENTS.includes(parsed.intent)) {
        return {
          intent: parsed.intent,
          entities: parsed.entities || {},
          confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.7,
          mode: 'gemini',
        };
      }
      return { ...rule, mode: 'rule' };
    } catch (_) {
      return { ...rule, mode: 'rule' };
    }
  }
  return { ...rule, mode: 'rule' };
}

// ─────────────────────────── GROUNDED REPLY (help / lookups / actions) ───────

const COMPOSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    reply: { type: 'STRING' },
    suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['reply'],
};

function toneDirective(tone) {
  switch (tone) {
    case 'professional': return 'Tone: calm, professional, and reassuring.';
    case 'concise': return 'Tone: warm but very concise (1-2 sentences).';
    default: return 'Tone: warm, friendly, and supportive.';
  }
}

/**
 * Compose a reply grounded in FACTS (for help/lookup/action intents).
 * Returns { reply, suggestions, mode }.
 */
async function composeGroundedReply({ message, facts = '', sources = [], language = 'en', tone = 'friendly', userContext = null, draft = null, forceRule = false }) {
  const langName = LANGUAGE_NAMES[language] || 'English';
  const apiKey = getApiKey();
  const useGemini = !forceRule && apiKey && process.env.USE_MOCK_CHATBOT !== 'true';

  // Rule-based fallback: surface the facts directly in a friendly wrapper.
  const ruleReply = () => {
    if (draft) {
      return fallbackString(language, 'rule_draft', { summary: draft.summary });
    }
    if (facts && facts.trim()) {
      return facts.trim();
    }
    if (sources.length) {
      return sources.map(s => s.text).join('\n\n');
    }
    return fallbackString(language, 'rule_more_info');
  };

  if (!useGemini) {
    return { reply: ruleReply(), suggestions: [], mode: 'rule', modelTier: 'rule' };
  }

  const factsBlock = facts ? `\nFACTS (the ONLY data you may state — do not invent anything beyond this):\n${facts}\n` : '';
  const sourceBlock = sources.length ? `\nHELP DOCS:\n${sources.map(s => `- ${s.title}: ${s.text}`).join('\n')}\n` : '';
  const draftBlock = draft ? `\nA draft "${draft.kind}" action has been prepared (${draft.summary}). Briefly confirm what you've set up and tell the user to review the card below and tap confirm. Do NOT claim it is already saved.\n` : '';
  const ctx = userContext && userContext.name ? `The user's name is ${userContext.name}. ` : '';

  const sys = `You are "Tink", MindCare's warm wellness companion. ${ctx}
Reply to the user using ONLY the information provided below. ${toneDirective(tone)}
Reply in ${langName} (match the user's language/code-mixing). Keep it concise and mobile-friendly.

GUARDRAILS: Never invent data, numbers, IDs, or dates beyond the FACTS. Never ask for passwords/OTP. If data is missing, say so kindly and point to where it is in the app.
${factsBlock}${sourceBlock}${draftBlock}
Return JSON: { "reply": "...", "suggestions": ["short follow-up the user might tap", ...] } (2-3 suggestions, in the same language, each under 6 words).`;

  const { models, tier } = pickModels({ message, facts, role: 'compose' });
  for (const model of models) {
    try {
      const { ok, status, data } = await callGemini(apiKey, model, {
        system_instruction: { parts: [{ text: sys }] },
        contents: [{ role: 'user', parts: [{ text: String(message || '') }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 600, responseMimeType: 'application/json', responseSchema: COMPOSE_SCHEMA },
      });
      if (!ok) { if (status === 404) continue; return { reply: ruleReply(), suggestions: [], mode: 'rule', modelTier: 'rule' }; }
      const parsed = safeParseJson(data?.candidates?.[0]?.content?.parts?.[0]?.text);
      if (parsed && parsed.reply) {
        return {
          reply: String(parsed.reply).trim(),
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.filter(s => typeof s === 'string' && s.trim()).slice(0, 3) : [],
          mode: 'gemini',
          modelTier: tier,
        };
      }
      return { reply: ruleReply(), suggestions: [], mode: 'rule', modelTier: 'rule' };
    } catch (_) {
      return { reply: ruleReply(), suggestions: [], mode: 'rule', modelTier: 'rule' };
    }
  }
  return { reply: ruleReply(), suggestions: [], mode: 'rule', modelTier: 'rule' };
}

// ─────────────────────────── REFINE & TRANSLATE ─────────────────────────────

const REFINE_INSTRUCTIONS = {
  shorter: 'Rewrite the message to be significantly shorter and punchier, keeping the warmth and key meaning.',
  professional: 'Rewrite the message in a calm, professional, clinical-yet-kind tone.',
  simpler: 'Rewrite the message in simpler, plainer language that is easy to understand.',
  steps: 'Rewrite the message as a short, clear step-by-step list.',
};

/**
 * Rewrite a previous assistant message in a given style (or translate).
 * @returns {Promise<string>} the refined text (falls back to original).
 */
async function refineReply({ text, mode = 'shorter', language = 'en' }) {
  const original = String(text || '');
  if (!original.trim()) return original;
  const apiKey = getApiKey();
  if (!apiKey || process.env.USE_MOCK_CHATBOT === 'true') {
    // Minimal offline fallback
    if (mode === 'shorter') return original.split(/(?<=[.!?])\s/).slice(0, 2).join(' ');
    return original;
  }

  const langName = LANGUAGE_NAMES[language] || 'English';
  const instruction = REFINE_INSTRUCTIONS[mode] || REFINE_INSTRUCTIONS.shorter;
  const prompt = `${instruction}\nReply in ${langName}. Return ONLY the rewritten text, no preamble.\n\nORIGINAL:\n${original}`;

  const { models } = pickModels({ message: original, role: 'refine' });
  for (const model of models) {
    try {
      const { ok, status, data } = await callGemini(apiKey, model, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
      });
      if (!ok) { if (status === 404) continue; return original; }
      const out = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return out && out.trim() ? out.trim() : original;
    } catch (_) {
      return original;
    }
  }
  return original;
}

/**
 * Translate text into a target language.
 * @returns {Promise<string>} translated text (falls back to original when no API key).
 */
async function translateText({ text, targetLanguage = 'en' }) {
  const original = String(text || '');
  if (!original.trim()) return original;
  const apiKey = getApiKey();
  const langName = LANGUAGE_NAMES[targetLanguage] || 'English';
  if (!apiKey || process.env.USE_MOCK_CHATBOT === 'true') return original; // stub mode

  const prompt = `Translate the following text into ${langName}. Preserve tone and meaning. Return ONLY the translation.\n\n${original}`;
  const { models } = pickModels({ message: original, role: 'translate' });
  for (const model of models) {
    try {
      const { ok, status, data } = await callGemini(apiKey, model, {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 600 },
      });
      if (!ok) { if (status === 404) continue; return original; }
      const out = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return out && out.trim() ? out.trim() : original;
    } catch (_) {
      return original;
    }
  }
  return original;
}

const VERIFICATION_NOTE = FALLBACK_STRINGS.en.verification_note;

function shouldGateConfidence(confidence) {
  return typeof confidence === 'number' && confidence < config.ai.confidenceGate;
}

function isChatWebSocketEnabled() {
  if (process.env.DISABLE_CHAT_WS === 'true') return false;
  // WebSocket upgrade requires a long-lived Node server (not Vercel serverless).
  if (process.env.VERCEL) return false;
  return true;
}

/**
 * Report Tink's live capabilities (used by the UI to show a status badge).
 */
function getCapabilities() {
  const apiKey = getApiKey();
  const geminiLive = !!apiKey && process.env.USE_MOCK_CHATBOT !== 'true';
  return {
    geminiLive,
    mode: geminiLive ? 'gemini' : 'rule',
    ragMode: config.ai.usePineconeRag ? 'hybrid' : 'local',
    voice: true,
    websocket: isChatWebSocketEnabled(),
    translate: geminiLive,
    languages: Object.keys(LANGUAGE_NAMES),
    fastModel: config.ai.fastModel,
    qualityModel: config.ai.qualityModel,
    confidenceGate: config.ai.confidenceGate,
    model: geminiLive ? config.ai.fastModel : null,
  };
}

module.exports = {
  generateTinkResponse,
  updateConversationSummary,
  detectCrisis,
  classifyIntent,
  composeGroundedReply,
  refineReply,
  translateText,
  getCapabilities,
  shouldGateConfidence,
  getVerificationNote,
  fallbackString,
  VERIFICATION_NOTE,
  LANGUAGE_NAMES,
  INTENTS,
};
