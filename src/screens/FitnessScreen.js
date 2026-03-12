import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '../constants/theme';
import BrickList from 'react-native-masonry-brick-list';
import api from '../utils/apiClient';
import AnimatedLoader from 'react-native-animated-loader';
import FitnessCategoryCard from '../components/FitnessCategoryCard';
import { useNavigation } from '@react-navigation/native';

const FitnessScreen = () => {
  const navigation = useNavigation();
  const [categories, setCategories] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsError(false);
      try {
        const result = await api.get('/api/fitness/categories');
        setCategories(result.data);
        setCategoryData(Object.keys(result.data));
      } catch (error) {
        console.warn('Fitness API Error:', error.message);
        const fallbackData = {
          "Yoga": { icon: "https://cdn-icons-png.flaticon.com/512/2647/2647625.png" },
          "Meditation": { icon: "https://cdn-icons-png.flaticon.com/512/3663/3663335.png" },
          "Cardio": { icon: "https://cdn-icons-png.flaticon.com/512/10043/10043015.png" },
          "Stretching": { icon: "https://cdn-icons-png.flaticon.com/512/4144/4144158.png" }
        };
        setCategories(fallbackData);
        setCategoryData(Object.keys(fallbackData));
        setIsError(false);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <AnimatedLoader
          visible={true}
          overlayColor="rgba(255,255,255,0.75)"
          source={require('../constants/loader.json')}
          animationStyle={styles.lottie}
          speed={2}
        />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.coachCard}
            onPress={() => navigation.navigate('FitnessCoach')}
            activeOpacity={0.85}
          >
            <Text style={styles.coachTitle}>Fitness Coach</Text>
            <Text style={styles.coachSubtitle}>
              Get a personalized schedule, custom routines, and exercises based on your goals and preferences.
            </Text>
            <View style={styles.coachCta}>
              <Text style={styles.coachCtaText}>Get my routine →</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.browseLabel}>Or browse by category</Text>
          {categoryData.map((data) => (
            <View key={data} style={styles.categoryItem}>
              <FitnessCategoryCard
                img_uri={categories[data].icon}
                category={data}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default FitnessScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1, width: '100%' },
  scrollContent: { paddingBottom: 24 },
  coachCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  coachTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  coachSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.95,
    lineHeight: 20,
    marginBottom: 14,
  },
  coachCta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  coachCtaText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  browseLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginLeft: 16,
    marginBottom: 12,
  },
  categoryItem: { marginBottom: 4 },
  item: {
    flex: 1,
    height: 160,
    margin: 1,
  },
  list: {
    flex: 1,
    marginTop: 40,
  },
  innerStyle: {
    justifyContent: 'space-between',
  },
  lottie: {
    width: 200,
    height: 200,
  },
});
