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
import BrickList from 'react-native-masonry-brick-list';
import api from '../utils/apiClient';
import base64 from 'react-native-base64';
import AnimatedLoader from 'react-native-animated-loader';
import Grid from 'react-native-grid-component';
import FitnessContentCard from '../components/FitnessContentCard';

const fallbackContent = {
  Yoga: {
    'Beginner Yoga Flow': {
      '10-Minute Beginner Yoga': 'https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg',
      'Gentle Morning Yoga': 'https://i.ytimg.com/vi/KmYdVq47UOU/hqdefault.jpg',
    },
    'Yoga for Anxiety Relief': {
      'Yoga for Anxiety and Stress': 'https://i.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg',
      'Calming Yoga for Worry': 'https://i.ytimg.com/vi/b1H3xO3x_Js/hqdefault.jpg',
    },
    'Bedtime Yoga': {
      'Bedtime Yoga for Relaxation': 'https://i.ytimg.com/vi/v7AYKMP6rOE/hqdefault.jpg',
    },
  },
  Meditation: {
    '5-Minute Daily Meditation': {
      'Quick Reset Meditation': 'https://i.ytimg.com/vi/O-6f5wQXSu8/hqdefault.jpg',
    },
    'Sleep Meditation': {
      'Deep Sleep Talk Down': 'https://i.ytimg.com/vi/2OEL4P1Rz04/hqdefault.jpg',
    },
    'Anxiety-Calming Breath': {
      'Breathing for Anxiety Relief': 'https://i.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg',
    },
  },
  Cardio: {
    'Low Impact Cardio': {
      'Low Impact Cardio Workout': 'https://i.ytimg.com/vi/ml6cT4AZdqI/hqdefault.jpg',
    },
    'Beginner HIIT': {
      'Beginner HIIT Session': 'https://i.ytimg.com/vi/ml6cT4AZdqI/hqdefault.jpg',
    },
  },
  Stretching: {
    'Full Body Stretch': {
      'Full Body Stretch Routine': 'https://i.ytimg.com/vi/L_xrDAtykMI/hqdefault.jpg',
    },
    'Morning Stretch': {
      '5-Minute Morning Stretch': 'https://i.ytimg.com/vi/L_xrDAtykMI/hqdefault.jpg',
    },
  },
  'Healthy Diet': {
    'Healthy Breakfast Ideas': {
      '3 Healthy Breakfast Ideas': 'https://i.ytimg.com/vi/8aV2KYf_MXw/hqdefault.jpg',
    },
    'Meal Prep Basics': {
      'Beginner Meal Prep Guide': 'https://i.ytimg.com/vi/Qe4qU9oxC6o/hqdefault.jpg',
    },
  },
};

const FitnessContent = ({route}) => {
  const [content, setContent] = useState({});
  const [title, setTitle] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [contentList, setList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsError(false);
      setIsLoading(true);
      try {
        const result = await api.get(
          `/api/fitness/${encodeURIComponent(route.params.category)}/${encodeURIComponent(route.params.subcategory)}/getContent`,
        );
        setContent(result.data);
        setTitle(Object.keys(result.data));
        // setList(convertToArray(content,title))
        //console.log(contentList[0][heading])
        //console.log(title[1])

        //   setContent(result.data);
        //   setTitle(Object.keys(result.data))
        //   console.log(result.data)
        //console.log(categoryData[0])
      } catch (error) {
        console.warn('Fitness Content API Error:', error.message);
        const byCategory = fallbackContent[route.params.category] || fallbackContent.Yoga || {};
        const localContent = byCategory[route.params.subcategory] || {};
        setContent(localContent);
        setTitle(Object.keys(localContent));
        setIsError(false);
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);
  const _renderItem = (data, index) => (
    <FitnessContentCard
      img_uri={content[data]}
      category={data}></FitnessContentCard>
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
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={{justifyContent: 'space-between'}}></Grid>
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

export default FitnessContent;

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
    alignContent: 'space-between',
  },

  lottie: {
    width: 200,
    height: 200,
  },
});
