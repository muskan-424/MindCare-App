import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { colors, sizes } from '../constants/theme';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import BlogMainScreen from './BlogMainScreen';
import JournalScreen from './JournalScreen';

function BlogsTab() {
  return <BlogMainScreen />;
}

function JournalsTab() {
  return <JournalScreen />;
}

const Tab = createMaterialTopTabNavigator();

function StoryScreen() {
  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color }) => {
            if (route.name === 'Blogs') {
              return <Feather name="book-open" size={20} color={color} />;
            }
            return <Entypo name="book" size={20} color={color} />;
          },
          tabBarActiveTintColor: colors.white,
          tabBarInactiveTintColor: colors.white2,
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: styles.tabBar,
          tabBarIndicatorStyle: styles.indicator,
          tabBarShowIcon: true,
        })}>
        <Tab.Screen name="Blogs" component={BlogsTab} options={{ tabBarLabel: 'Blogs' }} />
        <Tab.Screen name="Journals" component={JournalsTab} options={{ tabBarLabel: 'My Journals' }} />
      </Tab.Navigator>
    </View>
  );
}

export default StoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  tabBar: {
    backgroundColor: colors.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: sizes.body,
    fontWeight: '700',
    textTransform: 'none',
  },
  indicator: {
    backgroundColor: colors.yellow,
    height: 3,
  },
});
