import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { colors, sizes } from '../constants/theme';

const DEFAULT_HELPLINES = [
  { name: 'Vandrevala Foundation', number: '1860-2662-345', note: '24/7 mental health support (India)' },
  { name: 'iCall', number: '9152987821', note: 'Mon–Sat, 10am–10pm (India)' },
  { name: 'Kiran', number: '1800-599-0019', note: '24/7 (India)' },
  { name: 'Crisis Text Line', number: 'Text HOME to 741741', note: '24/7 (US)' },
];

const SafetyScreen = ({ navigation, route }) => {
  const helplines = (route.params && route.params.helplines) || DEFAULT_HELPLINES;

  const dial = (num) => {
    const clean = (num || '').replace(/\D/g, '');
    if (clean.length) Linking.openURL(`tel:${clean}`).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>You're not alone</Text>
        <Text style={styles.subtitle}>Reach out to someone who can listen and support you right now.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Talk to someone you trust</Text>
          <Text style={styles.cardText}>A friend, family member, or counselor can help. You don't have to go through this alone.</Text>
        </View>

        <Text style={styles.sectionTitle}>Helplines</Text>
        {helplines.map((line, i) => (
          <TouchableOpacity
            key={i}
            style={styles.lineCard}
            onPress={() => line.number && dial(line.number)}
            activeOpacity={0.8}
          >
            <Text style={styles.lineName}>{line.name}</Text>
            {line.number ? <Text style={styles.lineNumber}>{line.number}</Text> : null}
            {line.note ? <Text style={styles.lineNote}>{line.note}</Text> : null}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.consultBtn} onPress={() => navigation.getParent()?.navigate('TherapistTab', { screen: 'TherapistHome' })}>
          <Text style={styles.consultBtnText}>Find a counselor</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default SafetyScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, paddingTop: 50 },
  backBtn: { paddingHorizontal: 20, marginBottom: 8 },
  backText: { fontSize: sizes.body, color: colors.secondary, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: colors.secondary },
  subtitle: { fontSize: sizes.body, color: colors.gray, marginTop: 6, marginBottom: 20 },
  card: { backgroundColor: colors.accent, borderRadius: 12, padding: 16, marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.secondary, marginBottom: 6 },
  cardText: { fontSize: 14, color: colors.secondary, opacity: 0.9 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.secondary, marginBottom: 12 },
  lineCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  lineName: { fontSize: 16, fontWeight: '700', color: colors.secondary },
  lineNumber: { fontSize: 18, color: colors.primary, marginTop: 4, fontWeight: '600' },
  lineNote: { fontSize: 12, color: colors.gray, marginTop: 4 },
  consultBtn: { marginTop: 24, paddingVertical: 14, backgroundColor: colors.secondary, borderRadius: 24, alignItems: 'center' },
  consultBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
