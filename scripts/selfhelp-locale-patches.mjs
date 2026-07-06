/**
 * Self-help tool translations: mood_check, breathing, affirmations, gratitude, grounding, streak.
 * Nested by section name per language.
 */

const MOOD_CHECK_HI = {
  title: 'आप कैसा महसूस कर रहे हैं?',
  subtitle: 'एक त्वरित जांच। कोई निर्णय नहीं।',
  mood_great: 'बहुत अच्छा',
  mood_good: 'अच्छा',
  mood_okay: 'ठीक',
  mood_low: 'कम',
  mood_anxious: 'चिंतित',
  done: 'हो गया',
  msg_positive: 'खुशी है कि आप ठीक हैं। अपना ख्याल रखें।',
  msg_okay: 'कुछ दिन ऐसे ही होते हैं। अपने प्रति कोमल रहें।',
  msg_low: 'चेक-इन के लिए धन्यवाद। Tink से बात करें या किसी भरोसेमंद से संपर्क करें।',
  talk_to_tink: 'Tink से बात करें',
  quick_checkin_note: 'त्वरित जांच: {label}',
};

const BREATHING_HI = {
  title: '4-7-8 श्वास',
  subtitle: 'तंत्रिका तंत्र को शांत करता है। 3–4 चक्र दोहराएं।',
  phase_in: 'सांस अंदर',
  phase_hold: 'रोकें',
  phase_out: 'सांस बाहर',
  seconds: '{count} सेकंड',
  start: 'शुरू',
  stop: 'रोकें',
};

const AFFIRMATIONS_HI = {
  title: 'पुष्टि वाक्य',
  category_calm: 'शांति',
  category_confidence: 'आत्मविश्वास',
  category_sleep: 'नींद',
  category_stress: 'तनाव',
  next: 'अगला',
  calm_0: 'इस क्षण मैं सुरक्षित हूँ।',
  calm_1: 'मैं खुद को सांस लेने और आराम करने देता/देती हूँ।',
  calm_2: 'मैं चिंता के बजाय शांति चुनता/चुनती हूँ।',
  calm_3: 'मेरा मन शांत हो रहा है।',
  calm_4: 'मैं जो नियंत्रित नहीं कर सकता, उसे छोड़ देता/देती हूँ।',
  confidence_0: 'मैं जैसा हूँ, वैसा ही पर्याप्त हूँ।',
  confidence_1: 'मुझे आज संभालने की अपनी क्षमता पर विश्वास है।',
  confidence_2: 'मैं सम्मान और दया का हकदार हूँ।',
  confidence_3: 'मैं आत्मविश्वास से बोलने और कार्य करने का चुनाव करता/करती हूँ।',
  confidence_4: 'मैं हर दिन विकास करने में सक्षम हूँ।',
  sleep_0: 'मेरा शरीर आराम के लिए तैयार है।',
  sleep_1: 'मैं दिन को छोड़कर नींद आने देता/देती हूँ।',
  sleep_2: 'मैं शांतिपूर्ण रात का हकदार हूँ।',
  sleep_3: 'मैं सुरक्षित हूँ और गहरी नींद सो सकता/सकती हूँ।',
  sleep_4: 'कल इंतज़ार कर सकता है; आज रात मैं आराम करूँगा/करूँगी।',
  stress_0: 'मैं एक समय में एक कदम संभाल सकता/सकती हूँ।',
  stress_1: 'मैं खुद को ब्रेक लेने की अनुमति देता/देती हूँ।',
  stress_2: 'मैं अपनी पूरी कोशिश कर रहा/रही हूँ, और यह काफी है।',
  stress_3: 'मैं हर सांस के साथ तनाव छोड़ता/छोड़ती हूँ।',
  stress_4: 'मैं प्रतिक्रिया देने के बजाय जवाब देने का चुनाव करता/करती हूँ।',
};

const GRATITUDE_HI = {
  title: 'एक अच्छी बात',
  subtitle: 'आज आप किस बात के लिए आभारी हैं?',
  placeholder: 'जैसे गर्म पेय, दोस्त का संदेश, मौसम...',
  save: 'सहेजें',
  done_text: 'नोट किया। छोटे पल मायने रखते हैं।',
};

const GROUNDING_HI = {
  title: '5-4-3-2-1 ग्राउंडिंग',
  subtitle: 'जब अभिभूत महसूस करें तो वर्तमान में लौटें।',
  done_title: 'आप यहाँ हैं।',
  done_text: 'एक सांस लें। कभी भी दोहरा सकते हैं।',
  start_again: 'फिर से शुरू',
  next: 'अगला',
  step_see: 'चीज़ें जो आप देख सकते हैं',
  step_touch: 'चीज़ें जो आप छू सकते हैं',
  step_hear: 'चीज़ें जो आप सुन सकते हैं',
  step_smell: 'चीज़ें जो आप सूंघ सकते हैं',
  step_taste: 'एक चीज़ जो आप चख सकते हैं',
  example_see: 'खिड़की, फ़ोन, पौधा',
  example_touch: 'फ़र्श, कपड़े, तकिया',
  example_hear: 'ट्रैफ़िक, पक्षी, आपकी सांस',
  example_smell: 'साबुन, हवा, खाना',
  example_taste: 'होंठ, गम, या पानी की घूंट',
};

const STREAK_HI = {
  day_streak: '{count}-दिन की लकीर!',
  start_today: 'आज अपनी लकीर शुरू करें!',
  subtitle_active: 'बहुत अच्छा कर रहे हैं! रोज़ लॉग करते रहें।',
  subtitle_inactive: 'दैनिक आदत बनाने के लिए मूड लॉग करें।',
  next_label: 'अगला: {label}',
  days_progress: '{progress} / {target} दिन',
};

const MOOD_CHECK_ES = {
  title: '¿Cómo te sientes?',
  subtitle: 'Un chequeo rápido. Sin juicios.',
  mood_great: 'Genial',
  mood_good: 'Bien',
  mood_okay: 'Regular',
  mood_low: 'Bajo',
  mood_anxious: 'Ansioso/a',
  done: 'Listo',
  msg_positive: 'Me alegra que estés bien. Sigue cuidándote.',
  msg_okay: 'Algunos días son así. Sé amable contigo.',
  msg_low: 'Gracias por registrarte. Habla con Tink o con alguien de confianza.',
  talk_to_tink: 'Hablar con Tink',
  quick_checkin_note: 'Chequeo rápido: {label}',
};

const BREATHING_ES = {
  title: 'Respiración 4-7-8',
  subtitle: 'Calma el sistema nervioso. Repite 3–4 ciclos.',
  phase_in: 'Inhala',
  phase_hold: 'Mantén',
  phase_out: 'Exhala',
  seconds: '{count} segundos',
  start: 'Iniciar',
  stop: 'Detener',
};

const AFFIRMATIONS_ES = {
  title: 'Afirmaciones',
  category_calm: 'calma',
  category_confidence: 'confianza',
  category_sleep: 'sueño',
  category_stress: 'estrés',
  next: 'Siguiente',
  calm_0: 'Estoy a salvo en este momento.',
  calm_1: 'Me permito respirar y relajarme.',
  calm_2: 'Elijo la paz sobre la preocupación.',
  calm_3: 'Mi mente se está calmando.',
  calm_4: 'Suelto lo que no puedo controlar.',
  confidence_0: 'Soy suficiente, exactamente como soy.',
  confidence_1: 'Confío en mi capacidad para afrontar hoy.',
  confidence_2: 'Merezco respeto y amabilidad.',
  confidence_3: 'Elijo hablar y actuar con confianza.',
  confidence_4: 'Soy capaz de crecer cada día.',
  sleep_0: 'Mi cuerpo está listo para descansar.',
  sleep_1: 'Dejo ir el día y permito el sueño.',
  sleep_2: 'Merezco una noche tranquila.',
  sleep_3: 'Estoy a salvo y puedo dormir profundamente.',
  sleep_4: 'Mañana puede esperar; esta noche descanso.',
  stress_0: 'Puedo manejar un paso a la vez.',
  stress_1: 'Me doy permiso para tomar un descanso.',
  stress_2: 'Estoy haciendo lo mejor que puedo, y eso basta.',
  stress_3: 'Suelto la tensión con cada respiración.',
  stress_4: 'Elijo responder, no reaccionar.',
};

const GRATITUDE_ES = {
  title: 'Una cosa buena',
  subtitle: '¿Por qué estás agradecido/a hoy?',
  placeholder: 'p. ej. Una bebida caliente, un mensaje de un amigo...',
  save: 'Guardar',
  done_text: 'Anotado. Los pequeños momentos importan.',
};

const GROUNDING_ES = {
  title: 'Anclaje 5-4-3-2-1',
  subtitle: 'Te devuelve al presente cuando te sientes abrumado/a.',
  done_title: 'Estás aquí.',
  done_text: 'Respira. Puedes repetirlo cuando quieras.',
  start_again: 'Empezar de nuevo',
  next: 'Siguiente',
  step_see: 'cosas que puedes ver',
  step_touch: 'cosas que puedes tocar',
  step_hear: 'cosas que puedes oír',
  step_smell: 'cosas que puedes oler',
  step_taste: 'una cosa que puedes saborear',
  example_see: 'una ventana, tu teléfono, una planta',
  example_touch: 'el suelo, tu ropa, un cojín',
  example_hear: 'tráfico, pájaros, tu respiración',
  example_smell: 'jabón, aire, comida',
  example_taste: 'tus labios, chicle o un sorbo de agua',
};

const STREAK_ES = {
  day_streak: '¡Racha de {count} días!',
  start_today: '¡Empieza tu racha hoy!',
  subtitle_active: '¡Lo estás haciendo genial! Sigue registrando.',
  subtitle_inactive: 'Registra tu ánimo para crear un hábito diario.',
  next_label: 'Siguiente: {label}',
  days_progress: '{progress} / {target} días',
};

const HI = {
  mood_check: MOOD_CHECK_HI,
  breathing: BREATHING_HI,
  affirmations: AFFIRMATIONS_HI,
  gratitude: GRATITUDE_HI,
  grounding: GROUNDING_HI,
  streak: STREAK_HI,
};

const ES = {
  mood_check: MOOD_CHECK_ES,
  breathing: BREATHING_ES,
  affirmations: AFFIRMATIONS_ES,
  gratitude: GRATITUDE_ES,
  grounding: GROUNDING_ES,
  streak: STREAK_ES,
};

const FR = {
  mood_check: {
    ...MOOD_CHECK_ES,
    title: 'Comment vous sentez-vous ?',
    subtitle: 'Un bilan rapide. Sans jugement.',
    mood_great: 'Super',
    mood_good: 'Bien',
    mood_okay: 'Correct',
    mood_low: 'Bas',
    mood_anxious: 'Anxieux/se',
    done: 'Terminé',
    talk_to_tink: 'Parler à Tink',
    quick_checkin_note: 'Bilan rapide : {label}',
  },
  breathing: {
    ...BREATHING_ES,
    title: 'Respiration 4-7-8',
    subtitle: 'Calme le système nerveux. Répétez 3–4 cycles.',
    phase_in: 'Inspirez',
    phase_hold: 'Retenez',
    phase_out: 'Expirez',
    start: 'Démarrer',
    stop: 'Arrêter',
  },
  affirmations: {
    ...AFFIRMATIONS_ES,
    title: 'Affirmations',
    category_calm: 'calme',
    category_confidence: 'confiance',
    category_sleep: 'sommeil',
    category_stress: 'stress',
    next: 'Suivant',
    calm_0: 'Je suis en sécurité en ce moment.',
    calm_1: 'Je me permets de respirer et de me détendre.',
    calm_2: 'Je choisis la paix plutôt que l\'inquiétude.',
    confidence_0: 'Je suis suffisant(e), tel(le) que je suis.',
    stress_0: 'Je peux avancer un pas à la fois.',
  },
  gratitude: {
    ...GRATITUDE_ES,
    title: 'Une bonne chose',
    subtitle: 'Pour quoi êtes-vous reconnaissant(e) aujourd\'hui ?',
    save: 'Enregistrer',
  },
  grounding: {
    ...GROUNDING_ES,
    title: 'Ancrage 5-4-3-2-1',
    next: 'Suivant',
    start_again: 'Recommencer',
  },
  streak: {
    ...STREAK_ES,
    day_streak: 'Série de {count} jours !',
    start_today: 'Commencez votre série aujourd\'hui !',
    next_label: 'Suivant : {label}',
  },
};

const DE = {
  ...ES,
  mood_check: {
    ...MOOD_CHECK_ES,
    title: 'Wie fühlen Sie sich?',
    subtitle: 'Ein schneller Check-in. Ohne Bewertung.',
    mood_great: 'Großartig',
    mood_good: 'Gut',
    mood_okay: 'Okay',
    mood_low: 'Niedrig',
    mood_anxious: 'Ängstlich',
    done: 'Fertig',
    talk_to_tink: 'Mit Tink sprechen',
  },
  breathing: {
    ...BREATHING_ES,
    title: '4-7-8 Atmung',
    phase_in: 'Einatmen',
    phase_hold: 'Halten',
    phase_out: 'Ausatmen',
    start: 'Start',
    stop: 'Stopp',
  },
  affirmations: {
    ...AFFIRMATIONS_ES,
    title: 'Affirmationen',
    next: 'Weiter',
    calm_0: 'In diesem Moment bin ich sicher.',
  },
  gratitude: { ...GRATITUDE_ES, title: 'Eine gute Sache', save: 'Speichern' },
  grounding: { ...GROUNDING_ES, title: '5-4-3-2-1 Erdung', next: 'Weiter' },
  streak: { ...STREAK_ES, day_streak: '{count}-Tage-Serie!', start_today: 'Starten Sie heute Ihre Serie!' },
};

const PT = {
  ...ES,
  mood_check: {
    ...MOOD_CHECK_ES,
    title: 'Como você está se sentindo?',
    subtitle: 'Um check-in rápido. Sem julgamentos.',
    done: 'Concluído',
    talk_to_tink: 'Falar com o Tink',
  },
  breathing: { ...BREATHING_ES, title: 'Respiração 4-7-8', start: 'Iniciar', stop: 'Parar' },
  affirmations: { ...AFFIRMATIONS_ES, title: 'Afirmações', next: 'Próximo' },
  gratitude: { ...GRATITUDE_ES, title: 'Uma coisa boa', save: 'Salvar' },
  grounding: { ...GROUNDING_ES, title: 'Aterramento 5-4-3-2-1', next: 'Próximo' },
  streak: { ...STREAK_ES, day_streak: 'Sequência de {count} dias!', start_today: 'Comece sua sequência hoje!' },
};

const TE = {
  mood_check: {
    ...MOOD_CHECK_HI,
    title: 'మీరు ఎలా భావిస్తున్నారు?',
    subtitle: 'త్వరిత చెక్-ఇన్. నిర్ణయం లేదు.',
    mood_great: 'చాలా బాగుంది',
    mood_good: 'బాగుంది',
    mood_okay: 'సరే',
    mood_low: 'తక్కువ',
    mood_anxious: 'ఆందోళన',
    done: 'పూర్తయింది',
    talk_to_tink: 'Tink తో మాట్లాడండి',
    quick_checkin_note: 'త్వరిత చెక్-ఇన్: {label}',
  },
  breathing: {
    ...BREATHING_HI,
    title: '4-7-8 శ్వాస',
    subtitle: 'నాడీ వ్యవస్థను శాంతపరుస్తుంది. 3–4 చక్రాలు పునరావృతం చేయండి.',
    seconds: '{count} సెకన్లు',
  },
  affirmations: {
    ...AFFIRMATIONS_HI,
    title: 'ధృవీకరణలు',
    category_calm: 'శాంతి',
    category_confidence: 'ఆత్మవిశ్వాసం',
    category_sleep: 'నిద్ర',
    category_stress: 'ఒత్తిడి',
    next: 'తదుపరి',
    calm_0: 'ఈ క్షణం నేను సురక్షితంగా ఉన్నాను.',
    calm_1: 'నేను శ్వాస తీసుకోవడానికి మరియు విశ్రాంతి తీసుకోవడానికి అనుమతిస్తున్నాను.',
    confidence_0: 'నేను ఎలా ఉన్నానో అలాగే సరిపోతాను.',
    stress_0: 'నేను ఒక్కొక్కటిగా ఒక అడుగు వేయగలను.',
  },
  gratitude: {
    ...GRATITUDE_HI,
    title: 'ఒక మంచి విషయం',
    subtitle: 'ఈ రోజు మీరు దేనికి కృతజ్ఞులు?',
    placeholder: 'ఉదా. వెచ్చని పానీయం, స్నేహితుని సందేశం...',
    save: 'సేవ్ చేయి',
  },
  grounding: {
    ...GROUNDING_HI,
    title: '5-4-3-2-1 గ్రౌండింగ్',
    next: 'తదుపరి',
    start_again: 'మళ్లీ ప్రారంభించు',
  },
  streak: {
    ...STREAK_HI,
    day_streak: '{count}-రోజుల సిరీస్!',
    start_today: 'ఈ రోజే మీ సిరీస్ ప్రారంభించండి!',
    next_label: 'తదుపరి: {label}',
    days_progress: '{progress} / {target} రోజులు',
  },
};

const BN = {
  ...HI,
  mood_check: {
    ...MOOD_CHECK_HI,
    title: 'আপনি কেমন অনুভব করছেন?',
    subtitle: 'একটি দ্রুত চেক-ইন। কোনো বিচার নেই।',
    mood_great: 'দারুণ',
    mood_good: 'ভালো',
    mood_okay: 'ঠিক আছে',
    mood_low: 'কম',
    mood_anxious: 'উদ্বিগ্ন',
    done: 'সম্পন্ন',
    talk_to_tink: 'Tink এর সাথে কথা বলুন',
  },
  breathing: { ...BREATHING_HI, title: '4-7-8 শ্বাস', start: 'শুরু', stop: 'থামুন' },
  affirmations: { ...AFFIRMATIONS_HI, title: 'নিশ্চিতকরণ', next: 'পরবর্তী', calm_0: 'এই মুহূর্তে আমি নিরাপদ।' },
  gratitude: { ...GRATITUDE_HI, title: 'একটি ভালো বিষয়', save: 'সংরক্ষণ' },
  grounding: { ...GROUNDING_HI, title: '5-4-3-2-1 গ্রাউন্ডিং', next: 'পরবর্তী' },
  streak: { ...STREAK_HI, day_streak: '{count}-দিনের ধারা!', start_today: 'আজই আপনার ধারা শুরু করুন!' },
};

const PA = {
  ...HI,
  mood_check: {
    ...MOOD_CHECK_HI,
    title: 'ਤੁਸੀਂ ਕਿਵੇਂ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ?',
    subtitle: 'ਇੱਕ ਤੇਜ਼ ਚੈੱਕ-ਇਨ। ਕੋਈ ਫੈਸਲਾ ਨਹੀਂ।',
    done: 'ਹੋ ਗਿਆ',
    talk_to_tink: 'Tink ਨਾਲ ਗੱਲ ਕਰੋ',
  },
  breathing: { ...BREATHING_HI, title: '4-7-8 ਸਾਹ', start: 'ਸ਼ੁਰੂ', stop: 'ਰੋਕੋ' },
  affirmations: { ...AFFIRMATIONS_HI, title: 'ਪੁਸ਼ਟੀਕਰਨ', next: 'ਅਗਲਾ' },
  gratitude: { ...GRATITUDE_HI, title: 'ਇੱਕ ਚੰਗੀ ਗੱਲ', save: 'ਸੰਭਾਲੋ' },
  grounding: { ...GROUNDING_HI, title: '5-4-3-2-1 ਗ੍ਰਾਉਂਡਿੰਗ', next: 'ਅਗਲਾ' },
  streak: { ...STREAK_HI, day_streak: '{count}-ਦਿਨ ਦੀ ਲੜੀ!', start_today: 'ਅੱਜ ਆਪਣੀ ਲੜੀ ਸ਼ੁਰੂ ਕਰੋ!' },
};

const MR = {
  ...HI,
  mood_check: {
    ...MOOD_CHECK_HI,
    title: 'तुम्हाला कसे वाटत आहे?',
    done: 'झाले',
    talk_to_tink: 'Tink शी बोला',
  },
  breathing: { ...BREATHING_HI, start: 'सुरू', stop: 'थांबा' },
  affirmations: { ...AFFIRMATIONS_HI, title: 'प्रतिज्ञा', next: 'पुढे' },
  gratitude: { ...GRATITUDE_HI, title: 'एक चांगली गोष्ट', save: 'जतन करा' },
  grounding: { ...GROUNDING_HI, next: 'पुढे', start_again: 'पुन्हा सुरू' },
  streak: { ...STREAK_HI, day_streak: '{count}-दिवसांची साखळी!', start_today: 'आज तुमची साखळी सुरू करा!' },
};

const TA = { ...TE, mood_check: { ...TE.mood_check, title: 'நீங்கள் எப்படி உணர்கிறீர்கள்?', talk_to_tink: 'Tink உடன் பேசுங்கள்' }, affirmations: { ...TE.affirmations, title: 'உறுதிமொழிகள்', next: 'அடுத்து' } };
const GU = { ...TE, mood_check: { ...TE.mood_check, title: 'તમને કેવું લાગે છે?', talk_to_tink: 'Tink સાથે વાત કરો' }, affirmations: { ...TE.affirmations, title: 'પુષ્ટિ', next: 'આગળ' } };
const KN = { ...TE, mood_check: { ...TE.mood_check, title: 'ನೀವು ಹೇಗೆ ಭಾವಿಸುತ್ತಿದ್ದೀರಿ?', talk_to_tink: 'Tink ಜೊತೆ ಮಾತನಾಡಿ' }, affirmations: { ...TE.affirmations, title: 'ದೃಢೀಕರಣಗಳು', next: 'ಮುಂದೆ' } };
const ML = { ...TE, mood_check: { ...TE.mood_check, title: 'നിങ്ങൾക്ക് എങ്ങനെ തോന്നുന്നു?', talk_to_tink: 'Tink ഉടന് സംസാരിക്കുക' }, affirmations: { ...TE.affirmations, title: 'സ്ഥിരീകരണങ്ങൾ', next: 'അടുത്തത്' } };

const AR = {
  ...ES,
  mood_check: {
    ...MOOD_CHECK_ES,
    title: 'كيف تشعر؟',
    subtitle: 'تسجيل سريع. بدون حكم.',
    mood_great: 'رائع',
    mood_good: 'جيد',
    mood_okay: 'بخير',
    mood_low: 'منخفض',
    mood_anxious: 'قلق',
    done: 'تم',
    talk_to_tink: 'تحدث مع Tink',
  },
  breathing: { ...BREATHING_ES, title: 'تنفس 4-7-8', start: 'ابدأ', stop: 'إيقاف' },
  affirmations: { ...AFFIRMATIONS_ES, title: 'تأكيدات', next: 'التالي', calm_0: 'أنا بأمان في هذه اللحظة.' },
  gratitude: { ...GRATITUDE_ES, title: 'شيء جيد واحد', save: 'حفظ' },
  grounding: { ...GROUNDING_ES, title: 'تأريض 5-4-3-2-1', next: 'التالي' },
  streak: { ...STREAK_ES, day_streak: 'سلسلة {count} أيام!', start_today: 'ابدأ سلسلتك اليوم!' },
};

const ZH = {
  ...ES,
  mood_check: {
    ...MOOD_CHECK_ES,
    title: '你感觉如何？',
    subtitle: '快速签到。不加评判。',
    mood_great: '很好',
    mood_good: '不错',
    mood_okay: '还行',
    mood_low: '低落',
    mood_anxious: '焦虑',
    done: '完成',
    talk_to_tink: '与 Tink 交谈',
  },
  breathing: { ...BREATHING_ES, title: '4-7-8 呼吸法', start: '开始', stop: '停止', seconds: '{count} 秒' },
  affirmations: { ...AFFIRMATIONS_ES, title: '肯定语', next: '下一个', calm_0: '此刻我是安全的。' },
  gratitude: { ...GRATITUDE_ES, title: '一件好事', save: '保存' },
  grounding: { ...GROUNDING_ES, title: '5-4-3-2-1 接地练习', next: '下一步' },
  streak: { ...STREAK_ES, day_streak: '{count} 天连续记录！', start_today: '今天开始你的连续记录！' },
};

export const SELFHELP_BY_LANG = {
  hi: HI,
  pa: PA,
  mr: MR,
  bn: BN,
  te: TE,
  ta: TA,
  gu: GU,
  kn: KN,
  ml: ML,
  es: ES,
  fr: FR,
  de: DE,
  pt: PT,
  ar: AR,
  zh: ZH,
};

export const SELFHELP_SECTIONS = ['mood_check', 'breathing', 'affirmations', 'gratitude', 'grounding', 'streak'];
