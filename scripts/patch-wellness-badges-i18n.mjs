/**
 * Patch wellness fitness strings and badge labels for non-English locales.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import translations from '../src/localization/translations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../src/localization/translations.js');
const LANGS = ['en', 'hi', 'pa', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'es', 'fr', 'de', 'pt', 'ar', 'zh'];

const PATCHES = {
  en: {
    mood: {
      stat_avg_30d: 'Avg (30d)',
      stat_streak: 'Streak 🔥',
      no_trend: 'No entries yet. Log your mood above.',
      error_save: 'Failed to save mood. Please try again.',
    },
  },
  hi: {
    mood: {
      stat_avg_30d: 'औसत (30 दिन)',
      stat_streak: 'लकीर 🔥',
      no_trend: 'अभी कोई प्रविष्टि नहीं। ऊपर अपना मूड लॉग करें।',
      error_save: 'मूड सहेजने में विफल। कृपया पुनः प्रयास करें।',
    },
    wellness: {
      fitness_coach_subtitle: 'अपने लक्ष्यों और पसंद के अनुसार व्यक्तिगत शेड्यूल, दिनचर्या और व्यायाम पाएं।',
      fitness_browse_label: 'या श्रेणी के अनुसार ब्राउज़ करें',
      fitness_empty_curating: 'हम आपके लिए सबसे उपयोगी सामग्री तैयार कर रहे हैं।',
    },
    badges: {
      your_badges: 'आपकी उपलब्धियां ({earned} / {total})',
      first_checkin_label: 'पहला कदम',
      first_checkin_desc: 'आपका पहला मूड चेक-इन',
      week_warrior_label: 'सप्ताह योद्धा',
      week_warrior_desc: '7-दिन की लकीर बनाए रखी',
      fortnight_focus_label: 'पखवाड़ा फोकस',
      fortnight_focus_desc: '14-दिन की लकीर बनाए रखी',
      monthly_master_label: 'मासिक मास्टर',
      monthly_master_desc: '30-दिन की लकीर बनाए रखी',
      mood_explorer_label: 'मूड खोजकर्ता',
      mood_explorer_desc: '10 मूड चेक-इन दर्ज किए',
      consistent_50_label: 'निरंतर मन',
      consistent_50_desc: '50 मूड चेक-इन दर्ज किए',
      centurion_label: 'सेंचुरियन',
      centurion_desc: '100 मूड चेक-इन दर्ज किए',
    },
  },
  pa: {
    mood: {
      stat_avg_30d: 'ਔਸਤ (30 ਦਿਨ)',
      stat_streak: 'ਲੜੀ 🔥',
      no_trend: 'ਹਾਲੇ ਕੋਈ ਐਂਟਰੀ ਨਹੀਂ। ਉੱਪਰ ਆਪਣਾ ਮੂਡ ਲੌਗ ਕਰੋ।',
      error_save: 'ਮੂਡ ਸੇਵ ਕਰਨ ਵਿੱਚ ਅਸਫਲ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    },
    wellness: {
      fitness_coach_subtitle: 'ਆਪਣੇ ਟੀਚਿਆਂ ਅਤੇ ਪਸੰਦਾਂ ਅਨੁਸਾਰ ਨਿੱਜੀ ਸ਼ਡ्यूਲ, ਰੁਟੀਨ ਅਤੇ ਕਸਰਤਾਂ ਪ੍ਰਾਪਤ ਕਰੋ।',
      fitness_browse_label: 'ਜਾਂ ਸ਼੍ਰੇਣੀ ਅਨੁਸਾਰ ਬ੍ਰਾਊਜ਼ ਕਰੋ',
      fitness_empty_curating: 'ਅਸੀਂ ਤੁਹਾਡੇ ਲਈ ਸਭ ਤੋਂ ਉਪਯੋਗੀ ਸਮੱਗਰੀ ਤਿਆਰ ਕਰ ਰਹੇ ਹਾਂ।',
    },
    badges: {
      your_badges: 'ਤੁਹਾਡੀਆਂ ਉਪਲਬਧੀਆਂ ({earned} / {total})',
      first_checkin_label: 'ਪਹਿਲਾ ਕਦਮ',
      first_checkin_desc: 'ਤੁਹਾਡਾ ਪਹਿਲਾ ਮੂਡ ਚੈਕ-ਇਨ',
      week_warrior_label: 'ਹਫ਼ਤਾ ਯੋਧਾ',
      week_warrior_desc: '7-ਦਿਨ ਦੀ ਲੜੀ ਬਣਾਈ ਰੱਖੀ',
      fortnight_focus_label: 'ਪੰਦਰ੍ਹਾਂ ਦਿਨ ਫੋਕਸ',
      fortnight_focus_desc: '14-ਦਿਨ ਦੀ ਲੜੀ ਬਣਾਈ ਰੱਖੀ',
      monthly_master_label: 'ਮਹੀਨਾਵਾਰ ਮਾਸਟਰ',
      monthly_master_desc: '30-ਦਿਨ ਦੀ ਲੜੀ ਬਣਾਈ ਰੱਖੀ',
      mood_explorer_label: 'ਮੂਡ ਖੋਜੀ',
      mood_explorer_desc: '10 ਮੂਡ ਚੈਕ-ਇਨ ਦਰਜ ਕੀਤੇ',
      consistent_50_label: 'ਨਿਰੰਤਰ ਮਨ',
      consistent_50_desc: '50 ਮੂਡ ਚੈਕ-ਇਨ ਦਰਜ ਕੀਤੇ',
      centurion_label: 'ਸੈਂਚੁਰੀਅਨ',
      centurion_desc: '100 ਮੂਡ ਚੈਕ-ਇਨ ਦਰਜ ਕੀਤੇ',
    },
  },
  mr: {
    mood: {
      stat_avg_30d: 'सरासरी (30 दिवस)',
      stat_streak: 'साखळी 🔥',
      no_trend: 'अद्याप नोंदी नाहीत. वर तुमचा मूड लॉग करा.',
      error_save: 'मूड सेव्ह करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.',
    },
    wellness: {
      fitness_coach_subtitle: 'तुमच्या उद्दिष्टांनुसार वैयक्तिक वेळापत्रक, दिनचर्या आणि व्यायाम मिळवा.',
      fitness_browse_label: 'किंवा श्रेणीनुसार ब्राउझ करा',
      fitness_empty_curating: 'आम्ही तुमच्यासाठी सर्वात उपयुक्त सामग्री तयार करत आहोत.',
    },
    badges: {
      your_badges: 'तुमची उपलब्धी ({earned} / {total})',
      first_checkin_label: 'पहिले पाऊल',
      first_checkin_desc: 'तुमचा पहिला मूड चेक-इन',
      week_warrior_label: 'आठवडा योद्धा',
      week_warrior_desc: '7-दिवसांची साखळी राखली',
      fortnight_focus_label: 'पंधरा दिवस फोकस',
      fortnight_focus_desc: '14-दिवसांची साखळी राखली',
      monthly_master_label: 'मासिक मास्टर',
      monthly_master_desc: '30-दिवसांची साखळी राखली',
      mood_explorer_label: 'मूड एक्सप्लोरर',
      mood_explorer_desc: '10 मूड चेक-इन नोंदवले',
      consistent_50_label: 'सातत्यपूर्ण मन',
      consistent_50_desc: '50 मूड चेक-इन नोंदवले',
      centurion_label: 'शंभरपलट',
      centurion_desc: '100 मूड चेक-इन नोंदवले',
    },
  },
  es: {
    mood: {
      stat_avg_30d: 'Prom. (30 d)',
      stat_streak: 'Racha 🔥',
      no_trend: 'Aún no hay entradas. Registra tu ánimo arriba.',
      error_save: 'No se pudo guardar el ánimo. Inténtalo de nuevo.',
    },
    wellness: {
      fitness_coach_subtitle: 'Obtén un horario personalizado, rutinas y ejercicios según tus metas.',
      fitness_browse_label: 'O explorar por categoría',
      fitness_empty_curating: 'Estamos preparando el contenido más útil para ti.',
    },
    badges: {
      your_badges: 'Tus insignias ({earned} / {total})',
      first_checkin_label: 'Primer paso',
      first_checkin_desc: 'Registraste tu primer estado de ánimo',
      week_warrior_label: 'Guerrero semanal',
      week_warrior_desc: 'Mantuviste una racha de 7 días',
      fortnight_focus_label: 'Enfoque quincenal',
      fortnight_focus_desc: 'Mantuviste una racha de 14 días',
      monthly_master_label: 'Maestro mensual',
      monthly_master_desc: 'Mantuviste una racha de 30 días',
      mood_explorer_label: 'Explorador de ánimo',
      mood_explorer_desc: 'Registraste 10 estados de ánimo',
      consistent_50_label: 'Mente constante',
      consistent_50_desc: 'Registraste 50 estados de ánimo',
      centurion_label: 'Centurión',
      centurion_desc: 'Registraste 100 estados de ánimo',
    },
  },
  fr: {
    mood: {
      stat_avg_30d: 'Moy. (30 j)',
      stat_streak: 'Série 🔥',
      no_trend: 'Aucune entrée pour l\'instant. Enregistrez votre humeur ci-dessus.',
      error_save: 'Impossible d\'enregistrer l\'humeur. Veuillez réessayer.',
    },
    wellness: {
      fitness_coach_subtitle: 'Obtenez un programme personnalisé selon vos objectifs et préférences.',
      fitness_browse_label: 'Ou parcourir par catégorie',
      fitness_empty_curating: 'Nous préparons le contenu le plus utile pour vous.',
    },
    badges: {
      your_badges: 'Vos badges ({earned} / {total})',
      first_checkin_label: 'Premier pas',
      first_checkin_desc: 'Votre premier suivi d\'humeur',
      week_warrior_label: 'Guerrier de la semaine',
      week_warrior_desc: 'Série de 7 jours maintenue',
      fortnight_focus_label: 'Focus quinzaine',
      fortnight_focus_desc: 'Série de 14 jours maintenue',
      monthly_master_label: 'Maître mensuel',
      monthly_master_desc: 'Série de 30 jours maintenue',
      mood_explorer_label: 'Explorateur d\'humeur',
      mood_explorer_desc: '10 suivis d\'humeur enregistrés',
      consistent_50_label: 'Esprit constant',
      consistent_50_desc: '50 suivis d\'humeur enregistrés',
      centurion_label: 'Centurion',
      centurion_desc: '100 suivis d\'humeur enregistrés',
    },
  },
  bn: {
    mood: {
      stat_avg_30d: 'গড় (৩০ দিন)',
      stat_streak: 'ধারা 🔥',
      no_trend: 'এখনও কোনো এন্ট্রি নেই। উপরে আপনার মুড লগ করুন।',
      error_save: 'মুড সংরক্ষণ ব্যর্থ। আবার চেষ্টা করুন।',
    },
    wellness: {
      fitness_coach_subtitle: 'আপনার লক্ষ্য ও পছন্দ অনুযায়ী ব্যক্তিগত সময়সূচি, রুটিন ও ব্যায়াম পান।',
      fitness_browse_label: 'অথবা বিভাগ অনুযায়ী ব্রাউজ করুন',
      fitness_empty_curating: 'আমরা আপনার জন্য সবচেয়ে উপযোগী কনটেন্ট প্রস্তুত করছি।',
    },
    badges: {
      your_badges: 'আপনার ব্যাজ ({earned} / {total})',
      first_checkin_label: 'প্রথম পদক্ষেপ',
      first_checkin_desc: 'আপনার প্রথম মুড চেক-ইন',
      week_warrior_label: 'সাপ্তাহিক যোদ্ধা',
      week_warrior_desc: '৭ দিনের ধারা বজায় রেখেছেন',
      fortnight_focus_label: 'পাক্ষিক ফোকাস',
      fortnight_focus_desc: '১৪ দিনের ধারা বজায় রেখেছেন',
      monthly_master_label: 'মাসিক মাস্টার',
      monthly_master_desc: '৩০ দিনের ধারা বজায় রেখেছেন',
      mood_explorer_label: 'মুড অন্বেষক',
      mood_explorer_desc: '১০টি মুড চেক-ইন রেকর্ড করেছেন',
      consistent_50_label: 'ধারাবাহিক মন',
      consistent_50_desc: '৫০টি মুড চেক-ইন রেকর্ড করেছেন',
      centurion_label: 'শতক',
      centurion_desc: '১০০টি মুড চেক-ইন রেকর্ড করেছেন',
    },
  },
  te: {
    mood: {
      stat_avg_30d: 'సగటు (30 రోజులు)',
      stat_streak: 'స్ట్రీక్ 🔥',
      no_trend: 'ఇంకా ఎంట్రీలు లేవు. పైన మీ మూడ్‌ను లాగ్ చేయండి.',
      error_save: 'మూడ్ సేవ్ చేయడం విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.',
    },
    wellness: {
      fitness_coach_subtitle: 'మీ లక్ష్యాలు మరియు ప్రాధాన్యతలకు అనుగుణంగా వ్యక్తిగత షెడ్యూల్, రూటీన్లు మరియు వ్యాయామాలు పొందండి.',
      fitness_browse_label: 'లేదా వర్గం ప్రకారం బ్రౌజ్ చేయండి',
      fitness_empty_curating: 'మీ కోసం అత్యంత ఉపయోగకరమైన కంటెంట్‌ను సిద్ధం చేస్తున్నాము.',
    },
    badges: {
      your_badges: 'మీ బ్యాడ్జ్‌లు ({earned} / {total})',
      first_checkin_label: 'మొదటి అడుగు',
      first_checkin_desc: 'మీ మొదటి మూడ్ చెక్-ఇన్',
      week_warrior_label: 'వారపు యోధుడు',
      week_warrior_desc: '7-రోజుల స్ట్రీక్ నిలుపుకున్నారు',
      fortnight_focus_label: 'పదిహేను రోజుల ఫోకస్',
      fortnight_focus_desc: '14-రోజుల స్ట్రీక్ నిలుపుకున్నారు',
      monthly_master_label: 'నెలవారీ మాస్టర్',
      monthly_master_desc: '30-రోజుల స్ట్రీక్ నిలుపుకున్నారు',
      mood_explorer_label: 'మూడ్ ఎక్స్‌ప్లోరర్',
      mood_explorer_desc: '10 మూడ్ చెక్-ఇన్‌లు నమోదు చేశారు',
      consistent_50_label: 'స్థిరమైన మనసు',
      consistent_50_desc: '50 మూడ్ చెక్-ఇన్‌లు నమోదు చేశారు',
      centurion_label: 'సెంచురియన్',
      centurion_desc: '100 మూడ్ చెక్-ఇన్‌లు నమోదు చేశారు',
    },
  },
  ta: {
    mood: {
      stat_avg_30d: 'சராசரி (30 நாட்கள்)',
      stat_streak: 'தொடர் 🔥',
      no_trend: 'இன்னும் பதிவுகள் இல்லை. மேலே உங்கள் மனநிலையை பதிவு செய்யுங்கள்.',
      error_save: 'மனநிலையை சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
    },
    wellness: {
      fitness_coach_subtitle: 'உங்கள் இலக்குகள் மற்றும் விருப்பங்களுக்கு ஏற்ப தனிப்பயன் அட்டவணை, வழக்கங்கள் மற்றும் பயிற்சிகளைப் பெறுங்கள்.',
      fitness_browse_label: 'அல்லது வகையின்படி உலாவுங்கள்',
      fitness_empty_curating: 'உங்களுக்காக மிகவும் பயனுள்ள உள்ளடக்கத்தை தயார் செய்கிறோம்.',
    },
    badges: {
      your_badges: 'உங்கள் பேட்ஜ்கள் ({earned} / {total})',
      first_checkin_label: 'முதல் படி',
      first_checkin_desc: 'உங்கள் முதல் மனநிலை சரிபார்ப்பு',
      week_warrior_label: 'வார வீரர்',
      week_warrior_desc: '7-நாள் தொடரை பராமரித்தீர்கள்',
      fortnight_focus_label: 'பதினைந்து நாள் கவனம்',
      fortnight_focus_desc: '14-நாள் தொடரை பராமரித்தீர்கள்',
      monthly_master_label: 'மாதாந்திர மாஸ்டர்',
      monthly_master_desc: '30-நாள் தொடரை பராமரித்தீர்கள்',
      mood_explorer_label: 'மனநிலை ஆராய்வாளர்',
      mood_explorer_desc: '10 மனநிலை சரிபார்ப்புகள் பதிவு செய்தீர்கள்',
      consistent_50_label: 'தொடர்ச்சியான மனம்',
      consistent_50_desc: '50 மனநிலை சரிபார்ப்புகள் பதிவு செய்தீர்கள்',
      centurion_label: 'நூற்றாண்டு வீரர்',
      centurion_desc: '100 மனநிலை சரிபார்ப்புகள் பதிவு செய்தீர்கள்',
    },
  },
  gu: {
    mood: {
      stat_avg_30d: 'સરેરાશ (30 દિવસ)',
      stat_streak: 'સતત 🔥',
      no_trend: 'હજી કોઈ એન્ટ્રી નથી. ઉપર તમારું મૂડ લોગ કરો.',
      error_save: 'મૂડ સાચવવામાં નિષ્ફળ. કૃપા કરીને ફરી પ્રયાસ કરો.',
    },
    wellness: {
      fitness_coach_subtitle: 'તમારા લક્ષ્યો અને પસંદગીઓ અનુસાર વ્યક્તિગત શેડ્યૂલ, દિનચર્યા અને કસરતો મેળવો.',
      fitness_browse_label: 'અથવા શ્રેણી પ્રમાણે બ્રાઉઝ કરો',
      fitness_empty_curating: 'અમે તમારા માટે સૌથી ઉપયોગી સામગ્રી તૈયાર કરી રહ્યા છીએ.',
    },
    badges: {
      your_badges: 'તમારા બેજ ({earned} / {total})',
      first_checkin_label: 'પહેલું પગલું',
      first_checkin_desc: 'તમારું પહેલું મૂડ ચેક-ઇન',
      week_warrior_label: 'સાપ્તાહિક યોદ્ધા',
      week_warrior_desc: '7-દિવસની સતત જાળવી',
      fortnight_focus_label: 'પંદર દિવસ ફોકસ',
      fortnight_focus_desc: '14-દિવસની સતત જાળવી',
      monthly_master_label: 'માસિક માસ્ટર',
      monthly_master_desc: '30-દિવસની સતત જાળવી',
      mood_explorer_label: 'મૂડ એક્સપ્લોરર',
      mood_explorer_desc: '10 મૂડ ચેક-ઇન નોંધ્યા',
      consistent_50_label: 'સતત મન',
      consistent_50_desc: '50 મૂડ ચેક-ઇન નોંધ્યા',
      centurion_label: 'સેન્ચુરિયન',
      centurion_desc: '100 મૂડ ચેક-ઇન નોંધ્યા',
    },
  },
  kn: {
    mood: {
      stat_avg_30d: 'ಸರಾಸರಿ (30 ದಿನ)',
      stat_streak: 'ಸ್ಟ್ರೀಕ್ 🔥',
      no_trend: 'ಇನ್ನೂ ಯಾವುದೇ ನಮೂದುಗಳಿಲ್ಲ. ಮೇಲೆ ನಿಮ್ಮ ಮೂಡ್ ಲಾಗ್ ಮಾಡಿ.',
      error_save: 'ಮೂಡ್ ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    },
    wellness: {
      fitness_coach_subtitle: 'ನಿಮ್ಮ ಗುರಿಗಳು ಮತ್ತು ಆದ್ಯತೆಗಳಿಗೆ ಅನುಗುಣವಾಗಿ ವೈಯಕ್ತಿಕ ವೇಳಾಪಟ್ಟಿ, ದಿನಚರಿ ಮತ್ತು ವ್ಯಾಯಾಮಗಳನ್ನು ಪಡೆಯಿರಿ.',
      fitness_browse_label: 'ಅಥವಾ ವರ್ಗದ ಪ್ರಕಾರ ಬ್ರೌಸ್ ಮಾಡಿ',
      fitness_empty_curating: 'ನಿಮಗಾಗಿ ಅತ್ಯಂತ ಉಪಯುಕ್ತ ವಿಷಯವನ್ನು ಸಿದ್ಧಪಡಿಸುತ್ತಿದ್ದೇವೆ.',
    },
    badges: {
      your_badges: 'ನಿಮ್ಮ ಬ್ಯಾಡ್ಜ್‌ಗಳು ({earned} / {total})',
      first_checkin_label: 'ಮೊದಲ ಹೆಜ್ಜೆ',
      first_checkin_desc: 'ನಿಮ್ಮ ಮೊದಲ ಮೂಡ್ ಚೆಕ್-ಇನ್',
      week_warrior_label: 'ವಾರದ ಯೋಧ',
      week_warrior_desc: '7-ದಿನದ ಸ್ಟ್ರೀಕ್ ನಿಮ್ಮಿಟ್ಟ',
      fortnight_focus_label: '15 ದಿನದ ಫೋಕಸ್',
      fortnight_focus_desc: '14-ದಿನದ ಸ್ಟ್ರೀಕ್ ನಿಮ್ಮಿಟ್ಟ',
      monthly_master_label: 'ಮಾಸಿಕ ಮಾಸ್ಟರ್',
      monthly_master_desc: '30-ದಿನದ ಸ್ಟ್ರೀಕ್ ನಿಮ್ಮಿಟ್ಟ',
      mood_explorer_label: 'ಮೂಡ್ ಎಕ್ಸ್‌ಪ್ಲೋರರ್',
      mood_explorer_desc: '10 ಮೂಡ್ ಚೆಕ್-ಇನ್‌ಗಳನ್ನು ದಾಖಲಿಸಿದ್ದೀರಿ',
      consistent_50_label: 'ಸ್ಥಿರ ಮನ',
      consistent_50_desc: '50 ಮೂಡ್ ಚೆಕ್-ಇನ್‌ಗಳನ್ನು ದಾಖಲಿಸಿದ್ದೀರಿ',
      centurion_label: 'ಸೆಂಚುರಿಯನ್',
      centurion_desc: '100 ಮೂಡ್ ಚೆಕ್-ಇನ್‌ಗಳನ್ನು ದಾಖಲಿಸಿದ್ದೀರಿ',
    },
  },
  ml: {
    mood: {
      stat_avg_30d: 'ശരാശരി (30 ദിവസം)',
      stat_streak: 'സ്ട്രീക്ക് 🔥',
      no_trend: 'ഇതുവരെ എൻട്രികളില്ല. മുകളിൽ നിങ്ങളുടെ മൂഡ് ലോഗ് ചെയ്യുക.',
      error_save: 'മൂഡ് സേവ് ചെയ്യാൻ പരാജയപ്പെട്ടു. വീണ്ടും ശ്രമിക്കുക.',
    },
    wellness: {
      fitness_coach_subtitle: 'നിങ്ങളുടെ ലക്ഷ്യങ്ങൾക്കും മുൻഗണനകൾക്കും അനുസൃതമായി വ്യക്തിഗത ഷെഡ്യൂൾ, ദിനചര്യ, വ്യായാമങ്ങൾ നേടുക.',
      fitness_browse_label: 'അല്ലെങ്കിൽ വിഭാഗം അനുസരിച്ച് ബ്രൗസ് ചെയ്യുക',
      fitness_empty_curating: 'നിങ്ങൾക്കായി ഏറ്റവും ഉപയോഗപ്രദമായ ഉള്ളടക്കം തയ്യാറാക്കുന്നു.',
    },
    badges: {
      your_badges: 'നിങ്ങളുടെ ബാഡ്ജുകൾ ({earned} / {total})',
      first_checkin_label: 'ആദ്യപടി',
      first_checkin_desc: 'നിങ്ങളുടെ ആദ്യ മൂഡ് ചെക്ക്-ഇൻ',
      week_warrior_label: 'വാരാന്ത്യ യോദ്ധാവ്',
      week_warrior_desc: '7-ദിവസത്തെ സ്ട്രീക്ക് നിലനിർത്തി',
      fortnight_focus_label: 'പതിനഞ്ച് ദിവസ ഫോക്കസ്',
      fortnight_focus_desc: '14-ദിവസത്തെ സ്ട്രീക്ക് നിലനിർത്തി',
      monthly_master_label: 'മാസിക മാസ്റ്റർ',
      monthly_master_desc: '30-ദിവസത്തെ സ്ട്രീക്ക് നിലനിർത്തി',
      mood_explorer_label: 'മൂഡ് എക്സ്പ്ലോറർ',
      mood_explorer_desc: '10 മൂഡ് ചെക്ക്-ഇനുകൾ രേഖപ്പെടുത്തി',
      consistent_50_label: 'സ്ഥിരമായ മനസ്സ്',
      consistent_50_desc: '50 മൂഡ് ചെക്ക്-ഇനുകൾ രേഖപ്പെടുത്തി',
      centurion_label: 'സെഞ്ചുറിയൻ',
      centurion_desc: '100 മൂഡ് ചെക്ക്-ഇനുകൾ രേഖപ്പെടുത്തി',
    },
  },
  de: {
    mood: {
      stat_avg_30d: 'Ø (30 T.)',
      stat_streak: 'Serie 🔥',
      no_trend: 'Noch keine Einträge. Erfasse oben deine Stimmung.',
      error_save: 'Stimmung konnte nicht gespeichert werden. Bitte erneut versuchen.',
    },
    wellness: {
      fitness_coach_subtitle: 'Erhalte personalisierte Pläne, Routinen und Übungen nach deinen Zielen.',
      fitness_browse_label: 'Oder nach Kategorie durchsuchen',
      fitness_empty_curating: 'Wir bereiten die hilfreichsten Inhalte für dich vor.',
    },
    badges: {
      your_badges: 'Deine Abzeichen ({earned} / {total})',
      first_checkin_label: 'Erster Schritt',
      first_checkin_desc: 'Dein erster Stimmungs-Check-in',
      week_warrior_label: 'Wochenkrieger',
      week_warrior_desc: '7-Tage-Serie gehalten',
      fortnight_focus_label: 'Zwei-Wochen-Fokus',
      fortnight_focus_desc: '14-Tage-Serie gehalten',
      monthly_master_label: 'Monatsmeister',
      monthly_master_desc: '30-Tage-Serie gehalten',
      mood_explorer_label: 'Stimmungs-Entdecker',
      mood_explorer_desc: '10 Stimmungs-Check-ins erfasst',
      consistent_50_label: 'Beständiger Geist',
      consistent_50_desc: '50 Stimmungs-Check-ins erfasst',
      centurion_label: 'Zenturio',
      centurion_desc: '100 Stimmungs-Check-ins erfasst',
    },
  },
  pt: {
    mood: {
      stat_avg_30d: 'Méd. (30 d)',
      stat_streak: 'Sequência 🔥',
      no_trend: 'Ainda não há registos. Registe o seu humor acima.',
      error_save: 'Falha ao guardar o humor. Tente novamente.',
    },
    wellness: {
      fitness_coach_subtitle: 'Obtenha horários, rotinas e exercícios personalizados conforme os seus objetivos.',
      fitness_browse_label: 'Ou explorar por categoria',
      fitness_empty_curating: 'Estamos a preparar o conteúdo mais útil para si.',
    },
    badges: {
      your_badges: 'Os seus distintivos ({earned} / {total})',
      first_checkin_label: 'Primeiro passo',
      first_checkin_desc: 'O seu primeiro registo de humor',
      week_warrior_label: 'Guerreiro semanal',
      week_warrior_desc: 'Manteve uma sequência de 7 dias',
      fortnight_focus_label: 'Foco quinzenal',
      fortnight_focus_desc: 'Manteve uma sequência de 14 dias',
      monthly_master_label: 'Mestre mensal',
      monthly_master_desc: 'Manteve uma sequência de 30 dias',
      mood_explorer_label: 'Explorador de humor',
      mood_explorer_desc: 'Registou 10 check-ins de humor',
      consistent_50_label: 'Mente consistente',
      consistent_50_desc: 'Registou 50 check-ins de humor',
      centurion_label: 'Centurião',
      centurion_desc: 'Registou 100 check-ins de humor',
    },
  },
  ar: {
    mood: {
      stat_avg_30d: 'المتوسط (30 يومًا)',
      stat_streak: 'سلسلة 🔥',
      no_trend: 'لا توجد إدخالات بعد. سجّل مزاجك أعلاه.',
      error_save: 'تعذّر حفظ المزاج. يرجى المحاولة مرة أخرى.',
    },
    wellness: {
      fitness_coach_subtitle: 'احصل على جدول وروتين وتمارين مخصصة وفق أهدافك وتفضيلاتك.',
      fitness_browse_label: 'أو تصفّح حسب الفئة',
      fitness_empty_curating: 'نُعدّ المحتوى الأكثر فائدة لك.',
    },
    badges: {
      your_badges: 'شاراتك ({earned} / {total})',
      first_checkin_label: 'الخطوة الأولى',
      first_checkin_desc: 'أول تسجيل لمزاجك',
      week_warrior_label: 'محارب الأسبوع',
      week_warrior_desc: 'حافظت على سلسلة 7 أيام',
      fortnight_focus_label: 'تركيز نصف شهري',
      fortnight_focus_desc: 'حافظت على سلسلة 14 يومًا',
      monthly_master_label: 'سيد الشهر',
      monthly_master_desc: 'حافظت على سلسلة 30 يومًا',
      mood_explorer_label: 'مستكشف المزاج',
      mood_explorer_desc: 'سجّلت 10 تسجيلات للمزاج',
      consistent_50_label: 'عقل ثابت',
      consistent_50_desc: 'سجّلت 50 تسجيلًا للمزاج',
      centurion_label: 'قائد المئة',
      centurion_desc: 'سجّلت 100 تسجيل للمزاج',
    },
  },
  zh: {
    mood: {
      stat_avg_30d: '平均（30天）',
      stat_streak: '连续 🔥',
      no_trend: '尚无记录。请在上方记录您的心情。',
      error_save: '保存心情失败，请重试。',
    },
    wellness: {
      fitness_coach_subtitle: '根据您的目标和偏好获取个性化计划、日常安排和锻炼内容。',
      fitness_browse_label: '或按类别浏览',
      fitness_empty_curating: '我们正在为您准备最有用的内容。',
    },
    badges: {
      your_badges: '您的徽章（{earned} / {total}）',
      first_checkin_label: '第一步',
      first_checkin_desc: '您的首次心情打卡',
      week_warrior_label: '周战士',
      week_warrior_desc: '保持7天连续打卡',
      fortnight_focus_label: '双周专注',
      fortnight_focus_desc: '保持14天连续打卡',
      monthly_master_label: '月度大师',
      monthly_master_desc: '保持30天连续打卡',
      mood_explorer_label: '心情探索者',
      mood_explorer_desc: '记录了10次心情打卡',
      consistent_50_label: '稳定之心',
      consistent_50_desc: '记录了50次心情打卡',
      centurion_label: '百次达人',
      centurion_desc: '记录了100次心情打卡',
    },
  },
};

for (const lang of LANGS) {
  const patch = PATCHES[lang];
  if (!patch) continue;
  for (const [section, keys] of Object.entries(patch)) {
    if (!translations[lang][section]) translations[lang][section] = {};
    Object.assign(translations[lang][section], keys);
  }
}

function serializeSection(obj, depth) {
  const pad = '  '.repeat(depth);
  return Object.entries(obj)
    .map(([key, val]) => {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        return `${pad}${key}: {\n${serializeSection(val, depth + 1)}\n${pad}},`;
      }
      return `${pad}${key}: ${JSON.stringify(val)},`;
    })
    .join('\n');
}

const header = `/**
 * MindCare App — Localization Dictionary
 * Supports: English (en), Hindi (hi), Punjabi (pa), Marathi (mr),
 *           Bengali (bn), Telugu (te), Tamil (ta), Gujarati (gu),
 *           Kannada (kn), Malayalam (ml), Spanish (es),
 *           French (fr), German (de), Portuguese (pt),
 *           Arabic (ar), Chinese – Simplified (zh)
 *
 * Note: any key missing from a given language automatically falls back
 * to English (see utils/i18n.js), so partial coverage is safe.
 */

`;

const body = LANGS.map((lang) => `  ${lang}: {\n${serializeSection(translations[lang], 2)}\n  },`).join('\n\n');
fs.writeFileSync(outPath, `${header}const translations = {\n${body}\n};\n\nexport default translations;\n`);
console.log('patched wellness fitness + badge strings for', Object.keys(PATCHES).join(', '));
