import React from 'react';
import { useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigation from './src/navigation/TabNavigation';
import LoginStackNavigation from './src/navigation/LoginStackNavigation';
import AdminStackNavigation from './src/navigation/AdminStackNavigation';
import TherapistStackNavigation from './src/navigation/TherapistStackNavigation';

const AuthFlow = () => {
  const auth = useSelector(state => state.auth);
  const role = auth.isLogin && auth.user ? auth.user.role : null;

  return (
    <NavigationContainer>
      {!auth.isLogin ? (
        <LoginStackNavigation />
      ) : role === 'admin' ? (
        <AdminStackNavigation />
      ) : role === 'clinician' || role === 'therapist' ? (
        <TherapistStackNavigation />
      ) : (
        <TabNavigation />
      )}
    </NavigationContainer>
  );
};

export default AuthFlow;
