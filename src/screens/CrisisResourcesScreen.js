import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { colors, sizes } from '../constants/theme';

const LINES = [
  { name: 'Vandrevala Foundation', number: '1860-2662-345', note: '24/7 mental health support (India)' },
  { name: 'iCall', number: '9152987821', note: 'Mon–Sat, 10am–10pm (India)' },
  { name: 'Kiran', number: '1800-599-0019', note: '24/7 (India)' },
  { name: 'Samaritans', number: '116 123', note: '24/7 (UK)' },
  { name: 'Crisis Text Line', number: 'Text HOME to 741741', note: '24/7 (US)' },
  { name: 'International Association for Suicide Prevention', note: 'findahelpline.com', url: 'https://findahelpline.com' },
];

const CrisisResourcesScreen = ({ navigation }) => {
  const openUrl = (url) => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  const dial = (num) => {
    const clean = (num || '').replace(/\D/g, '');
    if (clean.length) Linking.openURL(`tel:${clean}`).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Crisis & support</Text>
      <Text style={styles.subtitle}>You matter. Reach out anytime.</Text>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Talk to someone you trust</Text>
          <Text style={styles.cardText}>A friend, family member, or counselor can help. You don’t have to go through this alone.</Text>
        </View>
        {LINES.map((line, i) => (
          <TouchableOpacity
            key={i}
            style={styles.lineCard}
            onPress={() => line.url ? openUrl(line.url) : dial(line.number)}
            activeOpacity={0.8}
          >
            <Text style={styles.lineName}>{line.name}</Text>
            {line.number ? <Text style={styles.lineNumber}>{line.number}</Text> : null}
            <Text style={styles.lineNote}>{line.note}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default CrisisResourcesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 20, paddingTop: 50 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: sizes.body, color: colors.secondary, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: colors.secondary },
  subtitle: { fontSize: sizes.body, color: colors.gray, marginTop: 6, marginBottom: 20 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  card: { backgroundColor: colors.accent, borderRadius: 12, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.secondary, marginBottom: 6 },
  cardText: { fontSize: 14, color: colors.secondary, opacity: 0.9 },
  lineCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  lineName: { fontSize: 16, fontWeight: '700', color: colors.secondary },
  lineNumber: { fontSize: 18, color: colors.primary, marginTop: 4, fontWeight: '600' },
  lineNote: { fontSize: 12, color: colors.gray, marginTop: 4 },
});
