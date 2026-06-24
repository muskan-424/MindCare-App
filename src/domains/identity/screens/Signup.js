import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../../constants/theme';
import { RadioButton } from 'react-native-paper';
import { register } from '../../../redux/actions/auth';
import { validateEmail, validatePhone, validatePassword } from '../../../utils/validation';
import { connect } from 'react-redux';
import useTranslation from '../../../utils/i18n';
import LanguagePicker from '../../../components/LanguagePicker';

const ROLE_KEYS = {
  Psychologist: 'auth.roles.psychologist',
  Psychiatrist: 'auth.roles.psychiatrist',
  Counsellor: 'auth.roles.counsellor',
  'Social Worker': 'auth.roles.social_worker',
};

const Signup = props => {
  const { t } = useTranslation();
  const [state, setState] = useState({
    fullName: '',
    email: '',
    age: null,
    phone_no: '',
    gender: '',
    password: '',
    password2: '',
    isClinician: false,
    specialisation: 'Psychologist',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError('');

    if (!state.fullName || !state.fullName.trim()) {
      setError(t('auth.validation.full_name_required'));
      return;
    }

    const emailCheck = validateEmail(state.email, t);
    if (!emailCheck.valid) {
      setError(emailCheck.message);
      return;
    }

    const phoneCheck = validatePhone(state.phone_no, t);
    if (!phoneCheck.valid) {
      setError(phoneCheck.message);
      return;
    }

    const ageNum = parseInt(state.age, 10);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum >= 150) {
      setError(t('auth.validation.age_invalid'));
      return;
    }

    if (!state.gender) {
      setError(t('auth.validation.gender_required'));
      return;
    }

    const passwordCheck = validatePassword(state.password, t);
    if (!passwordCheck.valid) {
      setError(passwordCheck.message);
      return;
    }

    if (state.password !== state.password2) {
      setError(t('auth.validation.passwords_mismatch'));
      return;
    }

    setLoading(true);
    try {
      await props.register({
        name: state.fullName.trim(),
        email: state.email.trim(),
        password: state.password,
        age: String(ageNum),
        gender: state.gender,
        phone_no: state.phone_no.replace(/\D/g, ''),
        role: state.isClinician ? 'clinician' : 'user',
        specialisation: state.isClinician ? state.specialisation : '',
      });
    } catch (err) {
      setError(err.message || t('auth.signup_failed'));
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flexOne}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
      >
        <View style={styles.container}>
          <View>
            <Image
              source={require('../../../assets/yoga_main.jpg')}
              style={{
                width: Dimensions.get('screen').width,
                height: 160,
              }}
            />
          </View>
          <View style={styles.signUpContainer}>
            <LanguagePicker compact />
            <Text style={styles.headerText}>{t('auth.signup_title')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('auth.full_name')}
              value={state.fullName}
              onChangeText={text => setState({ ...state, fullName: text })}
            />
            <TextInput
              style={[styles.textInput, error && styles.inputError]}
              placeholder={t('auth.email')}
              placeholderTextColor={colors.gray}
              value={state.email}
              onChangeText={text => {
                setState({ ...state, email: text });
                if (error) setError('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={[styles.textInput, error && styles.inputError]}
              placeholder={t('auth.phone')}
              placeholderTextColor={colors.gray}
              keyboardType="phone-pad"
              maxLength={10}
              value={state.phone_no}
              onChangeText={text => {
                setState({ ...state, phone_no: text.replace(/\D/g, '') });
                if (error) setError('');
              }}
            />
            <TextInput
              style={[styles.textInput, error && styles.inputError]}
              placeholder={t('auth.age')}
              keyboardType="numeric"
              value={state.age}
              onChangeText={text => setState({ ...state, age: text })}
            />
            <View style={styles.radioButton}>
              <View style={styles.radio}>
                <Text style={{ color: colors.secondary }}>{t('auth.male')}</Text>
                <RadioButton
                  value="male"
                  color={colors.secondary}
                  status={state.gender === 'male' ? 'checked' : 'unchecked'}
                  onPress={() => setState({ ...state, gender: 'male' })}
                />
              </View>
              <View style={styles.radio}>
                <Text style={{ color: colors.secondary }}>{t('auth.female')}</Text>
                <RadioButton
                  value="female"
                  color={colors.secondary}
                  status={state.gender === 'female' ? 'checked' : 'unchecked'}
                  onPress={() => setState({ ...state, gender: 'female' })}
                />
              </View>
              <View style={styles.radio}>
                <Text style={{ color: colors.secondary }}>{t('auth.other')}</Text>
                <RadioButton
                  color={colors.secondary}
                  value="other"
                  status={state.gender === 'other' ? 'checked' : 'unchecked'}
                  onPress={() => setState({ ...state, gender: 'other' })}
                />
              </View>
            </View>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.textInput, styles.passwordInput, error && styles.inputError]}
                placeholder={t('auth.password')}
                placeholderTextColor={colors.gray}
                value={state.password}
                onChangeText={text => {
                  setState({ ...state, password: text });
                  if (error) setError('');
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(prev => !prev)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.gray}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.textInput, styles.passwordInput, error && styles.inputError]}
                placeholder={t('auth.confirm_password')}
                placeholderTextColor={colors.gray}
                value={state.password2}
                onChangeText={text => {
                  setState({ ...state, password2: text });
                  if (error) setError('');
                }}
                secureTextEntry={!showPassword2}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword2(prev => !prev)}
              >
                <Ionicons
                  name={showPassword2 ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.gray}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.clinicianToggleContainer}>
              <Text style={styles.clinicianToggleText}>{t('auth.register_clinician')}</Text>
              <Switch
                value={state.isClinician}
                onValueChange={val => setState({ ...state, isClinician: val })}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={state.isClinician ? colors.white : '#f4f3f4'}
              />
            </View>
            {state.isClinician && (
              <View style={styles.specialisationContainer}>
                <Text style={styles.specialisationTitle}>{t('auth.select_role')}</Text>
                {Object.keys(ROLE_KEYS).map(role => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.specChip,
                      state.specialisation === role && styles.specChipActive,
                    ]}
                    onPress={() => setState({ ...state, specialisation: role })}
                  >
                    <Text
                      style={[
                        styles.specChipText,
                        state.specialisation === role && styles.specChipTextActive,
                      ]}
                    >
                      {t(ROLE_KEYS[role])}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity onPress={handleSignUp} disabled={loading}>
              <View style={[styles.submitButton, loading && styles.submitButtonDisabled]}>
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.submitText}>{t('auth.signup_button')}</Text>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => props.navigation.navigate('Login')}>
              <Text style={styles.already}>{t('auth.has_account')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default connect(null, { register })(Signup);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 100,
    backgroundColor: colors.white,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpContainer: {
    backgroundColor: colors.white,
    flex: 2,
    display: 'flex',
    position: 'relative',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    top: -20,
    zIndex: 200,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  flexOne: {
    flex: 1,
  },
  scroll: {
    backgroundColor: colors.white,
  },
  textInput: {
    backgroundColor: colors.accent,
    margin: 10,
    height: 40,
    borderRadius: 30,
    elevation: 1,
    padding: 10,
    color: colors.black,
  },
  passwordRow: {
    position: 'relative',
    marginHorizontal: 10,
  },
  passwordInput: {
    marginHorizontal: 0,
  },
  eyeButton: {
    position: 'absolute',
    right: 18,
    top: 10,
    height: 24,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.redPink,
  },
  radioButton: {
    flexDirection: 'row',
    paddingLeft: 20,
    width: '100%',
  },
  radio: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButton: {
    alignSelf: 'center',
    width: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.yellow,
    height: 40,
    borderRadius: 60,
  },
  submitText: {
    color: colors.white,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 2,
  },
  headerText: {
    color: colors.secondary,
    fontSize: 40,
    textTransform: 'uppercase',
    padding: 10,
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  errorText: {
    color: colors.redPink || '#c62828',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  already: {
    alignSelf: 'flex-end',
    paddingRight: 20,
    paddingBottom: 10,
    color: colors.secondary,
  },
  clinicianToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 10,
    backgroundColor: '#F8F9FA',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  clinicianToggleText: {
    color: colors.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  specialisationContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialisationTitle: {
    width: '100%',
    color: colors.secondary,
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 14,
  },
  specChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray,
    backgroundColor: '#f5f5f5',
  },
  specChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  specChipText: {
    fontSize: 12,
    color: colors.gray,
  },
  specChipTextActive: {
    color: colors.white,
    fontWeight: 'bold',
  },
});
