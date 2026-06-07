import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
const Stack = createStackNavigator();
import { logScreen } from '../utils/logTouch';
import HomeScreen from '../domains/content/screens/HomeScreen';
import ProfileScreen from '../domains/identity/screens/ProfileScreen';
import EditProfileScreen from '../domains/identity/screens/EditProfileScreen';
import AppointmentsScreen from '../domains/therapy/screens/AppointmentsScreen';
import TrackPlayer from '../domains/content/screens/TrackPlayer';
import TrackList from '../domains/content/screens/TrackList';
import ChatWithTink from '../domains/community/screens/ChatWithTink';
import CreateMeme from '../domains/content/screens/CreateMeme';
import BreathingScreen from '../domains/content/screens/BreathingScreen';
import AffirmationsScreen from '../domains/content/screens/AffirmationsScreen';
import CrisisResourcesScreen from '../domains/admin/screens/CrisisResourcesScreen';
import MoodCheckScreen from '../domains/wellness/screens/MoodCheckScreen';
import GratitudeScreen from '../domains/content/screens/GratitudeScreen';
import GroundingScreen from '../domains/content/screens/GroundingScreen';
import ReportIssueScreen from '../domains/admin/screens/ReportIssueScreen';
import MoodTrackerScreen from '../domains/wellness/screens/MoodTrackerScreen';
import SafetyScreen from '../domains/admin/screens/SafetyScreen';
import EmergencyContactScreen from '../domains/admin/screens/EmergencyContactScreen';
import WellnessPlanScreen from '../domains/wellness/screens/WellnessPlanScreen';
import AssignedResourcesScreen from '../domains/content/screens/AssignedResourcesScreen';
import GroupSessionsScreen from '../domains/community/screens/GroupSessionsScreen';
import GoalTrackingScreen from '../domains/wellness/screens/GoalTrackingScreen';
import PeerMatchingScreen from '../domains/community/screens/PeerMatchingScreen';
import InstitutionDashboardScreen from '../domains/identity/screens/InstitutionDashboardScreen';
// import BubbleWrapGame from '../screens/BubbleWrapGame';
// import PunchGame from '../screens/PunchGame';
import MultidimensionalIntakeScreen from '../domains/assessment/screens/MultidimensionalIntakeScreen';
import EmotionalFingerprintScreen from '../domains/assessment/screens/EmotionalFingerprintScreen';

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
      <Stack.Screen name="EmotionalFingerprint" component={EmotionalFingerprintScreen} />
      <Stack.Screen name="MultidimensionalIntake" component={MultidimensionalIntakeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Appointments" component={AppointmentsScreen} />
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
      <Stack.Screen name="EmergencyContact" component={EmergencyContactScreen} />
      <Stack.Screen name="WellnessPlan" component={WellnessPlanScreen} />
      <Stack.Screen name="AssignedResources" component={AssignedResourcesScreen} />
      <Stack.Screen name="GroupSessions" component={GroupSessionsScreen} />
      <Stack.Screen name="GoalTracking" component={GoalTrackingScreen} />
      <Stack.Screen name="PeerMatching" component={PeerMatchingScreen} />
      <Stack.Screen name="InstitutionDashboard" component={InstitutionDashboardScreen} />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;
