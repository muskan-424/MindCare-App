import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { colors, sizes } from '../constants/theme';

const PHASES = [
  { label: 'Breathe in', duration: 4 },
  { label: 'Hold', duration: 7 },
  { label: 'Breathe out', duration: 8 },
];

const BreathingScreen = ({ navigation }) => {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [scale] = useState(new Animated.Value(0.6));
  const [running, setRunning] = useState(false);

  const phase = PHASES[phaseIndex];

  useEffect(() => {
    if (!running) return;
    const isInhale = phaseIndex === 0;
    const isHold = phaseIndex === 1;
    const targetScale = isInhale ? 1.2 : isHold ? 1.2 : 0.6;
    Animated.timing(scale, {
      toValue: targetScale,
      duration: (phase.duration || 4) * 1000,
      useNativeDriver: true,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }).start(() => {
      setPhaseIndex((prevPhaseIndex) => (prevPhaseIndex + 1) % PHASES.length);
    });
  }, [running, phaseIndex, phase.duration, scale]);

  const startStop = () => {
    if (running) {
      setRunning(false);
      scale.setValue(0.6);
      setPhaseIndex(0);
    } else {
      setRunning(true);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>4-7-8 Breathing</Text>
      <Text style={styles.subtitle}>Calms the nervous system. Repeat 3–4 cycles.</Text>
      <View style={styles.circleWrap}>
        <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />
      </View>
      <Text style={styles.phaseLabel}>{phase.label}</Text>
      <Text style={styles.phaseHint}>{phase.duration} seconds</Text>
      <TouchableOpacity style={[styles.btn, running && styles.btnStop]} onPress={startStop}>
        <Text style={styles.btnText}>{running ? 'Stop' : 'Start'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default BreathingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: 20, paddingTop: 50, alignItems: 'center' },
  backBtn: { alignSelf: 'flex-start', marginBottom: 12 },
  backText: { fontSize: sizes.body, color: colors.secondary, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: colors.secondary, marginBottom: 6 },
  subtitle: { fontSize: sizes.body, color: colors.gray, marginBottom: 32, textAlign: 'center' },
  circleWrap: { width: 200, height: 200, justifyContent: 'center', alignItems: 'center', marginVertical: 24 },
  circle: { width: 140, height: 140, borderRadius: 70, backgroundColor: colors.primary, opacity: 0.8 },
  phaseLabel: { fontSize: 22, fontWeight: '700', color: colors.secondary },
  phaseHint: { fontSize: 14, color: colors.gray, marginTop: 6 },
  btn: { marginTop: 40, paddingVertical: 16, paddingHorizontal: 48, backgroundColor: colors.secondary, borderRadius: 30 },
  btnStop: { backgroundColor: colors.redPink },
  btnText: { color: colors.white, fontSize: 18, fontWeight: '700' },
});
