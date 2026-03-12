import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {colors, sizes, fonts} from '../constants/theme';
import ImageOverlay from 'react-native-image-overlay';
import {useNavigation} from '@react-navigation/native';

function getVideoIdFromThumbnail(uri) {
  if (!uri || typeof uri !== 'string') return null;
  const match = uri.match(/i\.ytimg\.com\/vi\/([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

const FitnessContentCard = ({img_uri, category}) => {
  const navigation = useNavigation();
  const videoId = getVideoIdFromThumbnail(img_uri);

  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('IndividualFitnessContent', {
          category: category,
          image: img_uri,
          videoId: videoId,
        })
      }>
      <ImageOverlay
        containerStyle={styles.img}
        overlayAlpha={0.35}
        source={{uri: img_uri.toString()}}
        title={category}
        titleStyle={styles.category}
      />
    </TouchableOpacity>
  );
};

export default FitnessContentCard;

const styles = StyleSheet.create({
  img: {
    borderRadius: 10,
    marginVertical: 7,
    aspectRatio: 0.6,
    marginEnd: 5,
  },
  category: {
    justifyContent: 'center',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
