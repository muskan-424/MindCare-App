import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../../constants/theme';
import { validatePassword } from '../../../utils/validation';
import api from '../../../utils/apiClient';
import useTranslation from '../../../utils/i18n';

const ResetPasswordScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { email } = route.params || {};
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    setError('');
    setPasswordError('');

    if (!otp || otp.length < 6) {
      setError(t('auth.validation.otp_invalid'));
      return;
    }

    const passwordCheck = validatePassword(newPassword, t);
    if (!passwordCheck.valid) {
      setPasswordError(passwordCheck.message);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/reset-password', {
        email,
        otp,
        newPassword,
      });

      if (response.data.success) {
        Alert.alert(t('profile.success_title'), t('auth.reset_success'), [
          { text: t('common.ok'), onPress: () => navigation.navigate('Login') },
        ]);
      }
    } catch (err) {
      setError(err.response?.data?.error || t('auth.reset_failed'));
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
                height: Dimensions.get('screen').width * 0.8,
              }}
            />
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.headerText}>{t('auth.reset_password_title')}</Text>
            <Text style={styles.subtext}>{t('auth.reset_subtext')}</Text>

            <TextInput
              style={[styles.textInput, error && styles.inputError]}
              placeholder={t('auth.otp_placeholder')}
              placeholderTextColor={colors.gray}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />

            <View style={styles.passwordRow}>
              <TextInput
                style={[
                  styles.textInput,
                  styles.passwordInput,
                  (passwordError || error) && styles.inputError,
                ]}
                placeholder={t('auth.new_password')}
                placeholderTextColor={colors.gray}
                value={newPassword}
                onChangeText={text => {
                  setNewPassword(text);
                  const check = validatePassword(text, t);
                  setPasswordError(check.valid ? '' : check.message);
                  if (check.valid) setError('');
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
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            {error && !passwordError ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity onPress={handleResetPassword} disabled={loading} style={{ marginTop: 20 }}>
              <View style={[styles.submitButton, loading && styles.submitButtonDisabled]}>
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.submitText}>{t('auth.reset_password_title')}</Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.backButton}>{t('auth.back_to_login')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 100,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  flexOne: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.white,
  },
  contentContainer: {
    backgroundColor: colors.white,
    flex: 1,
    position: 'relative',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    top: -20,
    paddingTop: 10,
  },
  textInput: {
    backgroundColor: colors.accent,
    marginHorizontal: 20,
    marginVertical: 10,
    height: 50,
    borderRadius: 30,
    elevation: 1,
    paddingHorizontal: 20,
    color: colors.black,
  },
  passwordRow: {
    position: 'relative',
    marginHorizontal: 0,
  },
  passwordInput: {
    marginHorizontal: 20,
  },
  eyeButton: {
    position: 'absolute',
    right: 35,
    top: 22,
    height: 24,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.redPink,
  },
  submitButton: {
    alignSelf: 'center',
    width: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.yellow,
    height: 50,
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
    fontSize: 28,
    textTransform: 'uppercase',
    paddingTop: 10,
    paddingBottom: 5,
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  subtext: {
    textAlign: 'center',
    paddingHorizontal: 25,
    marginBottom: 15,
    color: colors.gray,
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
  backButton: {
    alignSelf: 'center',
    marginTop: 20,
    paddingBottom: 20,
    color: colors.secondary,
    fontWeight: 'bold',
  },
});
