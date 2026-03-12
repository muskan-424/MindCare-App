import React from 'react';
import { useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigation from './src/components/TabNavigation';
import LoginStackNavigation from './src/components/LoginStackNavigation';
import AdminStackNavigation from './src/components/AdminStackNavigation';

const AuthFlow = () => {
  const auth = useSelector(state => state.auth);
  const isAdmin = auth.isLogin && auth.user && auth.user.role === 'admin';

  return (
    <NavigationContainer>
      {!auth.isLogin ? (
        <LoginStackNavigation />
      ) : isAdmin ? (
        <AdminStackNavigation />
      ) : (
        <TabNavigation />
      )}
    </NavigationContainer>
  );
};

export default AuthFlow;
