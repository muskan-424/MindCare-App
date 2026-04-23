import React from 'react';
import { useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigation from './src/components/TabNavigation';
import LoginStackNavigation from './src/components/LoginStackNavigation';
import AdminStackNavigation from './src/components/AdminStackNavigation';
import TherapistStackNavigation from './src/components/TherapistStackNavigation';

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
