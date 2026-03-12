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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../constants/theme';
import { RadioButton } from 'react-native-paper';
import { register } from '../redux/actions/auth';
import { validateEmail, validatePhone, validatePassword } from '../utils/validation';
import { connect } from 'react-redux';

const Signup = props => {
  const [state, setState] = useState({
    fullName: '',
    email: '',
    age: null,
    phone_no: '',
    gender: '',
    password: '',
    password2: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError('');

    if (!state.fullName || !state.fullName.trim()) {
      setError('Full name is required');
      return;
    }

    const emailCheck = validateEmail(state.email);
    if (!emailCheck.valid) {
      setError(emailCheck.message);
      return;
    }

    const phoneCheck = validatePhone(state.phone_no);
    if (!phoneCheck.valid) {
      setError(phoneCheck.message);
      return;
    }

    const ageNum = parseInt(state.age, 10);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum >= 150) {
      setError('Please enter a valid age (1–150)');
      return;
    }

    if (!state.gender) {
      setError('Please select gender');
      return;
    }

    const passwordCheck = validatePassword(state.password);
    if (!passwordCheck.valid) {
      setError(passwordCheck.message);
      return;
    }

    if (state.password !== state.password2) {
      setError('Passwords do not match');
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
      });
      // Success: auth state updates and user is navigated; confirmation shows on Home
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
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
        style={{ backgroundColor: colors.white }}
      >
        <View style={styles.container}>
          <View>
            <Image
              source={require('../assets/yoga_main.jpg')}
              style={{
                width: Dimensions.get('screen').width,
                height: 160
              }}
            />
          </View>
          <View style={styles.signUpContainer}>
            <Text style={styles.headerText}>Signup</Text>
            <TextInput
              style={styles.textInput}
              placeholder={'Full Name'}
              value={state.fullName}
              onChangeText={text =>
                setState({
                  ...state,
                  fullName: text
                })
              }
            />
            <TextInput
              style={[styles.textInput, error && styles.inputError]}
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
              style={[styles.textInput, error && styles.inputError]}
              placeholder={'Phone Number'}
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
              placeholder={'Age'}
              keyboardType="numeric"
              value={state.age}
              onChangeText={text => {
                setState({
                  ...state,
                  age: text
                });
              }}
            />
            <View style={styles.radioButton}>
              <View style={styles.radio}>
                <Text style={{ color: colors.secondary }}>Male</Text>
                <RadioButton
                  value="male"
                  color={colors.secondary}
                  status={state.gender === 'male' ? 'checked' : 'unchecked'}
                  onPress={() => {
                    setState({
                      ...state,
                      gender: 'male'
                    });
                  }}
                />
              </View>
              <View style={styles.radio}>
                <Text style={{ color: colors.secondary }}>Female</Text>
                <RadioButton
                  value="female"
                  color={colors.secondary}
                  status={state.gender === 'female' ? 'checked' : 'unchecked'}
                  onPress={() => {
                    setState({
                      ...state,
                      gender: 'female'
                    });
                  }}
                />
              </View>
              <View style={styles.radio}>
                <Text style={{ color: colors.secondary }}>Other</Text>
                <RadioButton
                  color={colors.secondary}
                  value="other"
                  status={state.gender === 'other' ? 'checked' : 'unchecked'}
                  onPress={() => {
                    setState({
                      ...state,
                      gender: 'other'
                    });
                  }}
                />
              </View>
            </View>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.textInput, styles.passwordInput, error && styles.inputError]}
                placeholder={'Password'}
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
                placeholder={'Confirm Password'}
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
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity onPress={handleSignUp} disabled={loading}>
              <View style={[styles.submitButton, loading && styles.submitButtonDisabled]}>
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.submitText}>Signup</Text>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => props.navigation.navigate('Login')}>
              <Text style={styles.already}>Already have an account?</Text>
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
    justifyContent: 'center'
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
    width: '100%'
  },
  scrollContent: {
    flexGrow: 1
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
    paddingLeft: 20,
    width: '100%'
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
