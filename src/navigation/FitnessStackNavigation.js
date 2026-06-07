import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
const Stack = createStackNavigator();
import { logScreen } from '../utils/logTouch';
import FitnessScreen from '../domains/wellness/screens/FitnessScreen';
import FitnessSubScreen from '../domains/wellness/screens/FitnessSubScreen';
import FitnessContent from '../domains/wellness/screens/FitnessContent';
import IndividualFitnessContent from '../domains/wellness/screens/IndividualFitnessContent';
import FitnessCoachScreen from '../domains/wellness/screens/FitnessCoachScreen';
import TrackPlayer from '../domains/content/screens/TrackPlayer';

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
