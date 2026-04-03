import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView,
} from 'react-native';
import { connect } from 'react-redux';
import { colors, sizes } from '../constants/theme';
import api from '../utils/apiClient';

const MOODS = [
  { id: 'great', emoji: '😊', label: 'Great', rating: 10 },
  { id: 'good', emoji: '🙂', label: 'Good', rating: 8 },
  { id: 'okay', emoji: '😐', label: 'Okay', rating: 5 },
  { id: 'low', emoji: '😔', label: 'Low', rating: 3 },
  { id: 'anxious', emoji: '😰', label: 'Anxious', rating: 2 },
];

const MoodCheckScreen = ({ navigation }) => {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelect = (id) => {
    setSelected(id);
    setSubmitted(false);
  };

  const submit = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const moodData = MOODS.find(m => m.id === selected);
      await api.post('/api/mood', {
        rating: moodData.rating,
        note: `Quick check-in: ${moodData.label}`,
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Mood check-in failed:', error);
      setSubmitted(true);
    }
    setLoading(false);
  };

  const message = selected === 'great' || selected === 'good'
    ? 'Glad you\'re doing well. Keep taking care of yourself. 🌟'
    : selected === 'okay'
      ? 'Some days are like that. Be gentle with yourself. 💙'
      : selected
        ? 'Thanks for checking in. You can talk to Tink or reach out to someone you trust. 💜'
        : '';

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
            disabled={loading}
          >
            <Text style={styles.moodEmoji}>{m.emoji}</Text>
            <Text style={[styles.moodLabel, selected === m.id && styles.moodLabelActive]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selected && !submitted ? (
        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Done</Text>
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
            <Text style={styles.talkBtnText}>Talk to Tink 💬</Text>
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
  moodEmoji: { fontSize: 36, marginBottom: 6 },
  moodLabel: { fontSize: 13, fontWeight: '600', color: colors.secondary },
  moodLabelActive: { color: colors.secondary },
  submitBtn: { alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 40, backgroundColor: colors.secondary, borderRadius: 24, marginTop: 10 },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  resultCard: { marginTop: 24, backgroundColor: colors.white, borderRadius: 16, padding: 20, elevation: 2 },
  messageText: { fontSize: 15, color: colors.secondary, lineHeight: 22, textAlign: 'center', marginBottom: 16 },
  talkBtn: { backgroundColor: colors.secondary, borderRadius: 24, paddingVertical: 12, alignItems: 'center' },
  talkBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
