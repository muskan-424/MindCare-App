import React, { useRef, useState } from 'react';
import {
  StyleSheet, Text, ScrollView, TouchableOpacity, View,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../constants/theme';
import api from '../utils/apiClient';

const RISK_COLORS = { LOW: '#81C784', MEDIUM: '#FFB74D', HIGH: '#E57373', CRITICAL: '#C62828' };
const EMOTION_ICONS = { joy: '😊', sadness: '😔', anxiety: '😰', anger: '😠', hope: '🌟', confusion: '😕', loneliness: '🥺', gratitude: '💚', stress: '😤', calm: '😌' };

const AddJournal = ({ navigation }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const save = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      Alert.alert('Empty Entry', 'Please write something before saving.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/journals', { content: trimmed });
      setAiResult(res.data);
      setSaved(true);
    } catch (e) {
      Alert.alert('Error', 'Could not save your journal. Please try again.');
    }
    setLoading(false);
  };

  if (saved && aiResult) {
    return (
      <ScrollView contentContainerStyle={styles.resultContainer}>
        <Text style={styles.resultTitle}>Journal saved ✓</Text>
        <Text style={styles.resultPreview} numberOfLines={4}>{aiResult.content}</Text>

        {/* AI analysis card */}
        <View style={styles.aiCard}>
          <Text style={styles.aiCardTitle}>🤖 Tink's Analysis</Text>
          {aiResult.aiInsight ? (
            <Text style={styles.aiInsight}>"{aiResult.aiInsight}"</Text>
          ) : null}
          {aiResult.riskLevel ? (
            <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[aiResult.riskLevel] }]}>
              <Text style={styles.riskBadgeText}>{aiResult.riskLevel} risk</Text>
            </View>
          ) : null}
          {aiResult.emotionTags?.length > 0 ? (
            <View style={styles.emotionRow}>
              {aiResult.emotionTags.map(tag => (
                <View key={tag} style={styles.emotionChip}>
                  <Text style={styles.emotionChipText}>{EMOTION_ICONS[tag] || '•'} {tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {aiResult.sentimentScore != null ? (
            <View style={styles.sentimentRow}>
              <Text style={styles.sentimentLabel}>Sentiment</Text>
              <View style={styles.sentimentBar}>
                <View style={[styles.sentimentFill, {
                  width: `${Math.round(((aiResult.sentimentScore + 1) / 2) * 100)}%`,
                  backgroundColor: aiResult.sentimentScore >= 0 ? RISK_COLORS.LOW : RISK_COLORS.HIGH,
                }]} />
              </View>
              <Text style={styles.sentimentValue}>{aiResult.sentimentScore > 0 ? '+' : ''}{aiResult.sentimentScore?.toFixed(2)}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.doneBtnText}>Back to Journal</Text>
        </TouchableOpacity>
        {aiResult.riskLevel === 'HIGH' || aiResult.riskLevel === 'CRITICAL' ? (
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.redPink || '#E57373', marginTop: 10 }]}
            onPress={() => navigation.navigate('Chat', { name: 'Tink' })}>
            <Text style={styles.doneBtnText}>Talk to Tink 💜</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.toolBtn}>
          <Icon name="arrow-back" size={22} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.toolTitle}>New Entry</Text>
        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={save} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save & Analyze</Text>
          )}
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.editor}
        placeholder="Start writing here... Tink will privately analyze your entry for insights."
        placeholderTextColor={colors.gray}
        value={content}
        onChangeText={setContent}
        multiline
        autoFocus
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{content.length} chars</Text>
    </KeyboardAvoidingView>
  );
};

const mapStateToProps = state => ({ auth: state.auth });
export default connect(mapStateToProps)(AddJournal);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray3 },
  toolBtn: { padding: 6 },
  toolTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.secondary },
  saveBtn: { backgroundColor: colors.secondary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  editor: { flex: 1, padding: 20, fontSize: 16, lineHeight: 26, color: colors.secondary },
  charCount: { paddingHorizontal: 20, paddingBottom: 8, fontSize: 12, color: colors.gray, textAlign: 'right' },
  resultContainer: { flexGrow: 1, backgroundColor: colors.cream, padding: 20, paddingTop: 60 },
  resultTitle: { fontSize: 24, fontWeight: '800', color: colors.secondary, marginBottom: 12 },
  resultPreview: { fontSize: 14, color: colors.gray, lineHeight: 22, marginBottom: 20, backgroundColor: colors.white, padding: 14, borderRadius: 12 },
  aiCard: { backgroundColor: colors.white, borderRadius: 16, padding: 18, marginBottom: 20, elevation: 2 },
  aiCardTitle: { fontSize: 16, fontWeight: '700', color: colors.secondary, marginBottom: 12 },
  aiInsight: { fontSize: 14, fontStyle: 'italic', color: colors.secondary, lineHeight: 22, marginBottom: 14 },
  riskBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 14 },
  riskBadgeText: { color: colors.white, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  emotionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  emotionChip: { backgroundColor: colors.cream, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  emotionChipText: { fontSize: 13, color: colors.secondary },
  sentimentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sentimentLabel: { fontSize: 12, color: colors.gray, width: 60 },
  sentimentBar: { flex: 1, height: 8, backgroundColor: colors.gray3, borderRadius: 4, overflow: 'hidden' },
  sentimentFill: { height: 8, borderRadius: 4 },
  sentimentValue: { fontSize: 12, fontWeight: '700', color: colors.secondary, width: 40, textAlign: 'right' },
  doneBtn: { backgroundColor: colors.secondary, borderRadius: 24, paddingVertical: 14, alignItems: 'center' },
  doneBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
