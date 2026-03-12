import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, sizes } from '../constants/theme';

const STEPS = [
  { n: 5, sense: 'things you can see', example: 'a window, your phone, a plant' },
  { n: 4, sense: 'things you can touch', example: 'the floor, your clothes, a cushion' },
  { n: 3, sense: 'things you can hear', example: 'traffic, birds, your breath' },
  { n: 2, sense: 'things you can smell', example: 'soap, air, food' },
  { n: 1, sense: 'one thing you can taste', example: 'your lips, gum, or a sip of water' },
];

const GroundingScreen = ({ navigation }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const done = stepIndex >= STEPS.length;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>5-4-3-2-1 Grounding</Text>
      <Text style={styles.subtitle}>Brings you back to the present when you feel overwhelmed.</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {done ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>You’re here.</Text>
            <Text style={styles.cardText}>Take a breath. You can repeat this anytime.</Text>
            <TouchableOpacity style={styles.againBtn} onPress={() => setStepIndex(0)}>
              <Text style={styles.againBtnText}>Start again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.bigNum}>{step.n}</Text>
            <Text style={styles.senseLabel}>{step.sense}</Text>
            <Text style={styles.example}>{step.example}</Text>
            <TouchableOpacity style={styles.nextBtn} onPress={() => setStepIndex((i) => i + 1)}>
              <Text style={styles.nextBtnText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default GroundingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 20, paddingTop: 50 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: sizes.body, color: colors.secondary, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: colors.secondary },
  subtitle: { fontSize: sizes.body, color: colors.gray, marginTop: 6, marginBottom: 24 },
  scrollContent: { paddingBottom: 40 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 28, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  bigNum: { fontSize: 64, fontWeight: '800', color: colors.primary, textAlign: 'center', marginBottom: 12 },
  senseLabel: { fontSize: 20, fontWeight: '700', color: colors.secondary, textAlign: 'center', marginBottom: 8 },
  example: { fontSize: 14, color: colors.gray, textAlign: 'center', marginBottom: 24 },
  nextBtn: { alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 36, backgroundColor: colors.secondary, borderRadius: 24 },
  nextBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  cardTitle: { fontSize: 22, fontWeight: '800', color: colors.secondary, textAlign: 'center', marginBottom: 8 },
  cardText: { fontSize: 15, color: colors.gray, textAlign: 'center', marginBottom: 20 },
  againBtn: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 28, backgroundColor: colors.accent, borderRadius: 20 },
  againBtnText: { color: colors.secondary, fontWeight: '700', fontSize: 15 },
});
