import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigation from './src/navigation/TabNavigation';
import LoginStackNavigation from './src/navigation/LoginStackNavigation';
import AdminStackNavigation from './src/navigation/AdminStackNavigation';
import TherapistStackNavigation from './src/navigation/TherapistStackNavigation';
import { setLanguage } from './src/redux/actions/auth';
import { detectDeviceLanguage } from './src/utils/locale';

const AuthFlow = () => {
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const role = auth.isLogin && auth.user ? auth.user.role : null;

  // Restore language preference from storage, or detect device locale on first launch
  useEffect(() => {
    (async () => {
      try {
        const savedLang = await AsyncStorage.getItem('MindCare_language');
        if (savedLang) {
          if (savedLang !== auth.language) {
            dispatch(setLanguage(savedLang));
          }
          return;
        }

        const detected = detectDeviceLanguage();
        await AsyncStorage.setItem('MindCare_language', detected);
        dispatch(setLanguage(detected));
      } catch (_) {
        // Ignore read errors; default 'en' will be used
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-read stored language after logout so login screen keeps the user's choice
  useEffect(() => {
    if (auth.isLogin) return;
    (async () => {
      try {
        const savedLang = await AsyncStorage.getItem('MindCare_language');
        if (savedLang && savedLang !== auth.language) {
          dispatch(setLanguage(savedLang));
        }
      } catch (_) {
        // Ignore read errors
      }
    })();
  }, [auth.isLogin, auth.language, dispatch]);

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
