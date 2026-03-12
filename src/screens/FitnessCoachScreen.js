import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { connect } from 'react-redux';
import { colors, sizes } from '../constants/theme';
import { concerns } from '../constants/concerns';
import { api_route } from '../utils/route';

const GOALS = [
  'Reduce stress',
  'Better sleep',
  'More energy',
  'Build strength',
  'General wellness',
];
const DURATIONS = [10, 15, 20, 30];
const DAYS_OPTIONS = [3, 4, 5, 7];
const PREFERRED_TYPES = ['Yoga', 'Meditation', 'Cardio', 'Stretching'];

const FitnessCoachScreen = ({ navigation, auth }) => {
  const [step, setStep] = useState('form'); // 'form' | 'plan'
  const [goal, setGoal] = useState('General wellness');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [preferredTypes, setPreferredTypes] = useState(['Yoga', 'Meditation']);
  const [selectedConcernNames, setSelectedConcernNames] = useState([]);
  const [freeText, setFreeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);

  const toggleType = (type) => {
    if (preferredTypes.includes(type)) {
      if (preferredTypes.length > 1) setPreferredTypes(preferredTypes.filter((t) => t !== type));
    } else {
      setPreferredTypes([...preferredTypes, type]);
    }
  };

  const toggleConcern = (name) => {
    if (selectedConcernNames.includes(name)) {
      setSelectedConcernNames(selectedConcernNames.filter((c) => c !== name));
    } else {
      setSelectedConcernNames([...selectedConcernNames, name]);
    }
  };

  const fetchPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        goal,
        durationMinutes,
        daysPerWeek,
        preferredTypes,
        concerns: selectedConcernNames,
        freeText: freeText.trim() || undefined,
      };
      const res = await fetch(`${api_route}/api/fitness/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to load plan');
      setPlan(data);
      setStep('plan');
    } catch (e) {
      setError(e.message || 'Could not generate your plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openVideo = (youtubeId, title) => {
    if (youtubeId) {
      navigation.navigate('Track', {
        videoId: youtubeId,
        title: title || 'Exercise',
        thumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      });
    }
  };

  if (step === 'plan' && plan) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => { setStep('form'); setPlan(null); }} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Your routine</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{plan.summary}</Text>
          </View>
          {(plan.weeklySchedule || []).map((dayObj) => {
            const isExpanded = expandedDay === dayObj.day;
            return (
              <View key={dayObj.day} style={styles.dayCard}>
                <TouchableOpacity
                  style={styles.dayHeader}
                  onPress={() => setExpandedDay(isExpanded ? null : dayObj.day)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dayName}>{dayObj.day}</Text>
                  <Text style={styles.dayFocus}>{dayObj.focus}</Text>
                  <Text style={styles.expandLabel}>{isExpanded ? '▼' : '▶'}</Text>
                </TouchableOpacity>
                {isExpanded && (dayObj.exercises || []).map((ex, idx) => (
                  <View key={idx} style={styles.exerciseRow}>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{ex.name}</Text>
                      <Text style={styles.exerciseDesc}>{ex.description}</Text>
                      <Text style={styles.exerciseMeta}>{ex.durationMinutes} min · {ex.type}</Text>
                    </View>
                    {ex.youtubeId ? (
                      <TouchableOpacity
                        style={styles.watchBtn}
                        onPress={() => openVideo(ex.youtubeId, ex.name)}
                      >
                        <Text style={styles.watchBtnText}>Watch</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Fitness Coach</Text>
          <Text style={styles.subtitle}>Get a personalized schedule and routine</Text>
        </View>

        <Text style={styles.label}>What's your main goal?</Text>
        <View style={styles.chipRow}>
          {GOALS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, goal === g && styles.chipActive]}
              onPress={() => setGoal(g)}
            >
              <Text style={[styles.chipText, goal === g && styles.chipTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Time per day (minutes)</Text>
        <View style={styles.chipRow}>
          {DURATIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.chip, durationMinutes === d && styles.chipActive]}
              onPress={() => setDurationMinutes(d)}
            >
              <Text style={[styles.chipText, durationMinutes === d && styles.chipTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Days per week</Text>
        <View style={styles.chipRow}>
          {DAYS_OPTIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.chip, daysPerWeek === d && styles.chipActive]}
              onPress={() => setDaysPerWeek(d)}
            >
              <Text style={[styles.chipText, daysPerWeek === d && styles.chipTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Include these (select all you like)</Text>
        <View style={styles.chipRow}>
          {PREFERRED_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, preferredTypes.includes(t) && styles.chipActive]}
              onPress={() => toggleType(t)}
            >
              <Text style={[styles.chipText, preferredTypes.includes(t) && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Relevant concerns (optional)</Text>
        <View style={styles.chipRowWrap}>
          {concerns.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.chipSmall, selectedConcernNames.includes(c.name) && styles.chipActive]}
              onPress={() => toggleConcern(c.name)}
            >
              <Text style={[styles.chipTextSmall, selectedConcernNames.includes(c.name) && styles.chipTextActive]} numberOfLines={1}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Anything else? (e.g. "I prefer morning")</Text>
        <TextInput
          style={styles.input}
          placeholder="Optional notes"
          placeholderTextColor={colors.gray}
          value={freeText}
          onChangeText={setFreeText}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={fetchPlan}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.submitText}>Generate my routine</Text>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const mapStateToProps = (state) => ({ auth: state.auth });
export default connect(mapStateToProps)(FitnessCoachScreen);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 50 },
  header: { marginBottom: 20 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: sizes.body, color: colors.secondary, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.secondary },
  subtitle: { fontSize: sizes.body, color: colors.gray, marginTop: 4 },
  label: { fontSize: sizes.header, fontWeight: '600', color: colors.secondary, marginTop: 16, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  chipRowWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.accent,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.accent,
    marginRight: 6,
    marginBottom: 6,
    maxWidth: '48%',
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: sizes.body, color: colors.secondary, fontWeight: '600' },
  chipTextSmall: { fontSize: sizes.caption, color: colors.secondary },
  chipTextActive: { color: colors.white },
  input: {
    borderWidth: 1,
    borderColor: colors.gray3,
    borderRadius: 10,
    padding: 12,
    fontSize: sizes.body,
    backgroundColor: colors.white,
    minHeight: 44,
  },
  errorText: { color: colors.redPink, marginTop: 8, fontSize: sizes.body },
  submitBtn: {
    marginTop: 24,
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: colors.white, fontSize: sizes.header, fontWeight: 'bold' },
  summaryCard: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryText: { fontSize: sizes.body, color: colors.secondary, lineHeight: 22 },
  dayCard: { backgroundColor: colors.white, borderRadius: 12, marginBottom: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  dayHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', padding: 14 },
  dayName: { fontSize: sizes.title, fontWeight: 'bold', color: colors.secondary, marginRight: 8 },
  dayFocus: { fontSize: sizes.body, color: colors.gray, flex: 1 },
  expandLabel: { fontSize: 12, color: colors.gray },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.gray3 },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: sizes.header, fontWeight: '600', color: colors.secondary },
  exerciseDesc: { fontSize: sizes.caption, color: colors.gray, marginTop: 2 },
  exerciseMeta: { fontSize: sizes.caption, color: colors.primary, marginTop: 2 },
  watchBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  watchBtnText: { color: colors.white, fontWeight: '600', fontSize: sizes.caption },
});
