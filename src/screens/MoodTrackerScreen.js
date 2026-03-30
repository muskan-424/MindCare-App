import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { connect } from 'react-redux';
import api from '../utils/apiClient';
import { colors, sizes } from '../constants/theme';

const RATING_LABELS = { 1: 'Terrible', 2: 'Very Low', 3: 'Low', 4: 'Below Okay', 5: 'Okay', 6: 'Decent', 7: 'Good', 8: 'Great', 9: 'Very Good', 10: 'Excellent' };
const RATING_COLORS = { low: '#E57373', mid: '#FFB74D', high: '#81C784' };

const MoodTrackerScreen = ({ auth, navigation }) => {
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [trend, setTrend] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [saved, setSaved] = useState(false);
  const [window, setWindow] = useState(7);

  const fetchData = useCallback(async () => {
    setLoadingTrend(true);
    try {
      const [trendRes, statsRes] = await Promise.all([
        api.get('/api/mood/trend', { params: { window } }),
        api.get('/api/mood/stats'),
      ]);
      setTrend(trendRes.data.trend || []);
      setStats(statsRes.data);
    } catch (e) {
      setTrend([]);
    }
    setLoadingTrend(false);
  }, [window]);

  useEffect(() => {
    fetchData();
  }, [fetchData, saved]);

  const submit = async () => {
    setLoading(true);
    setSaved(false);
    try {
      await api.post('/api/mood', { rating, note: note.trim() || undefined });
      setSaved(true);
      setNote('');
    } catch (e) {
      Alert.alert('Error', 'Failed to save mood. Please try again.');
    }
    setLoading(false);
  };

  const deleteMood = async (id) => {
    Alert.alert('Delete Entry', 'Remove this mood entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/api/mood/${id}`);
            setTrend(prev => prev.filter(d => d.id !== id));
            fetchData();
          } catch (e) {
            Alert.alert('Error', 'Could not delete entry.');
          }
        },
      },
    ]);
  };

  const getRatingColor = (r) => r <= 3 ? RATING_COLORS.low : r <= 6 ? RATING_COLORS.mid : RATING_COLORS.high;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Log your mood</Text>
        <Text style={styles.subtitle}>Rate how you're feeling (1–10)</Text>

        {/* Stats cards */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.average || '—'}</Text>
              <Text style={styles.statLabel}>Avg (30d)</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.streak}</Text>
              <Text style={styles.statLabel}>Streak 🔥</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalEntries}</Text>
              <Text style={styles.statLabel}>Total Logs</Text>
            </View>
          </View>
        )}

        {/* Rating selector */}
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.rateBtn, rating === n && { backgroundColor: getRatingColor(n) }]}
              onPress={() => setRating(n)}
            >
              <Text style={[styles.rateNum, rating === n && styles.rateNumActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.rateLabel, { color: getRatingColor(rating) }]}>{RATING_LABELS[rating]}</Text>

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="How are you today?"
          placeholderTextColor={colors.gray}
          value={note}
          onChangeText={setNote}
          multiline
        />

        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.submitBtnText}>Save Mood</Text>}
        </TouchableOpacity>
        {saved ? <Text style={styles.savedText}>✓ Mood saved successfully!</Text> : null}

        {/* Trend header with window toggle */}
        <View style={styles.trendHeader}>
          <Text style={styles.trendTitle}>Mood trend</Text>
          <View style={styles.windowBtns}>
            {[7, 30].map(w => (
              <TouchableOpacity key={w} style={[styles.windowBtn, window === w && styles.windowBtnActive]} onPress={() => setWindow(w)}>
                <Text style={[styles.windowBtnText, window === w && styles.windowBtnTextActive]}>{w}d</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loadingTrend ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
        ) : trend.filter(d => d.rating != null).length === 0 ? (
          <Text style={styles.noTrend}>No entries yet. Log your mood above.</Text>
        ) : (
          <View style={styles.trendList}>
            {trend.filter(d => d.rating != null).map((d) => (
              <View key={d.date} style={styles.trendRow}>
                <Text style={styles.trendDate}>
                  {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                <View style={styles.trendBarWrap}>
                  <View style={[styles.trendBar, { width: `${(d.rating / 10) * 100}%`, backgroundColor: getRatingColor(d.rating) }]} />
                </View>
                <Text style={[styles.trendRating, { color: getRatingColor(d.rating) }]}>{d.rating.toFixed(1)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Best/worst day */}
        {stats?.bestDay && (
          <View style={styles.insightRow}>
            <View style={[styles.insightCard, { borderLeftColor: RATING_COLORS.high }]}>
              <Text style={styles.insightLabel}>Best Day 🌟</Text>
              <Text style={styles.insightValue}>{new Date(stats.bestDay.date).toLocaleDateString()}</Text>
              <Text style={styles.insightSub}>Rating: {stats.bestDay.rating}</Text>
            </View>
            <View style={[styles.insightCard, { borderLeftColor: RATING_COLORS.low }]}>
              <Text style={styles.insightLabel}>Rough Day 💙</Text>
              <Text style={styles.insightValue}>{new Date(stats.worstDay.date).toLocaleDateString()}</Text>
              <Text style={styles.insightSub}>Rating: {stats.worstDay.rating}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const mapStateToProps = (state) => ({ auth: state.auth });
export default connect(mapStateToProps)(MoodTrackerScreen);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 8, paddingBottom: 60 },
  backBtn: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  backText: { fontSize: sizes.body, color: colors.secondary, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: colors.secondary },
  subtitle: { fontSize: sizes.body, color: colors.gray, marginTop: 4, marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 14, alignItems: 'center', marginHorizontal: 4, elevation: 2 },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.secondary },
  statLabel: { fontSize: 11, color: colors.gray, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '700', color: colors.secondary, marginTop: 16, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
  rateBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: 8, elevation: 2 },
  rateNum: { fontSize: 12, fontWeight: '700', color: colors.secondary },
  rateNumActive: { color: colors.white },
  rateLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.gray3, borderRadius: 12, padding: 14, fontSize: 15, minHeight: 60, textAlignVertical: 'top', backgroundColor: colors.white },
  submitBtn: { marginTop: 20, paddingVertical: 14, backgroundColor: colors.secondary, borderRadius: 24, alignItems: 'center' },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  savedText: { marginTop: 10, fontSize: 14, color: colors.primary, fontWeight: '600', textAlign: 'center' },
  trendHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  trendTitle: { fontSize: 18, fontWeight: '700', color: colors.secondary },
  windowBtns: { flexDirection: 'row', backgroundColor: colors.gray3, borderRadius: 8, padding: 2 },
  windowBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  windowBtnActive: { backgroundColor: colors.white },
  windowBtnText: { fontSize: 12, color: colors.gray, fontWeight: '600' },
  windowBtnTextActive: { color: colors.secondary },
  noTrend: { fontSize: 14, color: colors.gray },
  trendList: { marginTop: 4 },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  trendDate: { width: 100, fontSize: 12, color: colors.secondary },
  trendBarWrap: { flex: 1, height: 8, backgroundColor: colors.gray3, borderRadius: 4, marginRight: 10, overflow: 'hidden' },
  trendBar: { height: 8, borderRadius: 4 },
  trendRating: { fontSize: 13, fontWeight: '700', width: 32, textAlign: 'right' },
  insightRow: { flexDirection: 'row', marginTop: 16, gap: 10 },
  insightCard: { flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 14, borderLeftWidth: 4, elevation: 1 },
  insightLabel: { fontSize: 12, fontWeight: '700', color: colors.secondary, marginBottom: 4 },
  insightValue: { fontSize: 13, color: colors.secondary },
  insightSub: { fontSize: 11, color: colors.gray, marginTop: 2 },
});
