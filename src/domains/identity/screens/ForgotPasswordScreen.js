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
import { colors } from '../../../constants/theme';
import { validateEmail } from '../../../utils/validation';
import api from '../../../utils/apiClient';
import useTranslation from '../../../utils/i18n';

const ForgotPasswordScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    setError('');
    setEmailError('');

    const emailCheck = validateEmail(email, t);
    if (!emailCheck.valid) {
      setEmailError(emailCheck.message);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/forgot-password', { email: email.trim() });
      if (response.data.success) {
        Alert.alert(
          t('profile.success_title'),
          response.data.message || t('auth.send_code'),
        );
        navigation.navigate('ResetPassword', { email: email.trim() });
      }
    } catch (err) {
      setError(err.response?.data?.error || t('auth.send_code_failed'));
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
            <Text style={styles.headerText}>{t('auth.forgot_password_title')}</Text>
            <Text style={styles.subtext}>{t('auth.forgot_subtext')}</Text>

            <TextInput
              style={[styles.textInput, (emailError || error) && styles.inputError]}
              placeholder={t('auth.email')}
              placeholderTextColor={colors.gray}
              value={email}
              onChangeText={text => {
                setEmail(text);
                const check = validateEmail(text, t);
                setEmailError(check.valid ? '' : check.message);
                if (check.valid) setError('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            {error && !emailError ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity onPress={handleSendCode} disabled={loading} style={{ marginTop: 20 }}>
              <View style={[styles.submitButton, loading && styles.submitButtonDisabled]}>
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.submitText}>{t('auth.send_code')}</Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>{t('auth.back_to_login')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;

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
