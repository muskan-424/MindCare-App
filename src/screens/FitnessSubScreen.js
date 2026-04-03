import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Image,
} from 'react-native';
import AnimatedLoader from 'react-native-animated-loader';
import Grid from 'react-native-grid-component';
import FitnessSubScreenCard from '../components/FitnessSubScreenCard';
import api from '../utils/apiClient';

const fallbackSubcategories = {
  Yoga: {
    'Beginner Yoga Flow': { icon: 'https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg' },
    'Yoga for Anxiety Relief': { icon: 'https://i.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg' },
    'Bedtime Yoga': { icon: 'https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg' },
  },
  Meditation: {
    '5-Minute Daily Meditation': { icon: 'https://i.ytimg.com/vi/O-6f5wQXSu8/hqdefault.jpg' },
    'Sleep Meditation': { icon: 'https://i.ytimg.com/vi/2OEL4P1Rz04/hqdefault.jpg' },
    'Anxiety-Calming Breath': { icon: 'https://i.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg' },
  },
  Cardio: {
    'Low Impact Cardio': { icon: 'https://i.ytimg.com/vi/ml6cT4AZdqI/hqdefault.jpg' },
    'Beginner HIIT': { icon: 'https://i.ytimg.com/vi/ml6cT4AZdqI/hqdefault.jpg' },
  },
  Stretching: {
    'Full Body Stretch': { icon: 'https://i.ytimg.com/vi/L_xrDAtykMI/hqdefault.jpg' },
    'Morning Stretch': { icon: 'https://i.ytimg.com/vi/L_xrDAtykMI/hqdefault.jpg' },
  },
  'Healthy Diet': {
    'Healthy Breakfast Ideas': { icon: 'https://i.ytimg.com/vi/8aV2KYf_MXw/hqdefault.jpg' },
    'Meal Prep Basics': { icon: 'https://i.ytimg.com/vi/Qe4qU9oxC6o/hqdefault.jpg' },
  },
};

const FitnessSubScreen = ({route}) => {
  const { category } = route.params;
  const [content, setContent] = useState([]);
  const [title, setTitle] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await api.get(`/api/fitness/${encodeURIComponent(category)}`);
        setContent(result.data);
        setTitle(Object.keys(result.data));
      } catch (error) {
        console.warn('Fitness SubScreen API Error:', error.message);
        const fallback = fallbackSubcategories[category] || fallbackSubcategories.Yoga || {};
        setContent(fallback);
        setTitle(Object.keys(fallback));
      }

      setIsLoading(false);
    };

    fetchData();
  }, [category]);
  const _renderItem = (data) => (
    <FitnessSubScreenCard
      img_uri={content[data].icon}
      subcategory={data}
      category={category}
    />
  );
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
      ) : title.length > 0 ? (
        <Grid
          style={styles.list}
          renderItem={_renderItem}
          //renderPlaceholder={this._renderPlaceholder}
          data={title}
          contentContainerStyle={styles.innerStyle}
          showsVerticalScrollIndicator={false}
          cardWidth={Dimensions.get('window').width}
          numColumns={2}
        />
      ) : (
        <View style={{justifyContent: 'center', alignItems: 'center'}}>
          <Image
            source={require('../assets/no-data.jpg')}
            style={{width: 200, height: 200}}
          />
          <Text style={{paddingHorizontal: 5}}>
            Uh ohh! We are hard at curating the most useful data for you.{' '}
          </Text>
        </View>
      )}
    </View>
  );
};

export default FitnessSubScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
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
