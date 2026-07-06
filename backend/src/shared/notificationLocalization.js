const Notification = require('../domains/admin/models/Notification');
const { translateText } = require('../domains/community/services/tinkChatService');
const { normalizeLanguage, SUPPORTED_LANGUAGES } = require('./locale');

function pickStoredTranslation(notification, language) {
  const lang = normalizeLanguage(language);
  if (lang === 'en') {
    return { title: notification.title, body: notification.body };
  }
  const translations = notification.translations;
  if (!translations) return null;
  const entry = typeof translations.get === 'function'
    ? translations.get(lang)
    : translations[lang];
  if (entry?.title && entry?.body) return entry;
  return null;
}

async function ensureNotificationTranslation(notification, language) {
  const lang = normalizeLanguage(language);
  if (lang === 'en') {
    return { title: notification.title, body: notification.body };
  }

  const cached = pickStoredTranslation(notification, lang);
  if (cached) return cached;

  const [title, body] = await Promise.all([
    translateText({ text: notification.title, targetLanguage: lang }),
    translateText({ text: notification.body, targetLanguage: lang }),
  ]);

  const id = notification._id || notification.id;
  if (id) {
    await Notification.updateOne(
      { _id: id },
      { $set: { [`translations.${lang}`]: { title, body } } },
    ).catch((err) => console.warn('Notification translation cache failed:', err.message));
  }

  return { title, body };
}

async function localizeNotifications(notifications, language) {
  const lang = normalizeLanguage(language);
  if (lang === 'en') {
    return notifications.map((n) => ({
      ...n,
      title: n.title,
      body: n.body,
    }));
  }

  return Promise.all(
    notifications.map(async (notification) => {
      const localized = await ensureNotificationTranslation(notification, lang);
      return { ...notification, ...localized };
    }),
  );
}

/** Fire-and-forget: pre-translate a broadcast into all supported languages. */
function scheduleNotificationTranslations(notificationId, title, body) {
  const id = String(notificationId);
  const targets = SUPPORTED_LANGUAGES.filter((lang) => lang !== 'en');

  (async () => {
    for (const lang of targets) {
      try {
        const [tTitle, tBody] = await Promise.all([
          translateText({ text: title, targetLanguage: lang }),
          translateText({ text: body, targetLanguage: lang }),
        ]);
        await Notification.updateOne(
          { _id: id },
          { $set: { [`translations.${lang}`]: { title: tTitle, body: tBody } } },
        );
      } catch (err) {
        console.warn(`Notification pre-translate (${lang}) failed:`, err.message);
      }
    }
  })().catch((err) => console.warn('Notification pre-translate batch failed:', err.message));
}

module.exports = {
  pickStoredTranslation,
  ensureNotificationTranslation,
  localizeNotifications,
  scheduleNotificationTranslations,
};
