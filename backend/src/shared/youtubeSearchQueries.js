const { normalizeLanguage } = require('./locale');

const YOUTUBE_SEARCH_QUERIES = {
  en: {
    meditation: 'guided meditation calm sleep anxiety 10 minute',
    motivation: 'motivational speech self improvement mental health',
    sleep: 'sleep stories rain sounds deep sleep relaxation',
    relaxing_music: 'peaceful piano deep focus lo-fi ambient relaxation',
    therapy: 'therapy advice psychologists mental health tips coping strategies',
    recommendedPrefix: 'mental health coping strategies',
    recommendedSuffix: 'relaxation safe',
  },
  hi: {
    meditation: 'hindi guided meditation shanti neend chinta 10 minute',
    motivation: 'hindi motivational speech manovigyan swasthya',
    sleep: 'hindi sleep stories barish deep sleep relaxation',
    relaxing_music: 'hindi peaceful piano shant sangeet relaxation',
    therapy: 'hindi therapy mental health tips coping strategies',
    recommendedPrefix: 'mental health hindi coping strategies',
    recommendedSuffix: 'shanti relaxation safe',
  },
  pa: {
    meditation: 'punjabi guided meditation shanti sleep anxiety',
    motivation: 'punjabi motivational mental health speech',
    sleep: 'punjabi sleep relaxation rain sounds',
    relaxing_music: 'punjabi peaceful music relaxation',
    therapy: 'punjabi mental health therapy tips',
    recommendedPrefix: 'mental health punjabi coping strategies',
    recommendedSuffix: 'relaxation safe',
  },
  mr: {
    meditation: 'marathi guided meditation shanti nidra chinta',
    motivation: 'marathi motivational manasik aarogya',
    sleep: 'marathi sleep stories relaxation',
    relaxing_music: 'marathi shant sangeet relaxation',
    therapy: 'marathi mental health therapy tips',
    recommendedPrefix: 'mental health marathi coping strategies',
    recommendedSuffix: 'relaxation safe',
  },
  bn: {
    meditation: 'bengali guided meditation shanti ghum chinta',
    motivation: 'bengali motivational mental health',
    sleep: 'bengali sleep relaxation stories',
    relaxing_music: 'bengali peaceful music relaxation',
    therapy: 'bengali mental health therapy tips',
    recommendedPrefix: 'mental health bengali coping strategies',
    recommendedSuffix: 'relaxation safe',
  },
  te: {
    meditation: 'telugu guided meditation shanti nidra',
    motivation: 'telugu motivational mental health',
    sleep: 'telugu sleep relaxation stories',
    relaxing_music: 'telugu peaceful music relaxation',
    therapy: 'telugu mental health therapy tips',
    recommendedPrefix: 'mental health telugu coping strategies',
    recommendedSuffix: 'relaxation safe',
  },
  ta: {
    meditation: 'tamil guided meditation shanti sleep',
    motivation: 'tamil motivational mental health',
    sleep: 'tamil sleep relaxation stories',
    relaxing_music: 'tamil peaceful music relaxation',
    therapy: 'tamil mental health therapy tips',
    recommendedPrefix: 'mental health tamil coping strategies',
    recommendedSuffix: 'relaxation safe',
  },
  gu: {
    meditation: 'gujarati guided meditation shanti sleep',
    motivation: 'gujarati motivational mental health',
    sleep: 'gujarati sleep relaxation stories',
    relaxing_music: 'gujarati peaceful music relaxation',
    therapy: 'gujarati mental health therapy tips',
    recommendedPrefix: 'mental health gujarati coping strategies',
    recommendedSuffix: 'relaxation safe',
  },
  kn: {
    meditation: 'kannada guided meditation shanti sleep',
    motivation: 'kannada motivational mental health',
    sleep: 'kannada sleep relaxation stories',
    relaxing_music: 'kannada peaceful music relaxation',
    therapy: 'kannada mental health therapy tips',
    recommendedPrefix: 'mental health kannada coping strategies',
    recommendedSuffix: 'relaxation safe',
  },
  ml: {
    meditation: 'malayalam guided meditation shanti sleep',
    motivation: 'malayalam motivational mental health',
    sleep: 'malayalam sleep relaxation stories',
    relaxing_music: 'malayalam peaceful music relaxation',
    therapy: 'malayalam mental health therapy tips',
    recommendedPrefix: 'mental health malayalam coping strategies',
    recommendedSuffix: 'relaxation safe',
  },
  es: {
    meditation: 'meditación guiada calma ansiedad sueño 10 minutos',
    motivation: 'motivación salud mental superación personal',
    sleep: 'historias para dormir lluvia relajación profunda',
    relaxing_music: 'música relajante piano ambiente paz',
    therapy: 'consejos psicología salud mental afrontamiento',
    recommendedPrefix: 'estrategias afrontamiento salud mental',
    recommendedSuffix: 'relajación seguro',
  },
  fr: {
    meditation: 'méditation guidée calme anxiété sommeil 10 minutes',
    motivation: 'motivation santé mentale développement personnel',
    sleep: 'histoires pour dormir pluie relaxation profonde',
    relaxing_music: 'musique relaxante piano ambiance paix',
    therapy: 'conseils psychologie santé mentale coping',
    recommendedPrefix: 'stratégies coping santé mentale',
    recommendedSuffix: 'relaxation sûr',
  },
  de: {
    meditation: 'geführte meditation ruhig schlaf angst 10 minuten',
    motivation: 'motivation psychische gesundheit selbstverbesserung',
    sleep: 'schlafgeschichten regen tiefe entspannung',
    relaxing_music: 'entspannende musik piano ambient frieden',
    therapy: 'psychologie tipps psychische gesundheit bewältigung',
    recommendedPrefix: 'bewältigungsstrategien psychische gesundheit',
    recommendedSuffix: 'entspannung sicher',
  },
  pt: {
    meditation: 'meditação guiada calma ansiedade sono 10 minutos',
    motivation: 'motivação saúde mental superação pessoal',
    sleep: 'histórias para dormir chuva relaxamento profundo',
    relaxing_music: 'música relaxante piano ambiente paz',
    therapy: 'conselhos psicologia saúde mental coping',
    recommendedPrefix: 'estratégias coping saúde mental',
    recommendedSuffix: 'relaxamento seguro',
  },
  ar: {
    meditation: 'تأمل موجه هدوء قلق نوم 10 دقائق',
    motivation: 'تحفيز الصحة النفسية تطوير الذات',
    sleep: 'قصص نوم مطر استرخاء عميق',
    relaxing_music: 'موسيقى هادئة piano استرخاء',
    therapy: 'نصائح علم النفس الصحة النفسية',
    recommendedPrefix: 'استراتيجيات مواجهة الصحة النفسية',
    recommendedSuffix: 'استرخاء آمن',
  },
  zh: {
    meditation: '引导冥想 平静 焦虑 睡眠 10分钟',
    motivation: '励志 心理健康 自我提升',
    sleep: '睡前故事 雨声 深度放松',
    relaxing_music: '放松音乐 钢琴 环境 平静',
    therapy: '心理学建议 心理健康 应对策略',
    recommendedPrefix: '心理健康 应对策略',
    recommendedSuffix: '放松 安全',
  },
};

function getYoutubeSearchQuery(category, language, fusionKeywords = []) {
  const lang = normalizeLanguage(language);
  const pack = YOUTUBE_SEARCH_QUERIES[lang] || YOUTUBE_SEARCH_QUERIES.en;

  if (category === 'recommended') {
    if (fusionKeywords.length) {
      return `${pack.recommendedPrefix} ${fusionKeywords.join(' ')} ${pack.recommendedSuffix}`.trim();
    }
    return pack.meditation;
  }

  return pack[category] || YOUTUBE_SEARCH_QUERIES.en[category];
}

module.exports = {
  YOUTUBE_SEARCH_QUERIES,
  getYoutubeSearchQuery,
};
