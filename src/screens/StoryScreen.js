import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { colors, sizes } from '../constants/theme';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import BlogMainScreen from './BlogMainScreen';
import JournalScreen from './JournalScreen';

const Tab = createMaterialTopTabNavigator();

const BlogsTabIcon = ({ color }) => <Feather name="book-open" size={20} color={color} />;
const JournalsTabIcon = ({ color }) => <Entypo name="book" size={20} color={color} />;

function StoryScreen() {
  const commonTabOptions = {
    tabBarActiveTintColor: colors.white,
    tabBarInactiveTintColor: colors.white2,
    tabBarLabelStyle: styles.tabLabel,
    tabBarStyle: styles.tabBar,
    tabBarIndicatorStyle: styles.indicator,
    tabBarShowIcon: true,
  };

  return (
    <View style={styles.container}>
      <Tab.Navigator screenOptions={commonTabOptions}>
        <Tab.Screen
          name="Blogs"
          component={BlogMainScreen}
          options={{ tabBarLabel: 'Blogs', tabBarIcon: BlogsTabIcon }}
        />
        <Tab.Screen
          name="Journals"
          component={JournalScreen}
          options={{ tabBarLabel: 'My Journals', tabBarIcon: JournalsTabIcon }}
        />
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
