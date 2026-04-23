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
  Switch,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../constants/theme';
import { connect } from 'react-redux';
import { login } from '../redux/actions/auth';
import { validateEmail, validatePassword } from '../utils/validation';

const Login = props => {
  const [state, setState] = useState({
    email: '',
    password: '',
    loginType: 'patient' // 'patient', 'professional', or 'admin'
  });
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setEmailError('');
    setPasswordError('');

    const emailCheck = validateEmail(state.email);
    if (!emailCheck.valid) {
      setEmailError(emailCheck.message);
    }

    const passwordCheck = validatePassword(state.password);
    if (!passwordCheck.valid) {
      setPasswordError(passwordCheck.message);
    }

    if (!emailCheck.valid || !passwordCheck.valid) {
      return;
    }

    setLoading(true);
    try {
      await props.login({ email: state.email.trim(), password: state.password });
      // Success: auth state updates and user is navigated to app; confirmation shows on Home
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
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
              source={require('../assets/yoga_main.jpg')}
              style={{
                width: Dimensions.get('screen').width,
                height: Dimensions.get('screen').width
              }}
            />
          </View>
          <View style={styles.signUpContainer}>
            <View style={styles.tabContainer}>
              <TouchableOpacity style={state.loginType === 'patient' ? styles.activeTab : styles.inactiveTab} onPress={() => setState({...state, loginType: 'patient'})}>
                <Text style={state.loginType === 'patient' ? styles.activeTabText : styles.inactiveTabText}>Patient</Text>
              </TouchableOpacity>
              <TouchableOpacity style={state.loginType === 'professional' ? styles.activeTab : styles.inactiveTab} onPress={() => setState({...state, loginType: 'professional'})}>
                <Text style={state.loginType === 'professional' ? styles.activeTabText : styles.inactiveTabText}>Professional</Text>
              </TouchableOpacity>
              <TouchableOpacity style={state.loginType === 'admin' ? styles.activeTab : styles.inactiveTab} onPress={() => setState({...state, loginType: 'admin'})}>
                <Text style={state.loginType === 'admin' ? styles.activeTabText : styles.inactiveTabText}>Admin</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.headerText}>
              {state.loginType === 'professional' ? 'Clinician Login' : state.loginType === 'admin' ? 'Admin Login' : 'Login'}
            </Text>
            <TextInput
              style={[styles.textInput, (emailError || error) && styles.inputError]}
              placeholder={'Email'}
              placeholderTextColor={colors.gray}
              value={state.email}
              onChangeText={text => {
                setState({ ...state, email: text });
                const check = validateEmail(text);
                setEmailError(check.valid ? '' : check.message);
                if (check.valid) setError('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.textInput, styles.passwordInput, (passwordError || error) && styles.inputError]}
                placeholder={'Password'}
                placeholderTextColor={colors.gray}
                value={state.password}
                onChangeText={text => {
                  setState({ ...state, password: text });
                  const check = validatePassword(text);
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
            {error && !emailError && !passwordError ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
            <TouchableOpacity onPress={handleLogin} disabled={loading}>
              <View style={[styles.submitButton, loading && styles.submitButtonDisabled]}>
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.submitText}>Login</Text>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => props.navigation.navigate('SignUp')}>
              <Text style={styles.already}>Don't have an account?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => props.navigation.navigate('ForgotPassword')}>
              <Text style={styles.already}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default connect(null, { login })(Login);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 100,
    backgroundColor: colors.white
  },
  scrollContent: {
    flexGrow: 1
  },
  flexOne: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.white,
  },
  signUpContainer: {
    backgroundColor: colors.white,
    flex: 1,
    position: 'relative',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    top: -10
  },
  textInput: {
    backgroundColor: colors.accent,
    margin: 10,
    height: 40,
    borderRadius: 30,
    elevation: 1,
    padding: 10,
    color: colors.black
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
    paddingLeft: 20
  },
  radio: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  submitButton: {
    alignSelf: 'center',
    width: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.yellow,
    height: 40,
    borderRadius: 60
  },
  submitText: {
    color: colors.white,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 2
  },
  headerText: {
    color: colors.secondary,
    fontSize: 40,
    textTransform: 'uppercase',
    padding: 10,
    alignSelf: 'center',
    fontWeight: 'bold'
  },
  errorText: {
    color: colors.redPink || '#c62828',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8
  },
  submitButtonDisabled: {
    opacity: 0.7
  },
  already: {
    alignSelf: 'flex-end',
    paddingRight: 20,
    paddingBottom: 10,
    color: colors.secondary
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 5,
    marginHorizontal: 30,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    padding: 3,
  },
  activeTab: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 8,
    borderRadius: 17,
    alignItems: 'center',
    elevation: 2,
  },
  inactiveTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  inactiveTabText: {
    color: colors.gray,
    fontWeight: '600',
  }
});
