import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
const Stack = createStackNavigator();
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
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatWithTink}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateMeme"
        component={CreateMeme}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TrackList"
        component={TrackList}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Track"
        component={TrackPlayer}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Breathing" component={BreathingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Affirmations" component={AffirmationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CrisisResources" component={CrisisResourcesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MoodCheck" component={MoodCheckScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Gratitude" component={GratitudeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Grounding" component={GroundingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MoodTracker" component={MoodTrackerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Safety" component={SafetyScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;
