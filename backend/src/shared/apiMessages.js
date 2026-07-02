const { normalizeLanguage } = require('./locale');

const WELLNESS_MESSAGES = {
  en: {
    request_submitted: 'Wellness request submitted successfully.',
    request_updated: 'Wellness request updated. Admin is reviewing.',
    goals_required: 'Please specify at least one goal.',
    active_plan_exists: 'You already have an active wellness plan.',
    retrieve_failed: 'Failed to retrieve wellness plan',
    submit_failed: 'Failed to submit wellness request',
    no_active_plan: 'No active plan found.',
    task_not_found: 'Task not found in this plan.',
    task_update_failed: 'Failed to update task',
  },
  hi: {
    request_submitted: 'वेलनेस अनुरोध सफलतापूर्वक जमा हो गया।',
    request_updated: 'वेलनेस अनुरोध अपडेट हो गया। एडमिन समीक्षा कर रहा है।',
    goals_required: 'कृपया कम से कम एक लक्ष्य बताएँ।',
    active_plan_exists: 'आपके पास पहले से एक सक्रिय वेलनेस प्लान है।',
    retrieve_failed: 'वेलनेस प्लान लोड करने में विफल',
    submit_failed: 'वेलनेस अनुरोध जमा करने में विफल',
    no_active_plan: 'कोई सक्रिय प्लान नहीं मिला।',
    task_not_found: 'इस प्लान में कार्य नहीं मिला।',
    task_update_failed: 'कार्य अपडेट करने में विफल',
  },
  pa: {
    request_submitted: 'ਵੈਲਨੈਸ ਬੇਨਤੀ ਸਫਲਤਾਪੂਰਵਕ ਜਮਾ ਹੋ ਗਈ।',
    request_updated: 'ਵੈਲਨੈਸ ਬੇਨਤੀ ਅਪਡੇਟ ਹੋ ਗਈ। ਐਡਮਿਨ ਸਮੀਖਿਆ ਕਰ ਰਿਹਾ ਹੈ।',
    goals_required: 'ਕਿਰਪਾ ਕਰਕੇ ਘੱਟੋ-ਘੱਟ ਇੱਕ ਲਕਸ਼ ਦੱਸੋ।',
    active_plan_exists: 'ਤੁਹਾਡੇ ਕੋਲ ਪਹਿਲਾਂ ਹੀ ਇੱਕ ਸਕ੍ਰਿਆ ਵੈਲਨੈਸ ਪਲਾਨ ਹੈ।',
    retrieve_failed: 'ਵੈਲਨੈਸ ਪਲਾਨ ਲੋਡ ਕਰਨ ਵਿੱਚ ਅਸਫਲ',
    submit_failed: 'ਵੈਲਨੈਸ ਬੇਨਤੀ ਜਮਾ ਕਰਨ ਵਿੱਚ ਅਸਫਲ',
    no_active_plan: 'ਕੋਈ ਸਕ੍ਰਿਆ ਪਲਾਨ ਨਹੀਂ ਮਿਲਿਆ।',
    task_not_found: 'ਇਸ ਪਲਾਨ ਵਿੱਚ ਕਾਰਜ ਨਹੀਂ ਮਿਲਿਆ।',
    task_update_failed: 'ਕਾਰਜ ਅਪਡੇਟ ਕਰਨ ਵਿੱਚ ਅਸਫਲ',
  },
  mr: {
    request_submitted: 'वेलनेस विनंती यशस्वीरित्या सबमिट झाली.',
    request_updated: 'वेलनेस विनंती अपडेट झाली. अॅडमिन पुनरावलोकन करत आहे.',
    goals_required: 'कृपया किमान एक ध्येय नमूद करा.',
    active_plan_exists: 'तुमच्याकडे आधीच एक सक्रिय वेलनेस प्लान आहे.',
    retrieve_failed: 'वेलनेस प्लान लोड करण्यात अयशस्वी',
    submit_failed: 'वेलनेस विनंती सबमिट करण्यात अयशस्वी',
    no_active_plan: 'सक्रिय प्लान सापडला नाही.',
    task_not_found: 'या प्लानमध्ये कार्य सापडले नाही.',
    task_update_failed: 'कार्य अपडेट करण्यात अयशस्वी',
  },
};

const EMERGENCY_MESSAGES = {
  en: {
    submitted: 'Emergency contact submitted. An admin will verify it shortly.',
    fetch_failed: 'Failed to fetch emergency contact',
    submit_failed: 'Failed to submit emergency contact',
    delete_failed: 'Failed to delete emergency contact',
  },
  hi: {
    submitted: 'आपातकालीन संपर्क जमा हो गया। एडमिन शीघ्र सत्यापित करेगा।',
    fetch_failed: 'आपातकालीन संपर्क लोड करने में विफल',
    submit_failed: 'आपातकालीन संपर्क जमा करने में विफल',
    delete_failed: 'आपातकालीन संपर्क हटाने में विफल',
  },
  pa: {
    submitted: 'ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ ਜਮਾ ਹੋ ਗਿਆ। ਐਡਮਿਨ ਜਲਦੀ ਪੁਸ਼ਟੀ ਕਰੇਗਾ।',
    fetch_failed: 'ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ ਲੋਡ ਕਰਨ ਵਿੱਚ ਅਸਫਲ',
    submit_failed: 'ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ ਜਮਾ ਕਰਨ ਵਿੱਚ ਅਸਫਲ',
    delete_failed: 'ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ ਮਿਟਾਉਣ ਵਿੱਚ ਅਸਫਲ',
  },
  mr: {
    submitted: 'आपत्कालीन संपर्क सबमिट झाला. अॅडमिन लवकर पडताळणी करेल.',
    fetch_failed: 'आपत्कालीन संपर्क लोड करण्यात अयशस्वी',
    submit_failed: 'आपत्कालीन संपर्क सबमिट करण्यात अयशस्वी',
    delete_failed: 'आपत्कालीन संपर्क हटवण्यात अयशस्वी',
  },
};

function wellnessMessage(key, language) {
  const lang = normalizeLanguage(language);
  const pack = WELLNESS_MESSAGES[lang] || WELLNESS_MESSAGES.en;
  return pack[key] || WELLNESS_MESSAGES.en[key] || key;
}

function emergencyMessage(key, language) {
  const lang = normalizeLanguage(language);
  const pack = EMERGENCY_MESSAGES[lang] || EMERGENCY_MESSAGES.en;
  return pack[key] || EMERGENCY_MESSAGES.en[key] || key;
}

module.exports = { wellnessMessage, emergencyMessage };
