/**
 * Phase 3 i18n blocks — auth, crisis, concerns, journal, home/profile extensions.
 * Applied via scripts/apply-phase3-i18n.mjs
 */

const AUTH_EN = {
  login: 'Login',
  clinician_login: 'Clinician Login',
  admin_login: 'Admin Login',
  signup_title: 'Signup',
  forgot_password_title: 'Forgot Password',
  reset_password_title: 'Reset Password',
  patient: 'Patient',
  professional: 'Professional',
  admin: 'Admin',
  email: 'Email',
  password: 'Password',
  confirm_password: 'Confirm Password',
  full_name: 'Full Name',
  phone: 'Phone Number',
  age: 'Age',
  male: 'Male',
  female: 'Female',
  other: 'Other',
  login_button: 'Login',
  signup_button: 'Signup',
  send_code: 'Send Code',
  back_to_login: 'Back to Login',
  no_account: "Don't have an account?",
  has_account: 'Already have an account?',
  forgot_password_link: 'Forgot Password?',
  forgot_subtext: 'Enter your registered email address below. We will generate a reset code for you.',
  reset_subtext: 'Enter the 6-digit code sent to you and your new password.',
  otp_placeholder: '6-digit OTP Code',
  new_password: 'New Password',
  register_clinician: 'Register as a Professional Clinician',
  select_role: 'Select your role:',
  login_failed: 'Login failed. Please try again.',
  signup_failed: 'Signup failed. Please try again.',
  send_code_failed: 'Failed to send reset code. Please try again.',
  reset_failed: 'Failed to reset password. Please check your OTP.',
  reset_success: 'Password successfully reset. You can now login with your new password.',
  roles: {
    psychologist: 'Psychologist',
    psychiatrist: 'Psychiatrist',
    counsellor: 'Counsellor',
    social_worker: 'Social Worker',
  },
  validation: {
    email_required: 'Email is required',
    email_invalid: 'Enter a valid email address',
    email_must_contain_at: 'Email must contain @',
    phone_required: 'Phone number is required',
    phone_invalid: 'Phone number must be exactly 10 digits',
    password_required: 'Password is required',
    password_min_length: 'Password must be at least 8 characters',
    password_lowercase: 'Password must include a lowercase letter',
    password_uppercase: 'Password must include an uppercase letter',
    password_number: 'Password must include a number',
    password_symbol: 'Password must include a symbol (e.g. !@#$%)',
    full_name_required: 'Full name is required',
    age_invalid: 'Please enter a valid age (1–150)',
    gender_required: 'Please select gender',
    passwords_mismatch: 'Passwords do not match',
    otp_invalid: 'Please enter a valid 6-digit OTP code.',
  },
};

const AUTH_HI = {
  login: 'लॉगिन',
  clinician_login: 'क्लिनिशियन लॉगिन',
  admin_login: 'एडमिन लॉगिन',
  signup_title: 'साइन अप',
  forgot_password_title: 'पासवर्ड भूल गए',
  reset_password_title: 'पासवर्ड रीसेट',
  patient: 'मरीज़',
  professional: 'पेशेवर',
  admin: 'एडमिन',
  email: 'ईमेल',
  password: 'पासवर्ड',
  confirm_password: 'पासवर्ड की पुष्टि',
  full_name: 'पूरा नाम',
  phone: 'फ़ोन नंबर',
  age: 'आयु',
  male: 'पुरुष',
  female: 'महिला',
  other: 'अन्य',
  login_button: 'लॉगिन',
  signup_button: 'साइन अप',
  send_code: 'कोड भेजें',
  back_to_login: 'लॉगिन पर वापस',
  no_account: 'खाता नहीं है?',
  has_account: 'पहले से खाता है?',
  forgot_password_link: 'पासवर्ड भूल गए?',
  forgot_subtext: 'नीचे अपना पंजीकृत ईमेल दर्ज करें। हम आपके लिए रीसेट कोड जनरेट करेंगे।',
  reset_subtext: 'आपको भेजा गया 6-अंकीय कोड और नया पासवर्ड दर्ज करें।',
  otp_placeholder: '6-अंकीय OTP कोड',
  new_password: 'नया पासवर्ड',
  register_clinician: 'पेशेवर क्लिनिशियन के रूप में पंजीकरण',
  select_role: 'अपनी भूमिका चुनें:',
  login_failed: 'लॉगिन विफल। कृपया पुनः प्रयास करें।',
  signup_failed: 'साइन अप विफल। कृपया पुनः प्रयास करें।',
  send_code_failed: 'रीसेट कोड भेजने में विफल। कृपया पुनः प्रयास करें।',
  reset_failed: 'पासवर्ड रीसेट विफल। कृपया OTP जांचें।',
  reset_success: 'पासवर्ड सफलतापूर्वक रीसेट। अब नए पासवर्ड से लॉगिन करें।',
  roles: {
    psychologist: 'मनोवैज्ञानिक',
    psychiatrist: 'मनोचिकित्सक',
    counsellor: 'परामर्शदाता',
    social_worker: 'सामाजिक कार्यकर्ता',
  },
  validation: {
    email_required: 'ईमेल आवश्यक है',
    email_invalid: 'मान्य ईमेल पता दर्ज करें',
    email_must_contain_at: 'ईमेल में @ होना चाहिए',
    phone_required: 'फ़ोन नंबर आवश्यक है',
    phone_invalid: 'फ़ोन नंबर ठीक 10 अंकों का होना चाहिए',
    password_required: 'पासवर्ड आवश्यक है',
    password_min_length: 'पासवर्ड कम से कम 8 अक्षर का होना चाहिए',
    password_lowercase: 'पासवर्ड में छोटा अक्षर होना चाहिए',
    password_uppercase: 'पासवर्ड में बड़ा अक्षर होना चाहिए',
    password_number: 'पासवर्ड में संख्या होनी चाहिए',
    password_symbol: 'पासवर्ड में प्रतीक होना चाहिए (जैसे !@#$%)',
    full_name_required: 'पूरा नाम आवश्यक है',
    age_invalid: 'कृपया मान्य आयु दर्ज करें (1–150)',
    gender_required: 'कृपया लिंग चुनें',
    passwords_mismatch: 'पासवर्ड मेल नहीं खाते',
    otp_invalid: 'कृपया मान्य 6-अंकीय OTP कोड दर्ज करें।',
  },
};

const AUTH_PA = {
  login: 'ਲੌਗਇਨ',
  clinician_login: 'ਕਲੀਨੀਸ਼ੀਅਨ ਲੌਗਇਨ',
  admin_login: 'ਐਡਮਿਨ ਲੌਗਇਨ',
  signup_title: 'ਸਾਈਨ ਅੱਪ',
  forgot_password_title: 'ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ',
  reset_password_title: 'ਪਾਸਵਰਡ ਰੀਸੈੱਟ',
  patient: 'ਮਰੀਜ਼',
  professional: 'ਪੇਸ਼ੇਵਰ',
  admin: 'ਐਡਮਿਨ',
  email: 'ਈਮੇਲ',
  password: 'ਪਾਸਵਰਡ',
  confirm_password: 'ਪਾਸਵਰਡ ਦੀ ਪੁਸ਼ਟੀ',
  full_name: 'ਪੂਰਾ ਨਾਮ',
  phone: 'ਫ਼ੋਨ ਨੰਬਰ',
  age: 'ਉਮਰ',
  male: 'ਮਰਦ',
  female: 'ਔਰਤ',
  other: 'ਹੋਰ',
  login_button: 'ਲੌਗਇਨ',
  signup_button: 'ਸਾਈਨ ਅੱਪ',
  send_code: 'ਕੋਡ ਭੇਜੋ',
  back_to_login: 'ਲੌਗਇਨ ਤੇ ਵਾਪਸ',
  no_account: 'ਖਾਤਾ ਨਹੀਂ ਹੈ?',
  has_account: 'ਪਹਿਲਾਂ ਤੋਂ ਖਾਤਾ ਹੈ?',
  forgot_password_link: 'ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ?',
  forgot_subtext: 'ਹੇਠਾਂ ਆਪਣਾ ਰਜਿਸਟਰਡ ਈਮੇਲ ਦਰਜ ਕਰੋ। ਅਸੀਂ ਰੀਸੈੱਟ ਕੋਡ ਤਿਆਰ ਕਰਾਂਗੇ।',
  reset_subtext: 'ਤੁਹਾਨੂੰ ਭੇਜਿਆ 6-ਅੰਕੀ ਕੋਡ ਅਤੇ ਨਵਾਂ ਪਾਸਵਰਡ ਦਰਜ ਕਰੋ।',
  otp_placeholder: '6-ਅੰਕੀ OTP ਕੋਡ',
  new_password: 'ਨਵਾਂ ਪਾਸਵਰਡ',
  register_clinician: 'ਪੇਸ਼ੇਵਰ ਕਲੀਨੀਸ਼ੀਅਨ ਵਜੋਂ ਰਜਿਸਟਰ',
  select_role: 'ਆਪਣੀ ਭੂਮਿਕਾ ਚੁਣੋ:',
  login_failed: 'ਲੌਗਇਨ ਅਸਫਲ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  signup_failed: 'ਸਾਈਨ ਅੱਪ ਅਸਫਲ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  send_code_failed: 'ਰੀਸੈੱਟ ਕੋਡ ਭੇਜਣ ਵਿੱਚ ਅਸਫਲ।',
  reset_failed: 'ਪਾਸਵਰਡ ਰੀਸੈੱਟ ਅਸਫਲ। OTP ਜਾਂਚ ਕਰੋ।',
  reset_success: 'ਪਾਸਵਰਡ ਸਫਲਤਾਪੂਰਵਕ ਰੀਸੈੱਟ। ਹੁਣ ਨਵੇਂ ਪਾਸਵਰਡ ਨਾਲ ਲੌਗਇਨ ਕਰੋ।',
  roles: {
    psychologist: 'ਮਨੋਵਿਗਿਆਨੀ',
    psychiatrist: 'ਮਨੋਚਿਕਿਤਸਕ',
    counsellor: 'ਸਲਾਹਕਾਰ',
    social_worker: 'ਸਮਾਜਿਕ ਕarmy',
  },
  validation: {
    email_required: 'ਈਮੇਲ ਲੋੜੀਂਦੀ ਹੈ',
    email_invalid: 'ਮਾਨ्य ਈਮੇਲ ਪਤਾ ਦਰਜ ਕਰੋ',
    email_must_contain_at: 'ਈਮੇਲ ਵਿੱਚ @ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ',
    phone_required: 'ਫ਼ੋਨ ਨੰਬਰ ਲੋੜੀਂਦਾ ਹੈ',
    phone_invalid: 'ਫ਼ੋਨ ਨੰਬਰ ਠੀਕ 10 ਅੰਕਾਂ ਦਾ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ',
    password_required: 'ਪਾਸਵਰਡ ਲੋੜੀਂਦਾ ਹੈ',
    password_min_length: 'ਪਾਸਵਰਡ ਘੱਟੋ-ਘੱਟ 8 ਅੱਖਰਾਂ ਦਾ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ',
    password_lowercase: 'ਪਾਸਵਰਡ ਵਿੱਚ ਛੋਟਾ ਅੱਖਰ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ',
    password_uppercase: 'ਪਾਸਵਰਡ ਵਿੱਚ ਵੱਡਾ ਅੱਖਰ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ',
    password_number: 'ਪਾਸਵਰਡ ਵਿੱਚ ਨੰਬਰ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ',
    password_symbol: 'ਪਾਸਵਰਡ ਵਿੱਚ ਚਿੰਨ੍ਹ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ (ਜਿਵੇਂ !@#$%)',
    full_name_required: 'ਪੂਰਾ ਨਾਮ ਲੋੜੀਂਦਾ ਹੈ',
    age_invalid: 'ਕਿਰਪਾ ਕਰਕੇ ਮਾਨ्य ਉਮਰ ਦਰਜ ਕਰੋ (1–150)',
    gender_required: 'ਕਿਰਪਾ ਕਰਕੇ ਲਿੰਗ ਚੁਣੋ',
    passwords_mismatch: 'ਪਾਸਵਰਡ ਮੇਲ ਨਹੀਂ ਖਾਂਦੇ',
    otp_invalid: 'ਕਿਰਪਾ ਕਰਕੇ ਮਾਨ्य 6-ਅੰਕੀ OTP ਕੋਡ ਦਰਜ ਕਰੋ।',
  },
};

// Fix typo in AUTH_PA social_worker
AUTH_PA.roles.social_worker = 'ਸਮਾਜਿਕ ਕarmy'.replace('karmy', 'ਕarmy');
AUTH_PA.roles.social_worker = 'ਸਮਾਜਿਕ ਕਾਰਕੁਨ';

const AUTH_MR = {
  login: 'लॉगिन',
  clinician_login: 'क्लिनिशियन लॉगिन',
  admin_login: 'अॅडमिन लॉगिन',
  signup_title: 'साइन अप',
  forgot_password_title: 'पासवर्ड विसरलात',
  reset_password_title: 'पासवर्ड रीसेट',
  patient: 'रुग्ण',
  professional: 'व्यावसायिक',
  admin: 'अॅडमिन',
  email: 'ईमेल',
  password: 'पासवर्ड',
  confirm_password: 'पासवर्डची पुष्टी',
  full_name: 'पूर्ण नाव',
  phone: 'फोन नंबर',
  age: 'वय',
  male: 'पुरुष',
  female: 'स्त्री',
  other: 'इतर',
  login_button: 'लॉगिन',
  signup_button: 'साइन अप',
  send_code: 'कोड पाठवा',
  back_to_login: 'लॉगिनवर परत',
  no_account: 'खाते नाही?',
  has_account: 'आधीच खाते आहे?',
  forgot_password_link: 'पासवर्ड विसरलात?',
  forgot_subtext: 'खाली नोंदणीकृत ईमेल प्रविष्ट करा. आम्ही रीसेट कोड तयार करू.',
  reset_subtext: 'तुम्हाला पाठवलेला 6-अंकी कोड आणि नवीन पासवर्ड प्रविष्ट करा.',
  otp_placeholder: '6-अंकी OTP कोड',
  new_password: 'नवीन पासवर्ड',
  register_clinician: 'व्यावसायिक क्लिनिशियन म्हणून नोंदणी',
  select_role: 'तुमची भूमिका निवडा:',
  login_failed: 'लॉगिन अयशस्वी. पुन्हा प्रयत्न करा.',
  signup_failed: 'साइन अप अयशस्वी. पुन्हा प्रयत्न करा.',
  send_code_failed: 'रीसेट कोड पाठवण्यात अयशस्वी.',
  reset_failed: 'पासवर्ड रीसेट अयशस्वी. OTP तपासा.',
  reset_success: 'पासवर्ड यशस्वीरित्या रीसेट. आता नवीन पासवर्डने लॉगिन करा.',
  roles: {
    psychologist: 'मनोवैज्ञानिक',
    psychiatrist: 'मनोचिकित्सक',
    counsellor: 'समुपदेशक',
    social_worker: 'सामाजिक कार्यकर्ता',
  },
  validation: {
    email_required: 'ईमेल आवश्यक आहे',
    email_invalid: 'वैध ईमेल पत्ता प्रविष्ट करा',
    email_must_contain_at: 'ईमेलमध्ये @ असणे आवश्यक',
    phone_required: 'फोन नंबर आवश्यक',
    phone_invalid: 'फोन नंबर नेमके 10 अंकी असावा',
    password_required: 'पासवर्ड आवश्यक',
    password_min_length: 'पासवर्ड किमान 8 अक्षरे असावे',
    password_lowercase: 'पासवर्डमध्ये लहान अक्षर असावे',
    password_uppercase: 'पासवर्डमध्ये मोठे अक्षर असावे',
    password_number: 'पासवर्डमध्ये संख्या असावी',
    password_symbol: 'पासवर्डमध्ये चिन्ह असावे (उदा. !@#$%)',
    full_name_required: 'पूर्ण नाव आवश्यक',
    age_invalid: 'वैध वय प्रविष्ट करा (1–150)',
    gender_required: 'लिंग निवडा',
    passwords_mismatch: 'पासवर्ड जुळत नाहीत',
    otp_invalid: 'वैध 6-अंकी OTP कोड प्रविष्ट करा.',
  },
};

const CRISIS_EN = {
  title: 'Crisis & support',
  subtitle: 'You matter. Reach out anytime.',
  talk_trusted_title: 'Talk to someone you trust',
  talk_trusted_text: 'A friend, family member, or counselor can help. You don\'t have to go through this alone.',
  vandrevala: 'Vandrevala Foundation',
  vandrevala_note: '24/7 mental health support (India)',
  icall: 'iCall',
  icall_note: 'Mon–Sat, 10am–10pm (India)',
  kiran: 'Kiran',
  kiran_note: '24/7 (India)',
  samaritans: 'Samaritans',
  samaritans_note: '24/7 (UK)',
  crisis_text_line: 'Crisis Text Line',
  crisis_text_line_note: '24/7 (US)',
  iasp: 'International Association for Suicide Prevention',
  iasp_note: 'findahelpline.com',
};

const CRISIS_HI = {
  title: 'संकट और सहायता',
  subtitle: 'आप महत्वपूर्ण हैं। कभी भी संपर्क करें।',
  talk_trusted_title: 'किसी भरोसेमंद व्यक्ति से बात करें',
  talk_trusted_text: 'कोई मित्र, परिवार का सदस्य या परामर्शदाता मदद कर सकता है। आपको अकेले इससे गुज़रना नहीं है।',
  vandrevala: 'वंद्रेवाला फाउंडेशन',
  vandrevala_note: '24/7 मानसिक स्वास्थ्य सहायता (भारत)',
  icall: 'iCall',
  icall_note: 'सोम–शनि, सुबह 10–रात 10 (भारत)',
  kiran: 'Kiran',
  kiran_note: '24/7 (भारत)',
  samaritans: 'Samaritans',
  samaritans_note: '24/7 (UK)',
  crisis_text_line: 'Crisis Text Line',
  crisis_text_line_note: '24/7 (US)',
  iasp: 'International Association for Suicide Prevention',
  iasp_note: 'findahelpline.com',
};

const CONCERNS_EN = {
  anger: 'Anger',
  anxiety: 'Anxiety and Panic Attacks',
  depression: 'Depression',
  eating_disorders: 'Eating disorders',
  self_esteem: 'Self-esteem',
  self_harm: 'Self-harm',
  stress: 'Stress',
  sleep_disorders: 'Sleep disorders',
};

const CONCERNS_HI = {
  anger: 'क्रोध',
  anxiety: 'चिंता और पैनिक अटैक',
  depression: 'अवसाद',
  eating_disorders: 'खाने के विकार',
  self_esteem: 'आत्म-सम्मान',
  self_harm: 'आत्म-हानि',
  stress: 'तनाव',
  sleep_disorders: 'नींद संबंधी विकार',
};

const JOURNAL_EN = {
  greeting: 'Hi there!',
  loading: 'Loading your journal entries...',
  empty_title: 'No entries yet',
  empty_text: 'Tap + to write your first journal entry.',
};

const HOME_EXTRAS_EN = {
  welcome_login: '✓ Login successful! Welcome back.',
  welcome_signup: '✓ Account created successfully! Welcome to MindCare.',
  severity_1: 'A bit',
  severity_2: 'Somewhat',
  severity_3: 'Moderate',
  severity_4: 'Quite a bit',
  severity_5: 'Very much',
  mood_calm: 'calm',
  mood_anxious: 'anxious',
  mood_sad: 'sad',
  mood_angry: 'angry',
  mood_tired: 'tired',
  mood_hopeful: 'hopeful',
  mood_overwhelmed: 'overwhelmed',
  mood_okay: 'okay',
  category_academic_stress: 'Academic Stress',
  category_anxiety: 'Anxiety',
  category_relationship: 'Relationship',
  category_family: 'Family',
  category_finances: 'Finances',
  category_health: 'Health',
  category_loneliness: 'Loneliness',
  category_grief: 'Grief',
  category_self_esteem: 'Self Esteem',
  category_sleep: 'Sleep',
  category_work_life_balance: 'Work Life Balance',
  category_other: 'Other',
  self_help_breathing: 'Breathing',
  self_help_affirmations: 'Affirmations',
  self_help_crisis: 'Crisis support',
  self_help_gratitude: 'Gratitude',
  self_help_grounding: 'Grounding',
  content_recommended: '⭐ Recommended',
  content_meditation: 'Meditation',
  content_motivation: 'Motivation',
  content_sleep: 'Sleep Stories',
  content_relaxing_music: 'Relaxing Music',
  content_therapy: 'Therapy Advice',
};

const PROFILE_EXTRAS_EN = {
  access_code_required: 'Please enter an access code.',
  join_success: 'You have joined {name}!',
  join_failed: 'Failed to join institution.',
  delete_reason_required: 'Please let us know why you are leaving.',
  delete_submitted: 'Your account deletion request is now pending admin review for data purge.',
  delete_failed: 'Failed to submit request.',
  logout_confirm: 'Are you sure you want to log out?',
  required_title: 'Required',
  success_title: 'Success',
  request_submitted_title: 'Request Submitted',
  join_org_title: 'Join Organization',
  join_org_desc: 'Enter the access code provided by your school or workplace to join their private wellness community.',
  access_code_placeholder: 'e.g. COLLEGE2026',
  join_button: 'Join',
  delete_account_title: 'Request Account Deletion',
  delete_account_desc: 'Your request will be reviewed. Once approved, all your personal data including risk reports, mood entries, and wellness plans will be permanently purged from our servers.',
  delete_reason_placeholder: 'Why are you leaving? (Required)',
  years_old: 'yrs. old',
  my_concerns_title: 'My Concerns:',
};

const COMMON_EXTRAS_EN = { today: 'Today' };

const CRISIS_PA = {
  title: 'ਸੰਕਟ ਅਤੇ ਸਹਾਇਤਾ',
  subtitle: 'ਤੁਸੀਂ ਮਹੱਤਵਪੂਰਨ ਹੋ। ਕਿਸੇ ਵੀ ਸਮੇਂ ਸੰਪਰਕ ਕਰੋ।',
  talk_trusted_title: 'ਕਿਸੇ ਭਰੋਸੇਮੰਦ ਨਾਲ ਗੱਲ ਕਰੋ',
  talk_trusted_text: 'ਕੋਈ ਦੋਸਤ, ਪਰਿਵਾਰਕ ਮੈਂਬਰ ਜਾਂ ਸਲਾਹਕਾਰ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ। ਤੁਹਾਨੂੰ ਇਕੱਲੇ ਇਸ ਤੋਂ ਨਹੀਂ ਗੁਜ਼ਰਨਾ।',
  vandrevala: 'Vandrevala Foundation',
  vandrevala_note: '24/7 ਮਾਨਸਿਕ ਸਿਹਤ ਸਹਾਇਤਾ (ਭਾਰਤ)',
  icall: 'iCall',
  icall_note: 'ਸੋਮ–ਸ਼ਨਿ, ਸਵੇਰ 10–ਰਾਤ 10 (ਭਾਰਤ)',
  kiran: 'Kiran',
  kiran_note: '24/7 (ਭਾਰਤ)',
  samaritans: 'Samaritans',
  samaritans_note: '24/7 (UK)',
  crisis_text_line: 'Crisis Text Line',
  crisis_text_line_note: '24/7 (US)',
  iasp: 'International Association for Suicide Prevention',
  iasp_note: 'findahelpline.com',
};

const CRISIS_MR = {
  title: 'संकट आणि मदत',
  subtitle: 'तुम्ही महत्त्वाचे आहात. कधीही संपर्क साधा.',
  talk_trusted_title: 'विश्वासू व्यक्तीशी बोला',
  talk_trusted_text: 'मित्र, कुटुंबातील सदस्य किंवा समुपदेशक मदत करू शकतो. तुम्हाला एकटे हे सामोरे जाण्याची गरज नाही.',
  vandrevala: 'Vandrevala Foundation',
  vandrevala_note: '24/7 मानसिक आरोग्य मदत (भारत)',
  icall: 'iCall',
  icall_note: 'सोम–शनि, सकाळी 10–रात्री 10 (भारत)',
  kiran: 'Kiran',
  kiran_note: '24/7 (भारत)',
  samaritans: 'Samaritans',
  samaritans_note: '24/7 (UK)',
  crisis_text_line: 'Crisis Text Line',
  crisis_text_line_note: '24/7 (US)',
  iasp: 'International Association for Suicide Prevention',
  iasp_note: 'findahelpline.com',
};

const CONCERNS_PA = {
  anger: 'ਗussa',
  anxiety: 'ਚਿੰਤਾ ਅਤੇ ਪੈਨਿਕ ਅਟੈਕ',
  depression: 'ਡਿਪਰੈਸ਼ਨ',
  eating_disorders: 'ਖਾਣ-ਪੀਣ ਦੇ vikár',
  self_esteem: 'ਸਵੈ-ਸਨਮਾਨ',
  self_harm: 'ਸਵੈ-नुकਸਾਨ',
  stress: 'ਤਣਾਅ',
  sleep_disorders: 'ਨੀਂਦ vikár',
};

const CONCERNS_MR = {
  anger: 'राग',
  anxiety: 'चिंता आणि पॅनिक अटॅक',
  depression: 'नैराश्य',
  eating_disorders: 'खाण्याचे vikár',
  self_esteem: 'आत्म-अbhiman',
  self_harm: 'आत्म-हानi',
  stress: 'तणाव',
  sleep_disorders: 'झोप vikár',
};

const JOURNAL_HI = {
  greeting: 'नमस्ते!',
  loading: 'आपकी जर्नल प्रविष्टियाँ लोड हो रही हैं...',
  empty_title: 'अभी कोई प्रविष्टि नहीं',
  empty_text: '+ दबाकर अपनी पहली जर्नल प्रविष्टि लिखें।',
};

const JOURNAL_PA = {
  greeting: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ!',
  loading: 'ਤੁਹਾਡੀਆਂ ਜਰਨਲ ਐਂਟਰੀਆਂ ਲੋਡ ਹੋ ਰਹੀਆਂ ਹਨ...',
  empty_title: 'ਹੁਣ ਤੱਕ ਕੋਈ ਐਂਟਰੀ ਨਹੀਂ',
  empty_text: '+ ਦਬਾ ਕੇ ਆਪਣੀ ਪਹਿਲੀ ਜਰਨਲ ਐਂਟਰੀ ਲਿਖੋ।',
};

const JOURNAL_MR = {
  greeting: 'नमस्कार!',
  loading: 'तुमच्या जर्नल नोंदी लोड होत आहेत...',
  empty_title: 'अद्याप नोंदी नाहीत',
  empty_text: '+ दाबून तुमची पहिली जर्नल नोंद लिहा.',
};

const HOME_EXTRAS_HI = {
  welcome_login: '✓ लॉगिन सफल! वापस स्वागत है।',
  welcome_signup: '✓ खाता बन गया! MindCare में स्वागत है।',
  severity_1: 'थोड़ा',
  severity_2: 'कुछ हद तक',
  severity_3: 'मध्यम',
  severity_4: 'काफी',
  severity_5: 'बहुत',
  mood_calm: 'शांत',
  mood_anxious: 'चिंतित',
  mood_sad: 'उदास',
  mood_angry: 'गुस्सा',
  mood_tired: 'थका हुआ',
  mood_hopeful: 'आशावादी',
  mood_overwhelmed: 'अभिभूत',
  mood_okay: 'ठीक',
  category_academic_stress: 'शैक्षणिक तनाव',
  category_anxiety: 'चिंता',
  category_relationship: 'रिश्ते',
  category_family: 'परिवार',
  category_finances: 'वित्त',
  category_health: 'स्वास्थ्य',
  category_loneliness: 'अकेलापन',
  category_grief: 'शोक',
  category_self_esteem: 'आत्म-सम्मान',
  category_sleep: 'नींद',
  category_work_life_balance: 'काम-जीवन संतुलन',
  category_other: 'अन्य',
  self_help_breathing: 'श्वास',
  self_help_affirmations: 'पुष्टि',
  self_help_crisis: 'संकट सहायता',
  self_help_gratitude: 'कृतज्ञता',
  self_help_grounding: 'ग्राउंडिंग',
  content_recommended: '⭐ अनुशंसित',
  content_meditation: 'ध्यान',
  content_motivation: 'प्रेरणा',
  content_sleep: 'नींद की कहानियाँ',
  content_relaxing_music: 'आरामदायक संगीत',
  content_therapy: 'थेरेपी सलाह',
};

const PROFILE_EXTRAS_HI = {
  access_code_required: 'कृपया एक्सेस कोड दर्ज करें।',
  join_success: 'आप {name} में शामिल हो गए!',
  join_failed: 'संस्था में शामिल होने में विफल।',
  delete_reason_required: 'कृपया बताएं कि आप क्यों जा रहे हैं।',
  delete_submitted: 'आपका खाता हटाने का अनुरोध अब एडमिन समीक्षा के लिए लंबित है।',
  delete_failed: 'अनुरोध जमा करने में विफल।',
  logout_confirm: 'क्या आप वाकई लॉग आउट करना चाहते हैं?',
  required_title: 'आवश्यक',
  success_title: 'सफल',
  request_submitted_title: 'अनुरोध जमा',
  join_org_title: 'संगठन में शामिल हों',
  join_org_desc: 'अपने स्कूल या कार्यस्थल द्वारा दिया गया एक्सेस कोड दर्ज करें।',
  access_code_placeholder: 'जैसे COLLEGE2026',
  join_button: 'शामिल हों',
  delete_account_title: 'खाता हटाने का अनुरोध',
  delete_account_desc: 'आपका अनुरोध समीक्षा किया जाएगा। स्वीकृत होने पर, सभी व्यक्तिगत डेटा स्थायी रूप से हटा दिया जाएगा।',
  delete_reason_placeholder: 'आप क्यों जा रहे हैं? (आवश्यक)',
  years_old: 'वर्ष',
  my_concerns_title: 'मेरी चिंताएं:',
};

const COMMON_EXTRAS_HI = { today: 'आज' };

/** Fallback: use English for langs without dedicated blocks */
function fallbackAuth(lang) {
  if (lang === 'hi') return AUTH_HI;
  if (lang === 'pa') return AUTH_PA;
  if (lang === 'mr') return AUTH_MR;
  return AUTH_EN;
}

function fallbackCrisis(lang) {
  if (lang === 'hi') return CRISIS_HI;
  if (lang === 'pa') return CRISIS_PA;
  if (lang === 'mr') return CRISIS_MR;
  return CRISIS_EN;
}

function fallbackConcerns(lang) {
  if (lang === 'hi') return CONCERNS_HI;
  if (lang === 'pa') return CONCERNS_PA;
  if (lang === 'mr') return CONCERNS_MR;
  return CONCERNS_EN;
}

function fallbackJournal(lang) {
  if (lang === 'hi') return JOURNAL_HI;
  if (lang === 'pa') return JOURNAL_PA;
  if (lang === 'mr') return JOURNAL_MR;
  return JOURNAL_EN;
}

function fallbackHomeExtras(lang) {
  if (lang === 'hi') return HOME_EXTRAS_HI;
  return HOME_EXTRAS_EN;
}

function fallbackProfileExtras(lang) {
  if (lang === 'hi') return PROFILE_EXTRAS_HI;
  return PROFILE_EXTRAS_EN;
}

function fallbackCommonExtras(lang) {
  if (lang === 'hi') return COMMON_EXTRAS_HI;
  return COMMON_EXTRAS_EN;
}

const LANGS = ['en', 'hi', 'pa', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'es', 'fr', 'de', 'pt', 'ar', 'zh'];

export const AUTH_BLOCKS = Object.fromEntries(LANGS.map(l => [l, fallbackAuth(l)]));
export const CRISIS_BLOCKS = Object.fromEntries(LANGS.map(l => [l, fallbackCrisis(l)]));
export const CONCERNS_BLOCKS = Object.fromEntries(LANGS.map(l => [l, fallbackConcerns(l)]));
export const JOURNAL_BLOCKS = Object.fromEntries(LANGS.map(l => [l, fallbackJournal(l)]));
export const HOME_EXTRAS = Object.fromEntries(LANGS.map(l => [l, fallbackHomeExtras(l)]));
export const PROFILE_EXTRAS = Object.fromEntries(LANGS.map(l => [l, fallbackProfileExtras(l)]));
export const COMMON_EXTRAS = Object.fromEntries(LANGS.map(l => [l, fallbackCommonExtras(l)]));

export { LANGS };
