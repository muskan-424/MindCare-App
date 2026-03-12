import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, sizes } from '../constants/theme';

const AFFIRMATIONS = {
  calm: [
    'I am safe in this moment.',
    'I allow myself to breathe and relax.',
    'I choose peace over worry.',
    'My mind is becoming still.',
    'I release what I cannot control.',
  ],
  confidence: [
    'I am enough, exactly as I am.',
    'I believe in my ability to handle today.',
    'I am worthy of respect and kindness.',
    'I choose to speak and act with confidence.',
    'I am capable of growth every day.',
  ],
  sleep: [
    'My body is ready for rest.',
    'I let go of the day and allow sleep.',
    'I deserve a peaceful night.',
    'I am safe and can sleep soundly.',
    'Tomorrow can wait; tonight I rest.',
  ],
  stress: [
    'I can handle one step at a time.',
    'I give myself permission to take a break.',
    'I am doing my best, and that is enough.',
    'I release tension with each breath.',
    'I choose to respond, not react.',
  ],
};

const AffirmationsScreen = ({ navigation }) => {
  const [category, setCategory] = useState('calm');
  const [index, setIndex] = useState(0);
  const list = AFFIRMATIONS[category] || AFFIRMATIONS.calm;
  const current = list[index % list.length];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Affirmations</Text>
      <View style={styles.chipRow}>
        {Object.keys(AFFIRMATIONS).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipActive]}
            onPress={() => { setCategory(cat); setIndex(0); }}
          >
            <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.cardWrap}>
        <View style={styles.card}>
          <Text style={styles.affirmationText}>"{current}"</Text>
        </View>
        <TouchableOpacity style={styles.nextBtn} onPress={() => setIndex((i) => i + 1)}>
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default AffirmationsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 20, paddingTop: 50 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: sizes.body, color: colors.secondary, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: colors.secondary, marginBottom: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.accent, marginRight: 8, marginBottom: 6 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.secondary },
  chipTextActive: { color: colors.white },
  cardWrap: { paddingBottom: 40 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 24, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  affirmationText: { fontSize: 20, lineHeight: 30, color: colors.secondary, fontStyle: 'italic', textAlign: 'center' },
  nextBtn: { alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 32, backgroundColor: colors.secondary, borderRadius: 24 },
  nextBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
