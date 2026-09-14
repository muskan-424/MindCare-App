import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import LanguagePicker from './src/components/LanguagePicker';
import TabNavigation from './src/navigation/TabNavigation';
import LoginStackNavigation from './src/navigation/LoginStackNavigation';
import AdminStackNavigation from './src/navigation/AdminStackNavigation';
import TherapistStackNavigation from './src/navigation/TherapistStackNavigation';
import OnboardingScreen from './src/domains/identity/screens/OnboardingScreen';
import { setLanguage } from './src/redux/actions/auth';
import { detectDeviceLanguage } from './src/utils/locale';

const AuthFlow = () => {
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const role = auth.isLogin && auth.user ? auth.user.role : null;

  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem('MindCare_hasSeenOnboarding');
        setShowOnboarding(!seen);
      } catch (_) {
        setShowOnboarding(false);
      }
      setCheckingOnboarding(false);
    })();
  }, []);

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

  if (checkingOnboarding) {
    return null;
  }

  if (showOnboarding && !auth.isLogin) {
    return <OnboardingScreen onDone={() => setShowOnboarding(false)} />;
  }

  return (
    <NavigationContainer>
      {!auth.isLogin ? (
        <LoginStackNavigation />
      ) : (
        <View style={styles.flexOne}>
          {role === 'admin' ? (
            <AdminStackNavigation />
          ) : role === 'clinician' || role === 'therapist' ? (
            <TherapistStackNavigation />
          ) : (
            <TabNavigation />
          )}
          <GlobalLanguageSwitcher />
        </View>
      )}
    </NavigationContainer>
  );
};

// Floating language switcher so users can change language from any screen, not just Login/Profile.
const GlobalLanguageSwitcher = () => {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.floatingWrap, { top: insets.top + 6 }]}>
      <LanguagePicker compact />
    </View>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  floatingWrap: {
    position: 'absolute',
    right: 0,
    zIndex: 999,
    elevation: 10,
  },
});

export default AuthFlow;
