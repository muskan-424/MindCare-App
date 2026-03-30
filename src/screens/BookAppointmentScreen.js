import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { connect } from 'react-redux';
import api from '../utils/apiClient';
import { colors } from '../constants/theme';

const SPECIALITIES = ['Psychologist', 'Psychiatrist', 'Counsellor', 'Social Worker', 'Any'];
const TIME_PREFS = [
  { id: 'morning', label: '🌅 Morning', hint: '8AM – 12PM' },
  { id: 'afternoon', label: '☀️ Afternoon', hint: '12PM – 5PM' },
  { id: 'evening', label: '🌙 Evening', hint: '5PM – 9PM' },
  { id: 'any', label: '🕐 Any Time', hint: 'Flexible' },
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
      Alert.alert('Missing Info', 'Please select the type of specialist you need.');
      return;
    }
    Alert.alert(
      'Submit Consultation Request',
      'An admin will review your request and assign the best available therapist. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit', onPress: async () => {
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
              Alert.alert('Error', e.response?.data?.error || 'Could not submit request.');
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
        <Text style={styles.successIcon}>📋</Text>
        <Text style={styles.successTitle}>Request Submitted!</Text>
        <Text style={styles.successText}>
          An admin is reviewing your request and will assign the best available therapist
          based on your preferences. You'll be able to see the status in My Appointments.
        </Text>
        <View style={styles.successNote}>
          <Text style={styles.successNoteText}>⏳ Typically confirmed within 24 hours</Text>
        </View>
        <TouchableOpacity style={styles.viewBtn} onPress={() => navigation.navigate('Appointments')}>
          <Text style={styles.viewBtnText}>View My Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Back to Therapists</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Consultation</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🛡️ Admin-Verified Matching</Text>
          <Text style={styles.infoText}>
            Tell us what you need. Our admin team will review your request, check therapist availability,
            and assign the best match — no guesswork for you.
          </Text>
        </View>

        {/* Speciality */}
        <Text style={styles.sectionLabel}>What type of specialist do you need?</Text>
        <View style={styles.chipsWrap}>
          {SPECIALITIES.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, speciality === s && styles.chipActive]}
              onPress={() => setSpeciality(s)}
            >
              <Text style={[styles.chipText, speciality === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preferred dates */}
        <Text style={styles.sectionLabel}>Preferred dates (select up to 5)</Text>
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
        <Text style={styles.sectionLabel}>Preferred time of day</Text>
        <View style={styles.timeGrid}>
          {TIME_PREFS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.timeCard, preferredTime === t.id && styles.timeCardActive]}
              onPress={() => setPreferredTime(t.id)}
            >
              <Text style={styles.timeLabel}>{t.label}</Text>
              <Text style={styles.timeHint}>{t.hint}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Note */}
        <Text style={styles.sectionLabel}>What would you like help with?</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Briefly describe what you're going through or what kind of support you need..."
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
            : <Text style={styles.submitBtnText}>Submit Request to Admin</Text>}
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
