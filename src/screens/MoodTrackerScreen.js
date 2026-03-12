import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { connect } from 'react-redux';
import api from '../utils/apiClient';
import { colors, sizes } from '../constants/theme';

const MoodTrackerScreen = ({ auth, navigation }) => {
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [trend, setTrend] = useState([]);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchTrend = async () => {
      if (!auth.user || !auth.user._id) {
        setLoadingTrend(false);
        return;
      }
      try {
        const res = await api.get('/api/mood/trend', { params: { userId: auth.user._id, window: 7 } });
        setTrend(res.data.trend || []);
      } catch (e) {
        setTrend([]);
      }
      setLoadingTrend(false);
    };
    fetchTrend();
  }, [auth.user, saved]);

  const submit = async () => {
    if (!auth.user || !auth.user._id) return;
    setLoading(true);
    setSaved(false);
    try {
      await api.post('/api/mood', {
        userId: auth.user._id,
        rating,
        note: note.trim() || undefined,
      });
      setSaved(true);
      setNote('');
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

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
        <Text style={styles.subtitle}>Rate how you're feeling (1–10). Optional note.</Text>

        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.rateBtn, rating === n && styles.rateBtnActive]}
              onPress={() => setRating(n)}
            >
              <Text style={[styles.rateNum, rating === n && styles.rateNumActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.rateLabel}>{rating <= 3 ? 'Low' : rating <= 6 ? 'Okay' : 'Good'}</Text>

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
          {loading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.submitBtnText}>Save</Text>}
        </TouchableOpacity>
        {saved ? <Text style={styles.savedText}>Mood saved.</Text> : null}

        <Text style={styles.trendTitle}>Last 7 days</Text>
        {loadingTrend ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
        ) : trend.length === 0 ? (
          <Text style={styles.noTrend}>No entries yet. Log your mood above.</Text>
        ) : (
          <View style={styles.trendList}>
            {trend.filter((d) => d.rating != null).map((d) => (
              <View key={d.date} style={styles.trendRow}>
                <Text style={styles.trendDate}>{formatDate(d.date)}</Text>
                <View style={[styles.trendBar, { width: `${(d.rating / 10) * 100}%` }]} />
                <Text style={styles.trendRating}>{d.rating.toFixed(1)}</Text>
              </View>
            ))}
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
  scrollContent: { padding: 20, paddingTop: 8, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: colors.secondary },
  subtitle: { fontSize: sizes.body, color: colors.gray, marginTop: 6, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: colors.secondary, marginTop: 16, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
  rateBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: 8, elevation: 2 },
  rateBtnActive: { backgroundColor: colors.primary },
  rateNum: { fontSize: 12, fontWeight: '700', color: colors.secondary },
  rateNumActive: { color: colors.white },
  rateLabel: { fontSize: 12, color: colors.gray },
  input: { borderWidth: 1, borderColor: colors.gray3, borderRadius: 12, padding: 14, fontSize: 15, minHeight: 60, textAlignVertical: 'top' },
  submitBtn: { marginTop: 24, paddingVertical: 14, backgroundColor: colors.secondary, borderRadius: 24, alignItems: 'center' },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  savedText: { marginTop: 12, fontSize: 14, color: colors.primary, fontWeight: '600' },
  trendTitle: { fontSize: 18, fontWeight: '700', color: colors.secondary, marginTop: 28, marginBottom: 12 },
  noTrend: { fontSize: 14, color: colors.gray },
  trendList: { marginTop: 8 },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  trendDate: { width: 120, fontSize: 13, color: colors.secondary },
  trendBar: { height: 8, backgroundColor: colors.primary, borderRadius: 4, marginRight: 12 },
  trendRating: { fontSize: 14, fontWeight: '600', color: colors.secondary },
});
