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
} from 'react-native';
import { connect } from 'react-redux';
import { colors } from '../../../constants/theme';
import { verifyLoginOtp, resendLoginOtp } from '../../../redux/actions/auth';
import useTranslation from '../../../utils/i18n';

const LoginOtpScreen = ({ route, navigation, verifyLoginOtp: verifyOtp, resendLoginOtp: resendOtp }) => {
  const { t } = useTranslation();
  const { email } = route.params || {};
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleVerify = async () => {
    setError('');
    if (!otp || otp.length < 6) {
      setError(t('auth.validation.otp_invalid'));
      return;
    }

    setLoading(true);
    try {
      await verifyOtp({ email, otp });
    } catch (err) {
      setError(err.message || t('auth.login_otp_failed'));
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      await resendOtp({ email });
      setResent(true);
    } catch (_) {
      setError(t('auth.login_otp_failed'));
    }
    setResending(false);
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
            <Text style={styles.headerText}>{t('auth.login_otp_title')}</Text>
            <Text style={styles.subtext}>{t('auth.login_otp_subtext', { email })}</Text>

            <TextInput
              style={[styles.textInput, error && styles.inputError]}
              placeholder={t('auth.otp_placeholder')}
              placeholderTextColor={colors.gray}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity onPress={handleVerify} disabled={loading} style={{ marginTop: 20 }}>
              <View style={[styles.submitButton, loading && styles.submitButtonDisabled]}>
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.submitText}>{t('auth.login_otp_verify')}</Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={styles.backButton}>
                {resent ? t('auth.login_otp_resent') : t('auth.login_otp_resend')}
              </Text>
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

export default connect(null, { verifyLoginOtp, resendLoginOtp })(LoginOtpScreen);

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
    paddingBottom: 10,
    color: colors.secondary,
    fontWeight: 'bold',
  },
});
