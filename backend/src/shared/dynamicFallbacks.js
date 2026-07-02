const { normalizeLanguage } = require('./locale');

const ISSUE_RECOMMENDATIONS = {
  en: [
    'Try a short breathing exercise in the app.',
    'Write a few lines in your journal.',
    'Reach out to someone you trust.',
  ],
  hi: [
    'ऐप में एक छोटा श्वास अभ्यास आज़माएँ।',
    'अपनी डायरी में कुछ पंक्तियाँ लिखें।',
    'किसी भरोसेमंद व्यक्ति से संपर्क करें।',
  ],
  pa: [
    'ਐਪ ਵਿੱਚ ਇੱਕ ਛੋਟਾ ਸਾਹ ਅਭਿਆਸ ਕਰੋ।',
    'ਆਪਣੀ ਡਾਇਰੀ ਵਿੱਚ ਕੁਝ ਲਾਈਨਾਂ ਲਿਖੋ।',
    'ਕਿਸੇ ਭਰੋਸੇਮੰਦ ਵਿਅਕਤੀ ਨਾਲ ਗੱਲ ਕਰੋ।',
  ],
  mr: [
    'अॅपमध्ये एक छोटा श्वास व्यायाम करा.',
    'तुमच्या डायरीत काही ओळी लिहा.',
    'विश्वासार्ह व्यक्तीशी संपर्क साधा.',
  ],
};

const FUSION_RECOMMENDATIONS = {
  en: {
    CRITICAL: [
      'Open emergency support resources immediately.',
      'Use grounding exercise and connect to a trusted person now.',
      'Start a live conversation with Tink or a counselor.',
    ],
    HIGH: [
      'Start a guided breathing or grounding exercise now.',
      'Schedule a therapist session within 24-48 hours.',
      'Reduce cognitive load and use short check-ins today.',
    ],
    MEDIUM: [
      'Complete a 10-minute mindfulness routine.',
      'Journal key stress triggers from today.',
      'Check in again later to track recovery trend.',
    ],
    LOW: [
      'Keep a light self-care rhythm and short check-ins.',
      'Continue healthy routines and sleep hygiene.',
      'Track mood consistency over the week.',
    ],
  },
  hi: {
    CRITICAL: [
      'तुरंत आपातकालीन सहायता संसाधन खोलें।',
      'ग्राउंडिंग व्यायाम करें और अभी किसी भरोसेमंद व्यक्ति से जुड़ें।',
      'Tink या काउंसलर से तुरंत बातचीत शुरू करें।',
    ],
    HIGH: [
      'अभी एक निर्देशित श्वास या ग्राउंडिंग व्यायाम शुरू करें।',
      '24-48 घंटों के भीतर थेरेपिस्ट सत्र निर्धारित करें।',
      'आज मानसिक बोझ कम करें और छोटे चेक-इन करें।',
    ],
    MEDIUM: [
      '10 मिनट का माइंडफुलनेस रूटीन पूरा करें।',
      'आज के मुख्य तनाव ट्रिगर डायरी में लिखें।',
      'रिकवरी ट्रैक करने के लिए बाद में फिर चेक-इन करें।',
    ],
    LOW: [
      'हल्की सेल्फ-केयर दिनचर्या और छोटे चेक-इन जारी रखें।',
      'स्वस्थ दिनचर्या और नींद की अच्छी आदतें बनाए रखें।',
      'सप्ताह भर मूड की निरंतरता ट्रैक करें।',
    ],
  },
  pa: {
    CRITICAL: [
      'ਤੁਰੰਤ ਐਮਰਜੈਂਸੀ ਸਹਾਇਤਾ ਸਰੋਤ ਖੋਲ੍ਹੋ।',
      'ਗ੍ਰਾਊਂਡਿੰਗ ਅਭਿਆਸ ਕਰੋ ਅਤੇ ਹੁਣੇ ਕਿਸੇ ਭਰੋਸੇਮੰਦ ਵਿਅਕਤੀ ਨਾਲ ਜੁੜੋ।',
      'Tink ਜਾਂ ਕਾਉਂਸਲਰ ਨਾਲ ਤੁਰੰਤ ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰੋ।',
    ],
    HIGH: [
      'ਹੁਣੇ ਇੱਕ ਗਾਈਡਡ ਸਾਹ ਜਾਂ ਗ੍ਰਾਊਂਡਿੰਗ ਅਭਿਆਸ ਸ਼ੁਰੂ ਕਰੋ।',
      '24-48 ਘੰਟਿਆਂ ਵਿੱਚ ਥੈਰੇਪਿਸਟ ਸੈਸ਼ਨ ਬੁੱਕ ਕਰੋ।',
      'ਅੱਜ ਮਾਨਸਿਕ ਬੋਝ ਘਟਾਓ ਅਤੇ ਛੋਟੇ ਚੈਕ-ਇਨ ਕਰੋ।',
    ],
    MEDIUM: [
      '10 ਮਿੰਟ ਦਾ ਮਾਈਂਡਫੁਲਨੈਸ ਰੁਟੀਨ ਪੂਰਾ ਕਰੋ।',
      'ਅੱਜ ਦੇ ਮੁੱਖ ਤਣਾਅ ਟਰਿਗਰ ਡਾਇਰੀ ਵਿੱਚ ਲਿਖੋ।',
      'ਰਿਕਵਰੀ ਟ੍ਰੈਕ ਕਰਨ ਲਈ ਬਾਅਦ ਵਿੱਚ ਫਿਰ ਚੈਕ-ਇਨ ਕਰੋ।',
    ],
    LOW: [
      'ਹਲਕੀ ਸੈਲਫ-ਕੇਅਰ ਰੁਟੀਨ ਅਤੇ ਛੋਟੇ ਚੈਕ-ਇਨ ਜਾਰੀ ਰੱਖੋ।',
      'ਸਿਹਤਮੰਦ ਦਿਨਚਰਿਆ ਅਤੇ ਨੀਂਦ ਦੀ ਚੰਗੀ ਆਦਤ ਬਣਾਈ ਰੱਖੋ।',
      'ਹਫ਼ਤੇ ਭਰ ਮੂਡ ਦੀ ਨਿਰੰਤਰਤਾ ਟ੍ਰੈਕ ਕਰੋ।',
    ],
  },
  mr: {
    CRITICAL: [
      'तात्काळ आपत्कालीन मदत संसाधने उघडा.',
      'ग्राउंडिंग व्यायाम करा आणि आत्ताच विश्वासार्ह व्यक्तीशी संपर्क साधा.',
      'Tink किंवा समुपदेशकाशी लगेच संवाद सुरू करा.',
    ],
    HIGH: [
      'आत्ताच मार्गदर्शित श्वास किंवा ग्राउंडिंग व्यायाम सुरू करा.',
      '24-48 तासांत थेरपिस्ट सत्र नियोजित करा.',
      'आज मानसिक भार कमी करा आणि लहान चेक-इन करा.',
    ],
    MEDIUM: [
      '10 मिनिटांचा माइंडफुलनेस दिनक्रम पूर्ण करा.',
      'आजचे मुख्य तणाव ट्रिगर डायरीत लिहा.',
      'पुनर्प्राप्ती ट्रॅक करण्यासाठी नंतर पुन्हा चेक-इन करा.',
    ],
    LOW: [
      'हलकी सेल्फ-केयर दिनचर्या आणि लहान चेक-इन सुरू ठेवा.',
      'निरोगी दिनचर्या आणि झोपेच्या चांगल्या सवयी ठेवा.',
      'आठवडाभर मूडची सातत्य ट्रॅक करा.',
    ],
  },
};

function getIssueFallbackRecommendations(language) {
  const lang = normalizeLanguage(language);
  return ISSUE_RECOMMENDATIONS[lang] || ISSUE_RECOMMENDATIONS.en;
}

function getFusionRecommendations(riskLevel, language) {
  const lang = normalizeLanguage(language);
  const pack = FUSION_RECOMMENDATIONS[lang] || FUSION_RECOMMENDATIONS.en;
  return pack[riskLevel] || pack.LOW;
}

const BURNOUT_RECOMMENDATIONS = {
  en: ['Take rest immediately.', 'Speak to a professional.', 'Try a short breathing exercise in the app.'],
  hi: ['तुरंत आराम करें।', 'किसी पेशेवर से बात करें।', 'ऐप में एक छोटा श्वास अभ्यास करें।'],
  pa: ['ਤੁਰੰਤ ਆਰਾਮ ਕਰੋ।', 'ਕਿਸੇ ਪੇਸ਼ੇਵਰ ਨਾਲ ਗੱਲ ਕਰੋ।', 'ਐਪ ਵਿੱਚ ਇੱਕ ਛੋਟਾ ਸਾਹ ਅਭਿਆਸ ਕਰੋ।'],
  mr: ['तात्काळ विश्रांती घ्या.', 'तज्ञाशी बोला.', 'अॅपमध्ये एक छोटा श्वास व्यायाम करा.'],
};

function getBurnoutRecommendations(language) {
  const lang = normalizeLanguage(language);
  return BURNOUT_RECOMMENDATIONS[lang] || BURNOUT_RECOMMENDATIONS.en;
}

module.exports = {
  getIssueFallbackRecommendations,
  getFusionRecommendations,
  getBurnoutRecommendations,
};
