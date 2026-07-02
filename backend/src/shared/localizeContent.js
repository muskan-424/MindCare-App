const { translateText } = require('../domains/community/services/tinkChatService');
const { batchTranslateStrings } = require('./batchTranslate');
const { normalizeLanguage } = require('./locale');

async function localizeBlogFeed(feed, language) {
  const lang = normalizeLanguage(language);
  if (lang === 'en' || !feed) return feed;

  const localizePosts = async (posts) => {
    if (!posts?.length) return posts || [];
    const strings = posts.flatMap((p) => [p.title || '', p.author || '']);
    const translated = await batchTranslateStrings(strings, lang);
    return posts.map((p, i) => ({
      ...p,
      title: translated[i * 2] || p.title,
      author: translated[i * 2 + 1] || p.author,
    }));
  };

  const [featured, popular] = await Promise.all([
    localizePosts(feed.featured),
    localizePosts(feed.popular),
  ]);
  return { featured, popular };
}

async function localizeWellnessPlanResponse(response, language) {
  const lang = normalizeLanguage(language);
  if (!response?.exists || lang === 'en') return response;

  const strings = [];
  const slots = [];

  const queue = (value, setter) => {
    strings.push(value || '');
    slots.push(setter);
  };

  queue(response.adminNote, (v) => { response.adminNote = v; });
  queue(response.planFocus, (v) => { response.planFocus = v; });

  (response.dailyPlans || []).forEach((day, dayIdx) => {
    (day.tasks || []).forEach((task, taskIdx) => {
      queue(task.title, (v) => { response.dailyPlans[dayIdx].tasks[taskIdx].title = v; });
      queue(task.description, (v) => { response.dailyPlans[dayIdx].tasks[taskIdx].description = v; });
    });
  });

  if (strings.every((s) => !s.trim())) return response;

  const translated = await batchTranslateStrings(strings, lang);
  translated.forEach((value, i) => slots[i](value));
  return response;
}

async function localizeAssignedResources(resources, language) {
  const lang = normalizeLanguage(language);
  if (lang === 'en' || !resources?.length) return resources;

  const strings = resources.flatMap((r) => [r.title || '', r.description || '']);
  const translated = await batchTranslateStrings(strings, lang);
  return resources.map((r, i) => ({
    ...r,
    title: translated[i * 2] || r.title,
    description: translated[i * 2 + 1] || r.description,
  }));
}

async function localizeTherapist(therapist, language) {
  const lang = normalizeLanguage(language);
  if (lang === 'en' || !therapist) return therapist;

  const fields = ['specialisation', 'bio', 'timing'];
  const strings = fields.map((f) => therapist[f] || '');
  const translated = await batchTranslateStrings(strings, lang);
  return {
    ...therapist,
    specialisation: translated[0] || therapist.specialisation,
    bio: translated[1] || therapist.bio,
    timing: translated[2] || therapist.timing,
  };
}

async function localizeTherapists(therapists, language) {
  if (!therapists?.length) return therapists;
  return Promise.all(therapists.map((t) => localizeTherapist(t, language)));
}

async function localizeGroupSession(session, language) {
  const lang = normalizeLanguage(language);
  if (lang === 'en' || !session) return session;

  const strings = [session.title || '', session.description || '', session.facilitatorName || ''];
  const [title, description, facilitatorName] = await batchTranslateStrings(strings, lang);
  return { ...session, title, description, facilitatorName };
}

async function localizeGroupSessions(sessions, language) {
  if (!sessions?.length) return sessions;
  return Promise.all(sessions.map((s) => localizeGroupSession(s, language)));
}

async function localizeTherapistCategories(categories, language) {
  const lang = normalizeLanguage(language);
  if (lang === 'en' || !categories?.length) return categories;

  const names = categories.map((c) => c.name || '');
  const translated = await batchTranslateStrings(names, lang);
  return categories.map((c, i) => ({ ...c, name: translated[i] || c.name }));
}

module.exports = {
  localizeBlogFeed,
  localizeWellnessPlanResponse,
  localizeAssignedResources,
  localizeTherapist,
  localizeTherapists,
  localizeGroupSession,
  localizeGroupSessions,
  localizeTherapistCategories,
};
