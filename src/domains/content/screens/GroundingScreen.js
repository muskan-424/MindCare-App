import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, sizes } from '../../../constants/theme';
import useTranslation from '../../../utils/i18n';

const STEPS = [
  { n: 5, senseKey: 'grounding.step_see', exampleKey: 'grounding.example_see' },
  { n: 4, senseKey: 'grounding.step_touch', exampleKey: 'grounding.example_touch' },
  { n: 3, senseKey: 'grounding.step_hear', exampleKey: 'grounding.example_hear' },
  { n: 2, senseKey: 'grounding.step_smell', exampleKey: 'grounding.example_smell' },
  { n: 1, senseKey: 'grounding.step_taste', exampleKey: 'grounding.example_taste' },
];

const GroundingScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const done = stepIndex >= STEPS.length;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← {t('common.back')}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{t('grounding.title')}</Text>
      <Text style={styles.subtitle}>{t('grounding.subtitle')}</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {done ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('grounding.done_title')}</Text>
            <Text style={styles.cardText}>{t('grounding.done_text')}</Text>
            <TouchableOpacity style={styles.againBtn} onPress={() => setStepIndex(0)}>
              <Text style={styles.againBtnText}>{t('grounding.start_again')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.bigNum}>{step.n}</Text>
            <Text style={styles.senseLabel}>{t(step.senseKey)}</Text>
            <Text style={styles.example}>{t(step.exampleKey)}</Text>
            <TouchableOpacity style={styles.nextBtn} onPress={() => setStepIndex((i) => i + 1)}>
              <Text style={styles.nextBtnText}>{t('grounding.next')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default GroundingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 20, paddingTop: 50 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: sizes.body, color: colors.secondary, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: colors.secondary },
  subtitle: { fontSize: sizes.body, color: colors.gray, marginTop: 6, marginBottom: 24 },
  scrollContent: { paddingBottom: 40 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 28, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  bigNum: { fontSize: 64, fontWeight: '800', color: colors.primary, textAlign: 'center', marginBottom: 12 },
  senseLabel: { fontSize: 20, fontWeight: '700', color: colors.secondary, textAlign: 'center', marginBottom: 8 },
  example: { fontSize: 14, color: colors.gray, textAlign: 'center', marginBottom: 24 },
  nextBtn: { alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 36, backgroundColor: colors.secondary, borderRadius: 24 },
  nextBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: colors.secondary, textAlign: 'center', marginBottom: 8 },
  cardText: { fontSize: 15, color: colors.gray, textAlign: 'center', marginBottom: 20 },
  againBtn: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 28, backgroundColor: colors.accent, borderRadius: 20 },
  againBtnText: { color: colors.secondary, fontWeight: '700', fontSize: 15 },
});
