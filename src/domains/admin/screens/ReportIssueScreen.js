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
import api from '../../../utils/apiClient';
import { colors, sizes } from '../../../constants/theme';
import useTranslation from '../../../utils/i18n';

const MOOD_TAGS = ['calm', 'anxious', 'sad', 'angry', 'tired', 'hopeful', 'overwhelmed', 'okay', ''];

const ReportIssueScreen = ({ navigation, auth }) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState(3);
  const [description, setDescription] = useState('');
  const [moodTag, setMoodTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCat, setLoadingCat] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCat = async () => {
      try {
        const res = await api.get('/api/issues/categories');
        setCategories(res.data.categories || []);
        if (res.data.categories && res.data.categories[0]) setCategory(res.data.categories[0]);
      } catch (e) {
        setCategories(['academic_stress', 'anxiety', 'relationship', 'family', 'finances', 'health', 'loneliness', 'grief', 'self_esteem', 'sleep', 'work_life_balance', 'other']);
        setCategory('anxiety');
      }
      setLoadingCat(false);
    };
    fetchCat();
  }, []);

  const submit = async () => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await api.post('/api/issues/report', {
        category: category || 'other',
        severity,
        description: description.trim(),
        moodTag: moodTag || undefined,
      });
      setResult(res.data);
      if (res.data.safety && res.data.safety.showEmergencyScreen) {
        navigation.replace('Safety', { helplines: res.data.safety.helplines });
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || t('common.error'));
    }
    setLoading(false);
  };

  const categoryLabel = (id) => {
    const key = `home.category_${id}`;
    const translated = t(key);
    return translated !== key ? translated : (id || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const moodLabel = (m) => {
    const key = `home.mood_${m}`;
    const translated = t(key);
    return translated !== key ? translated : m;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← {t('common.back')}</Text>
      </TouchableOpacity>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('safety.report_title')}</Text>
        <Text style={styles.subtitle}>{t('safety.report_subtitle')}</Text>

        {loadingCat ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loadingIndicator} />
        ) : (
          <>
            <Text style={styles.label}>{t('safety.report_category')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, category === c && styles.chipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{categoryLabel(c)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>{t('safety.report_severity_label')}</Text>
            <View style={styles.severityRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.sevBtn, severity === n && styles.sevBtnActive]}
                  onPress={() => setSeverity(n)}
                >
                  <Text style={[styles.sevNum, severity === n && styles.sevNumActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sevLabel}>{t(`home.severity_${severity}`)}</Text>

            <Text style={styles.label}>{t('safety.report_describe')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('safety.report_describe_placeholder')}
              placeholderTextColor={colors.gray}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>{t('safety.report_mood_label')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {MOOD_TAGS.filter(Boolean).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, moodTag === m && styles.chipActive]}
                  onPress={() => setMoodTag(moodTag === m ? '' : m)}
                >
                  <Text style={[styles.chipText, moodTag === m && styles.chipTextActive]}>{moodLabel(m)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {error ? <Text style={styles.errText}>{error}</Text> : null}
            <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>{t('common.submit')}</Text>
              )}
            </TouchableOpacity>

            {result ? (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>{t('safety.report_tink_suggests')}</Text>
                <Text style={styles.riskText}>{t('safety.report_risk', { level: result.riskLevel })}</Text>
                {result.recommendations && result.recommendations.length > 0 ? (
                  result.recommendations.map((rec, i) => (
                    <Text key={i} style={styles.recText}>• {rec}</Text>
                  ))
                ) : null}
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Chat', { name: 'Tink' })}>
                  <Text style={styles.secondaryBtnText}>{t('safety.report_talk_tink')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const mapStateToProps = (state) => ({ auth: state.auth });
export default connect(mapStateToProps)(ReportIssueScreen);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  backBtn: { padding: 20, paddingTop: 50 },
  backText: { fontSize: sizes.body, color: colors.secondary, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: colors.secondary },
  subtitle: { fontSize: sizes.body, color: colors.gray, marginTop: 6, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: colors.secondary, marginTop: 16, marginBottom: 8 },
  chipRow: { flexDirection: 'row', marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.white, marginRight: 8, elevation: 2 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, color: colors.secondary },
  chipTextActive: { color: colors.white },
  loadingIndicator: { marginVertical: 20 },
  severityRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  sevBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  sevBtnActive: { backgroundColor: colors.primary },
  sevNum: { fontSize: 18, fontWeight: '700', color: colors.secondary },
  sevNumActive: { color: colors.white },
  sevLabel: { fontSize: 12, color: colors.gray, marginTop: 6 },
  input: { borderWidth: 1, borderColor: colors.gray3, borderRadius: 12, padding: 14, fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
  errText: { color: colors.redPink, fontSize: 14, marginTop: 12 },
  submitBtn: { marginTop: 24, paddingVertical: 14, backgroundColor: colors.secondary, borderRadius: 24, alignItems: 'center' },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  resultCard: { marginTop: 24, backgroundColor: colors.accent, borderRadius: 12, padding: 18 },
  resultTitle: { fontSize: 18, fontWeight: '700', color: colors.secondary, marginBottom: 8 },
  riskText: { fontSize: 14, color: colors.gray, marginBottom: 12 },
  recText: { fontSize: 14, color: colors.secondary, marginBottom: 4 },
  secondaryBtn: { marginTop: 16, paddingVertical: 10, alignItems: 'center' },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary },
});
