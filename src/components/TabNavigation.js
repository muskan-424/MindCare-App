import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';
import TherapistStackNavigation from './TherapistStackNavigation';
// import FitnessScreen from '../screens/FitnessScreen';
import { colors } from '../constants/theme';
import { logTab } from '../utils/logTouch';
import HomeStackNavigator from './HomeStackNavigation';
import StoryScreen from '../screens/StoryScreen';
import FitnessStackNavigator from './FitnessStackNavigation';
// import FitnessStackNavigator from './FitnessStackNavigation'
// import VentItOut from '../screens/VentItOut'

const Tab = createBottomTabNavigator();

const getTabBarIcon = routeName => ({ color, size }) => {
  if (routeName === 'HomeTab') {
    return <Feather name="home" size={size} color={color} />;
  }
  if (routeName === 'Story') {
    return <Entypo name="open-book" size={size} color={color} />;
  }
  if (routeName === 'TherapistTab') {
    return <Fontisto name="doctor" size={size} color={color} />;
  }
  if (routeName === 'Fitness') {
    return <Entypo name="check" size={size} color={color} />;
  }
  return null;
};

const TabNavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: getTabBarIcon(route.name),
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.white2,
        tabBarStyle: {
          backgroundColor: colors.primary,
          marginTop: 0,
          borderTopWidth: 0,
          elevation: 10,
          height: 60,
          paddingVertical: 8,
        },
        tabBarIconStyle: {
          margin: 8,
        },
        headerShown: false,
        listeners: {
          focus: () => logTab(route.name),
        },
      })}>
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
      <Tab.Screen name="Story" component={StoryScreen} />
      <Tab.Screen name="TherapistTab" component={TherapistStackNavigation} />
      <Tab.Screen name="Fitness" component={FitnessStackNavigator} />
    </Tab.Navigator>
  );
};

export default TabNavigation;
