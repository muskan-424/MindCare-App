import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { colors, sizes } from '../../../constants/theme';
import api from '../../../utils/apiClient';
import useTranslation from '../../../utils/i18n';

// PHQ-4 items (answered 0–3) followed by 1–5 lifestyle scales; ids match the backend check-in API.
export const PHQ4_ITEMS = ['nervous', 'worrying', 'interest', 'down'];
export const SCALE_ITEMS = ['stress', 'pressure', 'sleep', 'activity', 'social'];
const FREQUENCIES = [0, 1, 2, 3];
const SCALE_VALUES = [1, 2, 3, 4, 5];
// Sleep is rated on quality (poor → good); the other scales on amount (low → high).
const SCALE_END_KEYS = {
  sleep: ['checkin.sleep_low', 'checkin.sleep_high'],
};

const WellbeingCheckInScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const allAnswered = [...PHQ4_ITEMS, ...SCALE_ITEMS].every((id) => answers[id] !== undefined);

  const answer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setError('');
  };

  const submit = async () => {
    if (!allAnswered) {
      setError(t('checkin.incomplete'));
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/api/profile/wellbeing-checkin', answers);
      setResult(data);
    } catch (err) {
      console.error('Wellbeing check-in failed:', err);
      setError(t('checkin.error'));
    }
    setLoading(false);
  };

  if (result) {
    const severe = result.severity === 'severe';
    const needsSupport = severe || result.severity === 'moderate';
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('checkin.title')}</Text>
        <View style={styles.resultCard}>
          <Text style={styles.resultText}>{t(`checkin.result_${result.severity}`)}</Text>
          {severe ? (
            <TouchableOpacity style={[styles.actionBtn, styles.crisisBtn]} onPress={() => navigation.navigate('CrisisResources')}>
              <Text style={styles.actionBtnText}>{t('checkin.crisis_help')}</Text>
            </TouchableOpacity>
          ) : null}
          {needsSupport ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.getParent()?.navigate('TherapistTab', { screen: 'TherapistHome' })}
            >
              <Text style={styles.actionBtnText}>{t('checkin.book_therapist')}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Chat', { name: 'Tink' })}>
            <Text style={styles.actionBtnText}>{t('checkin.talk_to_tink')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryBtnText}>{t('checkin.done')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.disclaimer}>{t('checkin.disclaimer')}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← {t('common.back')}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{t('checkin.title')}</Text>
      <Text style={styles.subtitle}>{t('checkin.subtitle')}</Text>

      {PHQ4_ITEMS.map((id) => (
        <View key={id} style={styles.questionCard}>
          <Text style={styles.question}>{t(`checkin.q_${id}`)}</Text>
          {FREQUENCIES.map((value) => (
            <TouchableOpacity
              key={value}
              testID={`checkin-${id}-${value}`}
              style={[styles.option, answers[id] === value && styles.optionActive]}
              onPress={() => answer(id, value)}
              disabled={loading}
            >
              <Text style={styles.optionText}>{t(`checkin.freq_${value}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <Text style={styles.sectionTitle}>{t('checkin.lifestyle_title')}</Text>
      {SCALE_ITEMS.map((id) => {
        const [lowKey, highKey] = SCALE_END_KEYS[id] || ['checkin.scale_low', 'checkin.scale_high'];
        return (
          <View key={id} style={styles.questionCard}>
            <Text style={styles.question}>{t(`checkin.scale_${id}`)}</Text>
            <View style={styles.scaleRow}>
              {SCALE_VALUES.map((value) => (
                <TouchableOpacity
                  key={value}
                  testID={`checkin-${id}-${value}`}
                  style={[styles.scaleBtn, answers[id] === value && styles.optionActive]}
                  onPress={() => answer(id, value)}
                  disabled={loading}
                >
                  <Text style={styles.scaleText}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.scaleEnds}>
              <Text style={styles.scaleEndText}>{t(lowKey)}</Text>
              <Text style={styles.scaleEndText}>{t(highKey)}</Text>
            </View>
          </View>
        );
      })}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        testID="checkin-submit"
        style={[styles.submitBtn, !allAnswered && styles.submitBtnDisabled]}
        onPress={submit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Text style={styles.submitBtnText}>{t('checkin.submit')}</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.disclaimer}>{t('checkin.disclaimer')}</Text>
    </ScrollView>
  );
};

export default WellbeingCheckInScreen;

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.cream, padding: 20, paddingTop: 50, paddingBottom: 40 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: sizes.body, color: colors.secondary, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: colors.secondary },
  subtitle: { fontSize: sizes.body, color: colors.gray, marginTop: 6, marginBottom: 20, lineHeight: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.secondary, marginTop: 12, marginBottom: 12 },
  questionCard: { backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  question: { fontSize: 16, fontWeight: '600', color: colors.secondary, marginBottom: 10, lineHeight: 22 },
  option: { borderRadius: 10, borderWidth: 1, borderColor: colors.gray3, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8 },
  optionActive: { backgroundColor: colors.accent, borderColor: colors.primary, borderWidth: 2 },
  optionText: { fontSize: 15, color: colors.secondary },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleBtn: { width: '18%', aspectRatio: 1, borderRadius: 10, borderWidth: 1, borderColor: colors.gray3, alignItems: 'center', justifyContent: 'center' },
  scaleText: { fontSize: 16, fontWeight: '700', color: colors.secondary },
  scaleEnds: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  scaleEndText: { fontSize: 12, color: colors.gray },
  error: { color: '#C0392B', textAlign: 'center', marginBottom: 10, fontSize: 14 },
  submitBtn: { alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 48, backgroundColor: colors.secondary, borderRadius: 24, marginTop: 6 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  disclaimer: { fontSize: 12, color: colors.gray, textAlign: 'center', marginTop: 16 },
  resultCard: { marginTop: 20, backgroundColor: colors.white, borderRadius: 16, padding: 20, elevation: 2 },
  resultText: { fontSize: 16, color: colors.secondary, lineHeight: 24, textAlign: 'center', marginBottom: 18 },
  actionBtn: { backgroundColor: colors.secondary, borderRadius: 24, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  crisisBtn: { backgroundColor: '#C0392B' },
  actionBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  secondaryBtn: { paddingVertical: 10, alignItems: 'center' },
  secondaryBtnText: { color: colors.secondary, fontWeight: '600', fontSize: 15 },
});
