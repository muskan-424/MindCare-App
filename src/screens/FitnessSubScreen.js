import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import {colors} from '../constants/theme';
import base64 from 'react-native-base64';
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
  const [content, setContent] = useState([]);
  const [title, setTitle] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsError(false);
      try {
        const result = await api.get(`/api/fitness/${encodeURIComponent(route.params.category)}`);
        setContent(result.data);
        setTitle(Object.keys(result.data));
      } catch (error) {
        console.warn('Fitness SubScreen API Error:', error.message);
        const fallback = fallbackSubcategories[route.params.category] || fallbackSubcategories.Yoga || {};
        setContent(fallback);
        setTitle(Object.keys(fallback));
        setIsError(false);
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);
  const _renderItem = (data, i) => (
    <FitnessSubScreenCard
      img_uri={content[data]['icon']}
      subcategory={data}
      category={route.params.category}></FitnessSubScreenCard>
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
          numColumns={1}
          contentContainerStyle={styles.innerStyle}
          showsVerticalScrollIndicator={false}
          cardWidth={Dimensions.get('window').width}
          numColumns={2}></Grid>
      ) : (
        <View style={{justifyContent: 'center', alignItems: 'center'}}>
          <Image
            source={require('../assets/no-data.jpg')}
            style={{width: 200, height: 200}}></Image>
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
