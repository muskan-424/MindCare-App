import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import ImageOverlay from 'react-native-image-overlay';
import {useNavigation} from '@react-navigation/native';

const FitnessCategoryCard = ({img_uri, category, label}) => {
  const navigation = useNavigation();
  const displayLabel = label || category;

  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('FitnessSubScreen', {category: category})
      }>
      <ImageOverlay
        overlayAlpha={0.35}
        source={{uri: img_uri.toString()}}
        title={displayLabel}
        titleStyle={styles.category}
      />
    </TouchableOpacity>
  );
};

export default FitnessCategoryCard;

const styles = StyleSheet.create({
  category: {
    justifyContent: 'center',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
