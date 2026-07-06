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
  bn: [
    'অ্যাপে একটি ছোট শ্বাস-প্রশ্বাসের ব্যায়াম করুন।',
    'আপনার ডায়েরিতে কয়েকটি লাইন লিখুন।',
    'বিশ্বস্ত কাউকে জানান।',
  ],
  te: [
    'యాప్‌లో చిన్న శ్వాస వ్యాయామం చేయండి.',
    'మీ డైరీలో కొన్ని పంక్తులు రాయండి.',
    'మీరు నమ్మకమైన వ్యక్తిని సంప్రదించండి.',
  ],
  ta: [
    'ஆப்பில் ஒரு சிறிய சுவாசப் பயிற்சி செய்யுங்கள்.',
    'உங்கள் நாட்குறிப்பில் சில வரிகள் எழுதுங்கள்.',
    'நம்பகமான ஒருவரை தொடர்பு கொள்ளுங்கள்.',
  ],
  gu: [
    'એપમાં ટૂંકો શ્વાસ અભ્યાસ કરો.',
    'તમારી ડાયરીમાં કેટલીક લીટીઓ લખો.',
    'વિશ્વસનીય વ્યક્તિનો સંપર્ક કરો.',
  ],
  kn: [
    'ಅಪ್ಲಿಕೇಶನ್‌ನಲ್ಲಿ ಚಿಕ್ಕ ಶ್ವಾಸ ವ್ಯಾಯಾಮ ಮಾಡಿ.',
    'ನಿಮ್ಮ ಡೈರಿಯಲ್ಲಿ ಕೆಲವು ಸಾಲುಗಳನ್ನು ಬರೆಯಿರಿ.',
    'ನಂಬಿಕೆಯ ವ್ಯಕ್ತಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.',
  ],
  ml: [
    'ആപ്പിൽ ഒരു ചെറിയ ശ്വാസാഭ്യാസം ചെയ്യുക.',
    'നിങ്ങളുടെ ഡയറിയിൽ കുറച്ച് വരികൾ എഴുതുക.',
    'വിശ്വസ്തരായ ഒരാളെ ബന്ധപ്പെടുക.',
  ],
  es: [
    'Prueba un breve ejercicio de respiración en la app.',
    'Escribe unas líneas en tu diario.',
    'Contacta a alguien de confianza.',
  ],
  fr: [
    'Essayez un court exercice de respiration dans l\'app.',
    'Écrivez quelques lignes dans votre journal.',
    'Contactez une personne de confiance.',
  ],
  de: [
    'Probiere eine kurze Atemübung in der App.',
    'Schreibe ein paar Zeilen in dein Tagebuch.',
    'Wende dich an eine Vertrauensperson.',
  ],
  pt: [
    'Experimente um breve exercício de respiração na app.',
    'Escreva algumas linhas no seu diário.',
    'Contacte alguém em quem confia.',
  ],
  ar: [
    'جرّب تمرين تنفس قصيرًا في التطبيق.',
    'اكتب بضعة أسطر في يومياتك.',
    'تواصل مع شخص تثق به.',
  ],
  zh: [
    '在应用中尝试简短的呼吸练习。',
    '在日记中写几行文字。',
    '联系您信任的人。',
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
  bn: {
    CRITICAL: [
      'অবিলম্বে জরুরি সহায়তা সংস্থান খুলুন।',
      'গ্রাউন্ডিং ব্যায়াম করুন এবং এখনই বিশ্বস্ত কাউকে জানান।',
      'Tink বা কাউন্সেলরের সাথে এখনই কথা বলুন।',
    ],
    HIGH: [
      'এখনই একটি নির্দেশিত শ্বাস বা গ্রাউন্ডিং ব্যায়াম শুরু করুন।',
      '২৪-৪৮ ঘণ্টার মধ্যে থেরাপিস্ট সেশন নির্ধারণ করুন।',
      'আজ মানসিক চাপ কমান এবং ছোট ছোট চেক-ইন করুন।',
    ],
    MEDIUM: [
      '১০ মিনিটের মাইন্ডফুলনেস রুটিন সম্পূর্ণ করুন।',
      'আজকের মূল চাপের ট্রিগার ডায়েরিতে লিখুন।',
      'পুনরুদ্ধার ট্র্যাক করতে পরে আবার চেক-ইন করুন।',
    ],
    LOW: [
      'হালকা স্ব-যত্নের রুটিন ও ছোট চেক-ইন চালিয়ে যান।',
      'স্বাস্থ্যকর অভ্যাস ও ভালো ঘুমের রুটিন বজায় রাখুন।',
      'সপ্তাহ জুড়ে মুডের ধারাবাহিকতা ট্র্যাক করুন।',
    ],
  },
  te: {
    CRITICAL: [
      'వెంటనే అత్యవసర సహాయ వనరులను తెరవండి.',
      'గ్రౌండింగ్ వ్యాయామం చేసి ఇప్పుడే నమ్మకమైన వ్యక్తిని సంప్రదించండి.',
      'Tink లేదా కౌన్సిలర్‌తో వెంటనే మాట్లాడండి.',
    ],
    HIGH: [
      'ఇప్పుడే మార్గదర్శిత శ్వాస లేదా గ్రౌండింగ్ వ్యాయామం ప్రారంభించండి.',
      '24-48 గంటల్లోపు థెరపిస్ట్ సెషన్ షెడ్యూల్ చేయండి.',
      'ఈ రోజు మానసిక భారాన్ని తగ్గించి చిన్న చెక్-ఇన్‌లు చేయండి.',
    ],
    MEDIUM: [
      '10 నిమిషాల మైండ్‌ఫుల్‌నెస్ రoutine పూర్తి చేయండి.',
      'ఈ రోజు ప్రధాన stress triggers ను డైరీలో రాయండి.',
      'రికవరీ ట్రాక్ చేయడానికి తర్వాత మళ్ళీ చెక్-ఇన్ చేయండి.',
    ],
    LOW: [
      'తేలికపాటి self-care routine మరియు చిన్న చెక్-ఇన్‌లు కొనసాగించండి.',
      'ఆరోగ్యకరమైన అలవాట్లు మరియు నిద్ర hygiene కొనసాగించండి.',
      'వారం పొడవున మూడ్ consistency ట్రాక్ చేయండి.',
    ],
  },
  ta: {
    CRITICAL: [
      'அவசர உதவி வளங்களை உடனே திறக்கவும்.',
      'கிரவுண்டிங் பயிற்சி செய்து நம்பகமான ஒருவரை இப்போது தொடர்பு கொள்ளுங்கள்.',
      'Tink அல்லது ஆலோசகருடன் உடனே பேசுங்கள்.',
    ],
    HIGH: [
      'இப்போது வழிகாட்டப்பட்ட சுவாச அல்லது கிரவுண்டிங் பயிற்சியை தொடங்குங்கள்.',
      '24-48 மணி நேரத்தில் therapist session திட்டமிடுங்கள்.',
      'இன்று மனச்சுமையை குறைத்து சிறிய check-in செய்யுங்கள்.',
    ],
    MEDIUM: [
      '10 நிமிட mindfulness routine முடிக்கவும்.',
      'இன்றைய முக்கிய stress triggers ஐ journal-ல் எழுதுங்கள்.',
      'recovery track செய்ய பின்னர் மீண்டும் check-in செய்யுங்கள்.',
    ],
    LOW: [
      'இலேசான self-care rhythm மற்றும் சிறிய check-in தொடருங்கள்.',
      'ஆரோக்கியமான routines மற்றும் sleep hygiene தொடருங்கள்.',
      'வாரம் முழுவதும் mood consistency track செய்யுங்கள்.',
    ],
  },
  gu: {
    CRITICAL: [
      'તાત્કાલિક કટોકટી સહાય સંસાધનો ખોલો.',
      'ગ્રાઉન્ડિંગ વ્યાયામ કરો અને હમણાં વિશ્વસનીય વ્યક્તિનો સંપર્ક કરો.',
      'Tink અથવા કાઉન્સેલર સાથે તરત વાત શરૂ કરો.',
    ],
    HIGH: [
      'હમણાં માર્ગદર્શિત શ્વાસ અથવા ગ્રાઉન્ડિંગ વ્યાયામ શરૂ કરો.',
      '24-48 કલાકમાં થેરાપિસ્ટ સત્ર શેડ્યૂલ કરો.',
      'આજે માનસિક બોજ ઘટાડો અને નાના check-in કરો.',
    ],
    MEDIUM: [
      '10 મિનિટનું mindfulness routine પૂર્ણ કરો.',
      'આજના મુખ્ય stress triggers ડાયરીમાં લખો.',
      'recovery track કરવા પછી ફરી check-in કરો.',
    ],
    LOW: [
      'હળવી self-care rhythm અને નાના check-in ચાલુ રાખો.',
      'સ્વસ્થ routines અને sleep hygiene જાળવો.',
      'અઠવાડિયા ભર mood consistency track કરો.',
    ],
  },
  kn: {
    CRITICAL: [
      'ತಕ್ಷಣ ತುರ್ತು ಸಹಾಯ ಸಂಪನ್ಮೂಲಗಳನ್ನು ತೆರೆಯಿರಿ.',
      'ಗ್ರೌಂಡಿಂಗ್ ವ್ಯಾಯಾಮ ಮಾಡಿ ಈಗ ವಿಶ್ವಾಸಾರ್ಹ ವ್ಯಕ್ತಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.',
      'Tink ಅಥವಾ counsellor ಜೊತೆ ತಕ್ಷಣ ಮಾತನಾಡಿ.',
    ],
    HIGH: [
      'ಈಗ guided breathing ಅಥವಾ grounding exercise ಪ್ರಾರಂಭಿಸಿ.',
      '24-48 ಗಂಟೆಗಳಲ್ಲಿ therapist session schedule ಮಾಡಿ.',
      'ಇಂದು cognitive load ಕಡಿಮೆ ಮಾಡಿ short check-ins ಮಾಡಿ.',
    ],
    MEDIUM: [
      '10 ನಿಮಿಷ mindfulness routine ಪೂರ್ಣಗೊಳಿಸಿ.',
      'ಇಂದಿನ ಪ್ರಮುಖ stress triggers journal-ನಲ್ಲಿ ಬರೆಯಿರಿ.',
      'recovery track ಮಾಡಲು ನಂತರ ಮತ್ತೆ check-in ಮಾಡಿ.',
    ],
    LOW: [
      'ಹಗುರ self-care rhythm ಮತ್ತು short check-ins ಮುಂದುವರಿಸಿ.',
      'healthy routines ಮತ್ತು sleep hygiene ಮುಂದುವರಿಸಿ.',
      'ವಾರದು mood consistency track ಮಾಡಿ.',
    ],
  },
  ml: {
    CRITICAL: [
      'അടിയന്തിര സഹായ വിഭവങ്ങൾ ഉടൻ തുറക്കുക.',
      'ഗ്രൗണ്ടിംഗ് വ്യായാമം ചെയ്ത് ഇപ്പോൾ വിശ്വസ്തരായ ഒരാളെ ബന്ധപ്പെടുക.',
      'Tink അല്ലെങ്കിൽ counsellor-മായി ഉടൻ സംസാരിക്കുക.',
    ],
    HIGH: [
      'ഇപ്പോൾ guided breathing അല്ലെങ്കിൽ grounding exercise ആരംഭിക്കുക.',
      '24-48 മണിക്കൂറിനുള്ളിൽ therapist session schedule ചെയ്യുക.',
      'ഇന്ന് mental load കുറച്ച് short check-ins ചെയ്യുക.',
    ],
    MEDIUM: [
      '10 മിനിറ്റ് mindfulness routine പൂർത്തിയാക്കുക.',
      'ഇന്നത്തെ പ്രധാന stress triggers journal-ൽ എഴുതുക.',
      'recovery track ചെയ്യാൻ പിന്നീട് വീണ്ടും check-in ചെയ്യുക.',
    ],
    LOW: [
      'നേരിയ self-care rhythm-ഉം short check-ins-ഉം തുടരുക.',
      'healthy routines-ഉം sleep hygiene-ഉം തുടരുക.',
      'ആഴ്ച മുഴുവൻ mood consistency track ചെയ്യുക.',
    ],
  },
  es: {
    CRITICAL: [
      'Abre los recursos de apoyo de emergencia de inmediato.',
      'Haz un ejercicio de grounding y conéctate con alguien de confianza ahora.',
      'Inicia una conversación en vivo con Tink o un consejero.',
    ],
    HIGH: [
      'Comienza ahora un ejercicio guiado de respiración o grounding.',
      'Programa una sesión con un terapeuta en 24-48 horas.',
      'Reduce la carga cognitiva y haz check-ins breves hoy.',
    ],
    MEDIUM: [
      'Completa una rutina de mindfulness de 10 minutos.',
      'Anota en tu diario los principales desencadenantes de estrés de hoy.',
      'Vuelve a hacer check-in más tarde para seguir tu recuperación.',
    ],
    LOW: [
      'Mantén un ritmo ligero de autocuidado y check-ins breves.',
      'Continúa con rutinas saludables e higiene del sueño.',
      'Sigue la consistencia del ánimo durante la semana.',
    ],
  },
  fr: {
    CRITICAL: [
      'Ouvrez immédiatement les ressources d\'aide d\'urgence.',
      'Faites un exercice de grounding et contactez une personne de confiance maintenant.',
      'Démarrez une conversation en direct avec Tink ou un conseiller.',
    ],
    HIGH: [
      'Commencez maintenant un exercice guidé de respiration ou de grounding.',
      'Planifiez une séance avec un thérapeute sous 24-48 heures.',
      'Réduisez la charge cognitive et faites de courts check-ins aujourd\'hui.',
    ],
    MEDIUM: [
      'Terminez une routine de pleine conscience de 10 minutes.',
      'Notez dans votre journal les principaux déclencheurs de stress d\'aujourd\'hui.',
      'Refaites un check-in plus tard pour suivre votre rétablissement.',
    ],
    LOW: [
      'Gardez un rythme léger d\'auto-soin et de courts check-ins.',
      'Continuez les routines saines et l\'hygiène du sommeil.',
      'Suivez la régularité de l\'humeur sur la semaine.',
    ],
  },
  de: {
    CRITICAL: [
      'Öffne sofort Notfall-Hilfsressourcen.',
      'Mache eine Grounding-Übung und kontaktiere jetzt eine Vertrauensperson.',
      'Starte sofort ein Gespräch mit Tink oder einem Berater.',
    ],
    HIGH: [
      'Beginne jetzt eine geführte Atem- oder Grounding-Übung.',
      'Plane eine Therapeutensitzung innerhalb von 24-48 Stunden.',
      'Reduziere heute die mentale Belastung und mache kurze Check-ins.',
    ],
    MEDIUM: [
      'Schließe eine 10-minütige Achtsamkeitsroutine ab.',
      'Notiere die wichtigsten Stressauslöser von heute im Tagebuch.',
      'Checke später erneut ein, um deine Erholung zu verfolgen.',
    ],
    LOW: [
      'Behalte einen leichten Selbstfürsorge-Rhythmus und kurze Check-ins bei.',
      'Setze gesunde Routinen und Schlafhygiene fort.',
      'Verfolge die Stimmungskonsistenz über die Woche.',
    ],
  },
  pt: {
    CRITICAL: [
      'Abra imediatamente os recursos de apoio de emergência.',
      'Faça um exercício de grounding e contacte alguém de confiança agora.',
      'Inicie uma conversa ao vivo com Tink ou um conselheiro.',
    ],
    HIGH: [
      'Comece agora um exercício guiado de respiração ou grounding.',
      'Agende uma sessão com um terapeuta em 24-48 horas.',
      'Reduza a carga cognitiva e faça check-ins breves hoje.',
    ],
    MEDIUM: [
      'Complete uma rotina de mindfulness de 10 minutos.',
      'Registe no diário os principais gatilhos de stress de hoje.',
      'Faça check-in novamente mais tarde para acompanhar a recuperação.',
    ],
    LOW: [
      'Mantenha um ritmo leve de autocuidado e check-ins breves.',
      'Continue rotinas saudáveis e higiene do sono.',
      'Acompanhe a consistência do humor ao longo da semana.',
    ],
  },
  ar: {
    CRITICAL: [
      'افتح موارد الدعم الطارئ فورًا.',
      'قم بتمرين grounding وتواصل مع شخص تثق به الآن.',
      'ابدأ محادثة مباشرة مع Tink أو مستشار.',
    ],
    HIGH: [
      'ابدأ الآن تمرين تنفس أو grounding موجّه.',
      'حدّد جلسة مع معالج خلال 24-48 ساعة.',
      'قلّل العبء الذهني وقم بفحوصات قصيرة اليوم.',
    ],
    MEDIUM: [
      'أكمل روتين يقظة ذهنية لمدة 10 دقائق.',
      'دوّن محفزات التوتر الرئيسية لليوم في يومياتك.',
      'أعد الفحص لاحقًا لتتبع التعافي.',
    ],
    LOW: [
      'حافظ على إيقاع خفيف للعناية الذاتية وفحوصات قصيرة.',
      'واصل الروتين الصحي ونظافة النوم.',
      'تتبّع ثبات المزاج على مدار الأسبوع.',
    ],
  },
  zh: {
    CRITICAL: [
      '立即打开紧急支持资源。',
      '做 grounding 练习并马上联系信任的人。',
      '立即与 Tink 或咨询师开始对话。',
    ],
    HIGH: [
      '现在开始引导式呼吸或 grounding 练习。',
      '在 24-48 小时内预约咨询师。',
      '今天减轻认知负担并做简短打卡。',
    ],
    MEDIUM: [
      '完成 10 分钟正念练习。',
      '在日记中记录今天的主要压力触发因素。',
      '稍后再次打卡以跟踪恢复情况。',
    ],
    LOW: [
      '保持轻松的自我关怀节奏和简短打卡。',
      '继续健康习惯和睡眠卫生。',
      '跟踪整周的心情稳定性。',
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
  bn: ['অবিলম্বে বিশ্রাম নিন।', 'একজন পেশাদারের সাথে কথা বলুন।', 'অ্যাপে শ্বাস-প্রশ্বাসের ব্যায়াম করুন।'],
  te: ['వెంటనే విశ్రాంతి తీసుకోండి.', 'ఒక నిపుణుడిని సంప్రదించండి.', 'యాప్‌లో శ్వాస వ్యాయామం చేయండి.'],
  ta: ['உடனே ஓய்வு எடுங்கள்.', 'ஒரு நிபுணரிடம் பேசுங்கள்.', 'ஆப்பில் சுவாசப் பயிற்சி செய்யுங்கள்.'],
  gu: ['તાત્કાલિક આરામ કરો.', 'કોઈ નિષ્ણાત સાથે વાત કરો.', 'એપમાં શ્વાસ અભ્યાસ કરો.'],
  kn: ['ತಕ್ಷಣ ವಿಶ್ರಾಂತಿ ತೆಗೆದುಕೊಳ್ಳಿ.', 'ತಜ್ಞರೊಂದಿಗೆ ಮಾತನಾಡಿ.', 'ಅಪ್ಲಿಕೇಶನ್‌ನಲ್ಲಿ ಶ್ವಾಸ ವ್ಯಾಯಾಮ ಮಾಡಿ.'],
  ml: ['ഉടനടി വിശ്രമിക്കുക.', 'ഒരു വിദഗ്ധനോട് സംസാരിക്കുക.', 'ആപ്പിൽ ശ്വാസാഭ്യാസം ചെയ്യുക.'],
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
