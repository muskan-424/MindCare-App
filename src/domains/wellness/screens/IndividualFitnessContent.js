import React from 'react';
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import { colors } from '../../../constants/theme';
import useTranslation from '../../../utils/i18n';

const IndividualFitnessContent = ({ route, navigation }) => {
  const { t } = useTranslation();
  const image = route.params?.image;
  const title = route.params?.category;
  const videoId = route.params?.videoId;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ImageZoom
          cropWidth={Dimensions.get('window').width}
          cropHeight={280}
          imageWidth={Dimensions.get('window').width}
          imageHeight={280}
          style={styles.zoomWrap}>
          <Image
            resizeMode="cover"
            style={styles.coverImage}
            source={{ uri: image }}
          />
        </ImageZoom>
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
        {videoId ? (
          <TouchableOpacity
            style={styles.watchBtn}
            onPress={() =>
              navigation.navigate('Track', {
                videoId,
                title: title || t('wellness.fitness_default_title'),
                thumbnail: image || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              })
            }>
            <Text style={styles.watchBtnText}>{t('wellness.fitness_watch_video')}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.hint}>{t('wellness.fitness_follow_hint', { title })}</Text>
        )}
      </ScrollView>
    </View>
  );
};

export default IndividualFitnessContent;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scrollContent: { paddingBottom: 40 },
  zoomWrap: { marginTop: 10 },
  coverImage: { width: '100%', height: 280, borderRadius: 12 },
  titleBar: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  titleText: { fontSize: 17, fontWeight: '700', color: colors.secondary, textAlign: 'center' },
  watchBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  watchBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  hint: { marginHorizontal: 16, marginTop: 20, fontSize: 14, color: colors.gray, textAlign: 'center' },
});
