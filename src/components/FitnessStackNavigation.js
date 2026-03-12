import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
const Stack = createStackNavigator();
import { logScreen } from '../utils/logTouch';
import FitnessScreen from '../screens/FitnessScreen';
import FitnessSubScreen from '../screens/FitnessSubScreen';
import FitnessContent from '../screens/FitnessContent';
import IndividualFitnessContent from '../screens/IndividualFitnessContent';
import FitnessCoachScreen from '../screens/FitnessCoachScreen';
import TrackPlayer from '../screens/TrackPlayer';

const FitnessStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        listeners: { focus: () => logScreen(route.name) },
      })}>
      <Stack.Screen name="FitnessScreen" component={FitnessScreen} />
      <Stack.Screen name="FitnessCoach" component={FitnessCoachScreen} />
      <Stack.Screen name="FitnessSubScreen" component={FitnessSubScreen} />
      <Stack.Screen name="FitnessContent" component={FitnessContent} />
      <Stack.Screen name="IndividualFitnessContent" component={IndividualFitnessContent} />
      <Stack.Screen name="Track" component={TrackPlayer} />
    </Stack.Navigator>
  );
};

export default FitnessStackNavigator;
