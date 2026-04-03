import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
const Stack = createStackNavigator();
import { logScreen } from '../utils/logTouch';
import TherapistScreen from '../screens/TherapistScreen';
import TherapistProfileScreen from '../screens/TherapistProfileScreen';
import TherapistHomeScreen from '../screens/TherapistHomeScreen';
import BookAppointmentScreen from '../screens/BookAppointmentScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import TherapistPatientHistoryScreen from '../screens/TherapistPatientHistoryScreen';
import AddSessionNoteScreen from '../screens/AddSessionNoteScreen';

const TherapistStackNavigation = () => {
  return (
    <Stack.Navigator
      initialRouteName="TherapistHome"
      screenOptions={({ route }) => ({
        headerShown: false,
        listeners: { focus: () => logScreen(route.name) },
      })}>
      <Stack.Screen name="TherapistHome" component={TherapistHomeScreen} />
      <Stack.Screen name="Therapist" component={TherapistScreen} />
      <Stack.Screen name="TherapistProfile" component={TherapistProfileScreen} />
      <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
      <Stack.Screen name="Appointments" component={AppointmentsScreen} />
      <Stack.Screen name="TherapistPatientHistory" component={TherapistPatientHistoryScreen} />
      <Stack.Screen name="AddSessionNote" component={AddSessionNoteScreen} />
    </Stack.Navigator>
  );
};

export default TherapistStackNavigation;

