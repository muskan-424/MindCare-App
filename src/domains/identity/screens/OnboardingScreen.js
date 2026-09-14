import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../../constants/theme';
import useTranslation from '../../../utils/i18n';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    image: require('../../../assets/splash-image.png'),
    titleKey: 'onboarding.slide1_title',
    bodyKey: 'onboarding.slide1_body',
  },
  {
    image: require('../../../assets/yoga.jpg'),
    titleKey: 'onboarding.slide2_title',
    bodyKey: 'onboarding.slide2_body',
  },
  {
    image: require('../../../assets/counsellor.png'),
    titleKey: 'onboarding.slide3_title',
    bodyKey: 'onboarding.slide3_body',
  },
];

const OnboardingScreen = ({ onDone }) => {
  const { t } = useTranslation();
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('MindCare_hasSeenOnboarding', 'true');
    } catch (_) {
      // Ignore write errors; onboarding will simply show again next launch
    }
    onDone();
  };

  const isLastSlide = index === SLIDES.length - 1;

  const goNext = () => {
    if (isLastSlide) {
      finishOnboarding();
      return;
    }
    const nextIndex = index + 1;
    scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    setIndex(nextIndex);
  };

  const handleScroll = event => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(newIndex);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={finishOnboarding}>
        <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {SLIDES.map((slide, i) => (
          <View style={styles.slide} key={i}>
            <Image source={slide.image} style={styles.image} resizeMode="cover" />
            <Text style={styles.title}>{t(slide.titleKey)}</Text>
            <Text style={styles.body}>{t(slide.bodyKey)}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={goNext}>
        <Text style={styles.nextButtonText}>
          {isLastSlide ? t('onboarding.get_started') : t('onboarding.next')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  skip: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    color: colors.secondary,
    fontWeight: '600',
    fontSize: 15,
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 90,
  },
  image: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray2,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  nextButton: {
    alignSelf: 'center',
    width: 200,
    height: 46,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  nextButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
