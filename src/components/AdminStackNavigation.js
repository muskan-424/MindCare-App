import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { logScreen } from '../utils/logTouch';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';

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
    </Stack.Navigator>
  );
};

export default AdminStackNavigation;

