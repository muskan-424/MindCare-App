import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView,
} from 'react-native';
import { connect } from 'react-redux';
import { colors, sizes } from '../../../constants/theme';
import api from '../../../utils/apiClient';
import useTranslation from '../../../utils/i18n';

const MOOD_IDS = ['great', 'good', 'okay', 'low', 'anxious'];
const MOOD_RATINGS = { great: 10, good: 8, okay: 5, low: 3, anxious: 2 };

const MoodCheckScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const getMoodLabel = (id) => t(`mood_check.mood_${id}`);

  const handleSelect = (id) => {
    setSelected(id);
    setSubmitted(false);
  };

  const submit = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const label = getMoodLabel(selected);
      await api.post('/api/mood', {
        rating: MOOD_RATINGS[selected],
        note: t('mood_check.quick_checkin_note', { label }),
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Mood check-in failed:', error);
      setSubmitted(true);
    }
    setLoading(false);
  };

  const message = selected === 'great' || selected === 'good'
    ? t('mood_check.msg_positive')
    : selected === 'okay'
      ? t('mood_check.msg_okay')
      : selected
        ? t('mood_check.msg_low')
        : '';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← {t('common.back')}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{t('mood_check.title')}</Text>
      <Text style={styles.subtitle}>{t('mood_check.subtitle')}</Text>

      <View style={styles.moodRow}>
        {MOOD_IDS.map((id) => (
          <TouchableOpacity
            key={id}
            style={[styles.moodBtn, selected === id && styles.moodBtnActive]}
            onPress={() => handleSelect(id)}
            disabled={loading}
          >
            <Text style={[styles.moodLabel, selected === id && styles.moodLabelActive]}>{getMoodLabel(id)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selected && !submitted ? (
        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.submitBtnText}>{t('mood_check.done')}</Text>
          )}
        </TouchableOpacity>
      ) : null}

      {submitted ? (
        <View style={styles.resultCard}>
          {message ? <Text style={styles.messageText}>{message}</Text> : null}
          <TouchableOpacity
            style={styles.talkBtn}
            onPress={() => { navigation.navigate('Chat', { name: 'Tink' }); }}
          >
            <Text style={styles.talkBtnText}>{t('mood_check.talk_to_tink')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
};

const mapStateToProps = (state) => ({ auth: state.auth });
export default connect(mapStateToProps)(MoodCheckScreen);

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.cream, padding: 20, paddingTop: 50 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: sizes.body, color: colors.secondary, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: colors.secondary },
  subtitle: { fontSize: sizes.body, color: colors.gray, marginTop: 6, marginBottom: 28 },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 28 },
  moodBtn: { width: '30%', backgroundColor: colors.white, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  moodBtnActive: { backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.primary },
  moodLabel: { fontSize: 14, fontWeight: '600', color: colors.secondary },
  moodLabelActive: { color: colors.secondary },
  submitBtn: { alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 40, backgroundColor: colors.secondary, borderRadius: 24, marginTop: 10 },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  resultCard: { marginTop: 24, backgroundColor: colors.white, borderRadius: 16, padding: 20, elevation: 2 },
  messageText: { fontSize: 15, color: colors.secondary, lineHeight: 22, textAlign: 'center', marginBottom: 16 },
  talkBtn: { backgroundColor: colors.secondary, borderRadius: 24, paddingVertical: 12, alignItems: 'center' },
  talkBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
