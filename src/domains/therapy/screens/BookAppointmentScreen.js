import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { connect } from 'react-redux';
import api from '../../../utils/apiClient';
import { colors } from '../../../constants/theme';
import useTranslation from '../../../utils/i18n';

const SPECIALITY_KEYS = [
  { id: 'Psychologist', key: 'book_speciality_psychologist' },
  { id: 'Psychiatrist', key: 'book_speciality_psychiatrist' },
  { id: 'Counsellor', key: 'book_speciality_counsellor' },
  { id: 'Social Worker', key: 'book_speciality_social_worker' },
  { id: 'Any', key: 'book_speciality_any' },
];

const TIME_PREF_KEYS = [
  { id: 'morning', labelKey: 'book_time_morning', hintKey: 'book_time_morning_hint' },
  { id: 'afternoon', labelKey: 'book_time_afternoon', hintKey: 'book_time_afternoon_hint' },
  { id: 'evening', labelKey: 'book_time_evening', hintKey: 'book_time_evening_hint' },
  { id: 'any', labelKey: 'book_time_any', hintKey: 'book_time_any_hint' },
];

// Next 14 days for date preference
const getUpcomingDays = () => {
  const days = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    });
  }
  return days;
};

const DAYS = getUpcomingDays();

const BookAppointmentScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [speciality, setSpeciality] = useState('');
  const [preferredDates, setPreferredDates] = useState([]);
  const [preferredTime, setPreferredTime] = useState('');
  const [userNote, setUserNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const toggleDate = (iso) => {
    setPreferredDates(prev =>
      prev.includes(iso) ? prev.filter(d => d !== iso) : [...prev, iso]
    );
  };

  const submit = async () => {
    if (!speciality) {
      Alert.alert(t('appointments.book_missing_info_title'), t('appointments.book_missing_info_msg'));
      return;
    }
    Alert.alert(
      t('appointments.book_submit_title'),
      t('appointments.book_submit_msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.submit'), onPress: async () => {
            setSubmitting(true);
            try {
              await api.post('/api/appointments', {
                requestedSpeciality: speciality,
                preferredDates,
                preferredTime,
                userNote: userNote.trim(),
              });
              setDone(true);
            } catch (e) {
              Alert.alert(t('common.error'), e.response?.data?.error || t('appointments.book_submit_failed'));
            }
            setSubmitting(false);
          },
        },
      ]
    );
  };

  if (done) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>{t('appointments.book_success_title')}</Text>
        <Text style={styles.successText}>
          {t('appointments.book_success_text')}
        </Text>
        <View style={styles.successNote}>
          <Text style={styles.successNoteText}>{t('appointments.book_success_note')}</Text>
        </View>

        <TouchableOpacity style={styles.viewBtn} onPress={() => navigation.navigate('Appointments')}>
          <Text style={styles.viewBtnText}>{t('appointments.book_view_requests')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>{t('appointments.book_back_therapists')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('appointments.book_title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('appointments.book_info_title')}</Text>
          <Text style={styles.infoText}>
            {t('appointments.book_info_text')}
          </Text>
        </View>

        {/* Speciality */}
        <Text style={styles.sectionLabel}>{t('appointments.book_speciality_label')}</Text>
        <View style={styles.chipsWrap}>
          {SPECIALITY_KEYS.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.chip, speciality === s.id && styles.chipActive]}
              onPress={() => setSpeciality(s.id)}
            >
              <Text style={[styles.chipText, speciality === s.id && styles.chipTextActive]}>{t(`appointments.${s.key}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preferred dates */}
        <Text style={styles.sectionLabel}>{t('appointments.book_dates_label')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysRow}>
          {DAYS.map(d => (
            <TouchableOpacity
              key={d.iso}
              style={[styles.dayBtn, preferredDates.includes(d.iso) && styles.dayBtnActive]}
              onPress={() => toggleDate(d.iso)}
              disabled={!preferredDates.includes(d.iso) && preferredDates.length >= 5}
            >
              <Text style={[styles.dayText, preferredDates.includes(d.iso) && styles.dayTextActive]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Preferred time */}
        <Text style={styles.sectionLabel}>{t('appointments.book_time_label')}</Text>
        <View style={styles.timeGrid}>
          {TIME_PREF_KEYS.map(tp => (
            <TouchableOpacity
              key={tp.id}
              style={[styles.timeCard, preferredTime === tp.id && styles.timeCardActive]}
              onPress={() => setPreferredTime(tp.id)}
            >
              <Text style={styles.timeLabel}>{t(`appointments.${tp.labelKey}`)}</Text>
              <Text style={styles.timeHint}>{t(`appointments.${tp.hintKey}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Note */}
        <Text style={styles.sectionLabel}>{t('appointments.book_help_label')}</Text>
        <TextInput
          style={styles.noteInput}
          placeholder={t('appointments.book_note_placeholder')}
          placeholderTextColor={colors.gray}
          value={userNote}
          onChangeText={setUserNote}
          multiline
          maxLength={500}
        />
        <Text style={styles.charCount}>{userNote.length}/500</Text>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={submit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.submitBtnText}>{t('appointments.book_submit_btn')}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const mapStateToProps = state => ({ auth: state.auth });
export default connect(mapStateToProps)(BookAppointmentScreen);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { backgroundColor: colors.primary, paddingTop: 48, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 16 },
  backText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.white },
  scroll: { padding: 20, paddingBottom: 60 },
  infoCard: { backgroundColor: colors.secondary, borderRadius: 14, padding: 16, marginBottom: 20 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: colors.white, marginBottom: 6 },
  infoText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: colors.secondary, marginBottom: 10, marginTop: 8 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.white, borderRadius: 10, elevation: 1 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, color: colors.secondary, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  daysRow: { marginBottom: 16 },
  dayBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.white, borderRadius: 10, marginRight: 10, elevation: 1 },
  dayBtnActive: { backgroundColor: colors.primary },
  dayText: { fontSize: 13, color: colors.secondary, fontWeight: '600' },
  dayTextActive: { color: colors.white },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  timeCard: { width: '47%', backgroundColor: colors.white, borderRadius: 12, padding: 14, elevation: 1 },
  timeCardActive: { backgroundColor: colors.secondary },
  timeLabel: { fontSize: 14, fontWeight: '700', color: colors.secondary },
  timeHint: { fontSize: 12, color: colors.gray, marginTop: 4 },
  noteInput: { borderWidth: 1, borderColor: colors.gray3, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 100, textAlignVertical: 'top', backgroundColor: colors.white },
  charCount: { fontSize: 11, color: colors.gray, textAlign: 'right', marginTop: 4, marginBottom: 16 },
  submitBtn: { backgroundColor: colors.secondary, borderRadius: 24, paddingVertical: 16, alignItems: 'center', elevation: 2 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  // Success screen
  successContainer: { flex: 1, backgroundColor: colors.cream, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '800', color: colors.secondary, marginBottom: 12 },
  successText: { fontSize: 15, color: colors.gray, textAlign: 'center', lineHeight: 24, marginBottom: 20 },
  successNote: { backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginBottom: 24 },
  successNoteText: { fontSize: 14, color: colors.secondary, fontWeight: '600' },
  viewBtn: { backgroundColor: colors.secondary, borderRadius: 24, paddingVertical: 14, paddingHorizontal: 40, marginBottom: 12 },
  viewBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  backLink: { paddingVertical: 8 },
  backLinkText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
