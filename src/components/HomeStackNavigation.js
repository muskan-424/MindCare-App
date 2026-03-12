import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
const Stack = createStackNavigator();
import { logScreen } from '../utils/logTouch';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import TrackPlayer from '../screens/TrackPlayer';
import TrackList from '../screens/TrackList';
import ChatWithTink from '../screens/ChatWithTink';
import CreateMeme from '../screens/CreateMeme';
import BreathingScreen from '../screens/BreathingScreen';
import AffirmationsScreen from '../screens/AffirmationsScreen';
import CrisisResourcesScreen from '../screens/CrisisResourcesScreen';
import MoodCheckScreen from '../screens/MoodCheckScreen';
import GratitudeScreen from '../screens/GratitudeScreen';
import GroundingScreen from '../screens/GroundingScreen';
import ReportIssueScreen from '../screens/ReportIssueScreen';
import MoodTrackerScreen from '../screens/MoodTrackerScreen';
import SafetyScreen from '../screens/SafetyScreen';
// import BubbleWrapGame from '../screens/BubbleWrapGame';
// import PunchGame from '../screens/PunchGame';

const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        listeners: {
          focus: () => logScreen(route.name),
        },
      })}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Chat" component={ChatWithTink} />
      <Stack.Screen name="CreateMeme" component={CreateMeme} />
      <Stack.Screen name="TrackList" component={TrackList} />
      <Stack.Screen name="Track" component={TrackPlayer} />
      <Stack.Screen name="Breathing" component={BreathingScreen} />
      <Stack.Screen name="Affirmations" component={AffirmationsScreen} />
      <Stack.Screen name="CrisisResources" component={CrisisResourcesScreen} />
      <Stack.Screen name="MoodCheck" component={MoodCheckScreen} />
      <Stack.Screen name="Gratitude" component={GratitudeScreen} />
      <Stack.Screen name="Grounding" component={GroundingScreen} />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
      <Stack.Screen name="MoodTracker" component={MoodTrackerScreen} />
      <Stack.Screen name="Safety" component={SafetyScreen} />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;
