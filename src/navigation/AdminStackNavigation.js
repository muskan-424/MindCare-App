import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { logScreen } from '../utils/logTouch';
import AdminDashboardScreen from '../domains/admin/screens/AdminDashboardScreen';
import AddSessionNoteScreen from '../domains/therapy/screens/AddSessionNoteScreen';
import TherapistPatientHistoryScreen from '../domains/therapy/screens/TherapistPatientHistoryScreen';


const Stack = createStackNavigator();

const AdminStackNavigation = () => {
  return (
    <Stack.Navigator
      initialRouteName="AdminDashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        listeners: { focus: () => logScreen(route.name) },
      })}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AddSessionNote" component={AddSessionNoteScreen} />
      <Stack.Screen name="PatientHistory" component={TherapistPatientHistoryScreen} />

    </Stack.Navigator>
  );
};

export default AdminStackNavigation;

