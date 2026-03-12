import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, sizes } from '../constants/theme';

const MOODS = [
  { id: 'great', emoji: '😊', label: 'Great' },
  { id: 'good', emoji: '🙂', label: 'Good' },
  { id: 'okay', emoji: '😐', label: 'Okay' },
  { id: 'low', emoji: '😔', label: 'Low' },
  { id: 'anxious', emoji: '😰', label: 'Anxious' },
];

const MoodCheckScreen = ({ navigation }) => {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (id) => {
    setSelected(id);
    setSubmitted(false);
  };

  const submit = () => {
    setSubmitted(true);
  };

  const message = selected === 'great' || selected === 'good'
    ? 'Glad you\'re doing well. Keep taking care of yourself.'
    : selected === 'okay'
      ? 'Some days are like that. Be gentle with yourself.'
      : selected
        ? 'Thanks for checking in. Remember: it\'s okay to ask for support. You can talk to Tink or reach out to someone you trust.'
        : '';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>How are you feeling?</Text>
      <Text style={styles.subtitle}>A quick check-in. No judgment.</Text>
      <View style={styles.moodRow}>
        {MOODS.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.moodBtn, selected === m.id && styles.moodBtnActive]}
            onPress={() => handleSelect(m.id)}
          >
            <Text style={styles.moodEmoji}>{m.emoji}</Text>
            <Text style={[styles.moodLabel, selected === m.id && styles.moodLabelActive]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {selected ? (
        <TouchableOpacity style={styles.submitBtn} onPress={submit}>
          <Text style={styles.submitBtnText}>Done</Text>
        </TouchableOpacity>
      ) : null}
      {submitted && message ? (
        <View style={styles.messageCard}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}
    </View>
  );
};

export default MoodCheckScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 20, paddingTop: 50 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: sizes.body, color: colors.secondary, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: colors.secondary },
  subtitle: { fontSize: sizes.body, color: colors.gray, marginTop: 6, marginBottom: 28 },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 28 },
  moodBtn: { width: '30%', backgroundColor: colors.white, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  moodBtnActive: { backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.primary },
  moodEmoji: { fontSize: 36, marginBottom: 6 },
  moodLabel: { fontSize: 13, fontWeight: '600', color: colors.secondary },
  moodLabelActive: { color: colors.secondary },
  submitBtn: { alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 40, backgroundColor: colors.secondary, borderRadius: 24, marginTop: 10 },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  messageCard: { marginTop: 24, backgroundColor: colors.accent, borderRadius: 12, padding: 18 },
  messageText: { fontSize: 15, color: colors.secondary, lineHeight: 22, textAlign: 'center' },
});
