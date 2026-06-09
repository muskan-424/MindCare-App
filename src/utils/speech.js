/**
 * speech.js
 * Thin, crash-proof wrapper around speech-to-text (@react-native-voice/voice)
 * and text-to-speech (react-native-tts). Both native modules are accessed
 * defensively so the chat works even if a module isn't linked on a device.
 */

let Voice = null;
let Tts = null;
let ttsReady = false;

try {
  Voice = require('@react-native-voice/voice').default;
} catch (_) {
  Voice = null;
}

try {
  Tts = require('react-native-tts').default;
  ttsReady = true;
} catch (_) {
  Tts = null;
  ttsReady = false;
}

// App language code → speech locale (BCP-47)
const LOCALE_MAP = {
  en: 'en-US', hi: 'hi-IN', pa: 'pa-IN', mr: 'mr-IN', bn: 'bn-IN',
  te: 'te-IN', ta: 'ta-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN',
  es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-PT', ar: 'ar-SA', zh: 'zh-CN',
};

export function localeFor(language) {
  return LOCALE_MAP[language] || 'en-US';
}

export function isVoiceAvailable() {
  return !!Voice;
}

export function isTtsAvailable() {
  return !!Tts && ttsReady;
}

/**
 * Begin listening for speech. Wires the provided callbacks to Voice events.
 * Returns true if listening actually started.
 */
export async function startListening({ language = 'en', onResult, onPartial, onError, onEnd } = {}) {
  if (!Voice) {
    onError && onError(new Error('voice_unavailable'));
    return false;
  }
  try {
    Voice.onSpeechResults = (e) => {
      const value = e && e.value && e.value[0];
      if (value && onResult) onResult(value);
    };
    Voice.onSpeechPartialResults = (e) => {
      const value = e && e.value && e.value[0];
      if (value && onPartial) onPartial(value);
    };
    Voice.onSpeechError = (e) => {
      if (onError) onError(e && e.error ? e.error : e);
    };
    Voice.onSpeechEnd = () => { if (onEnd) onEnd(); };

    await Voice.start(localeFor(language));
    return true;
  } catch (err) {
    onError && onError(err);
    return false;
  }
}

export async function stopListening() {
  if (!Voice) return;
  try {
    await Voice.stop();
  } catch (_) { /* ignore */ }
}

export async function destroyVoice() {
  if (!Voice) return;
  try {
    await Voice.destroy();
    Voice.removeAllListeners && Voice.removeAllListeners();
  } catch (_) { /* ignore */ }
}

/** Speak text aloud in the given language. */
export function speak(text, language = 'en') {
  if (!Tts || !text) return;
  try {
    Tts.stop();
    Tts.setDefaultLanguage && Tts.setDefaultLanguage(localeFor(language));
    Tts.speak(String(text));
  } catch (_) { /* ignore */ }
}

export function stopSpeaking() {
  if (!Tts) return;
  try { Tts.stop(); } catch (_) { /* ignore */ }
}
