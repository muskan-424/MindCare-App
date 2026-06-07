import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../domains/identity/screens/Login';
import SignupScreen from '../domains/identity/screens/Signup';
import ForgotPasswordScreen from '../domains/identity/screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../domains/identity/screens/ResetPasswordScreen';

const Stack = createStackNavigator();

const LoginStackNavigation = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name='SignUp' component={SignupScreen} />
      <Stack.Screen name='Login' component={LoginScreen} />
      <Stack.Screen name='ForgotPassword' component={ForgotPasswordScreen} />
      <Stack.Screen name='ResetPassword' component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

export default LoginStackNavigation;
