import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, sizes } from '../../../constants/theme';
import useTranslation from '../../../utils/i18n';

const CATEGORIES = ['calm', 'confidence', 'sleep', 'stress'];
const AFFIRMATION_COUNTS = { calm: 5, confidence: 5, sleep: 5, stress: 5 };

const AffirmationsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [category, setCategory] = useState('calm');
  const [index, setIndex] = useState(0);
  const count = AFFIRMATION_COUNTS[category] || 5;
  const current = t(`affirmations.${category}_${index % count}`);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← {t('common.back')}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{t('affirmations.title')}</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipActive]}
            onPress={() => { setCategory(cat); setIndex(0); }}
          >
            <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{t(`affirmations.category_${cat}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.cardWrap}>
        <View style={styles.card}>
          <Text style={styles.affirmationText}>"{current}"</Text>
        </View>
        <TouchableOpacity style={styles.nextBtn} onPress={() => setIndex((i) => i + 1)}>
          <Text style={styles.nextBtnText}>{t('affirmations.next')}</Text>
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
