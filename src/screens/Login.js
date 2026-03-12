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
import { colors } from '../constants/theme';
import { connect } from 'react-redux';
import { login } from '../redux/actions/auth';
import { validateEmail, validatePassword } from '../utils/validation';

const Login = props => {
  const [state, setState] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');

    const emailCheck = validateEmail(state.email);
    if (!emailCheck.valid) {
      setError(emailCheck.message);
      return;
    }

    const passwordCheck = validatePassword(state.password);
    if (!passwordCheck.valid) {
      setError(passwordCheck.message);
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
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        contentContainerStyle={styles.scrollContent}
        style={{ flex: 1, backgroundColor: colors.white }}
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
            <Text style={styles.headerText}>Login</Text>
            <TextInput
              style={styles.textInput}
              placeholder={'Email'}
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
              style={styles.textInput}
              placeholder={'Password'}
              placeholderTextColor={colors.gray}
              value={state.password}
              onChangeText={text => {
                setState({ ...state, password: text });
                if (error) setError('');
              }}
              secureTextEntry={true}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  }
});
