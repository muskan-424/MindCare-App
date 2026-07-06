import React from 'react';
import {
  StyleSheet, Text, ScrollView, TouchableOpacity, View, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../../constants/theme';
import api from '../../../utils/apiClient';
import useTranslation from '../../../utils/i18n';

const RISK_COLORS = { LOW: '#81C784', MEDIUM: '#FFB74D', HIGH: '#E57373', CRITICAL: '#C62828' };
const EMOTION_ICONS = { joy: '😊', sadness: '😔', anxiety: '😰', anger: '😠', hope: '🌟', confusion: '😕', loneliness: '🥺', gratitude: '💚', stress: '😤', calm: '😌' };

const DisplayJournal = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { data, onDelete } = route.params;

  const handleDelete = () => {
    Alert.alert(t('journal.delete_title'), t('journal.delete_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/api/journals/${data.id}`);
            if (onDelete) onDelete(data.id);
            navigation.goBack();
          } catch (e) {
            Alert.alert(t('common.error'), t('journal.error_delete'));
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.toolBtn}>
          <Icon name="arrow-back" size={22} color={colors.secondary} />
        </TouchableOpacity>
        <View style={styles.toolMeta}>
          <Text style={styles.toolDate}>{data.date}</Text>
          <Text style={styles.toolTime}>{data.time}</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.toolBtn}>
          <Icon name="trash-outline" size={22} color="#E57373" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.content}>{data.content}</Text>

        {(data.aiInsight || data.emotionTags?.length > 0 || data.riskLevel) ? (
          <View style={styles.aiCard}>
            <Text style={styles.aiCardTitle}>{t('journal.ai_insight')}</Text>
            {data.aiInsight ? <Text style={styles.aiInsight}>"{data.aiInsight}"</Text> : null}
            {data.riskLevel && data.riskLevel !== 'LOW' ? (
              <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[data.riskLevel] }]}>
                <Text style={styles.riskBadgeText}>{t('journal.risk_badge', { level: data.riskLevel })}</Text>
              </View>
            ) : null}
            {data.emotionTags?.length > 0 ? (
              <View style={styles.emotionRow}>
                {data.emotionTags.map(tag => (
                  <View key={tag} style={styles.emotionChip}>
                    <Text style={styles.emotionChipText}>{EMOTION_ICONS[tag] || '•'} {tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {data.sentimentScore != null ? (
              <View style={styles.sentimentRow}>
                <Text style={styles.sentimentLabel}>{t('journal.sentiment')}</Text>
                <View style={styles.sentimentBar}>
                  <View style={[styles.sentimentFill, {
                    width: `${Math.round(((data.sentimentScore + 1) / 2) * 100)}%`,
                    backgroundColor: data.sentimentScore >= 0 ? RISK_COLORS.LOW : RISK_COLORS.HIGH,
                  }]} />
                </View>
                <Text style={styles.sentimentValue}>{data.sentimentScore > 0 ? '+' : ''}{data.sentimentScore?.toFixed(2)}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {data.riskLevel === 'HIGH' || data.riskLevel === 'CRITICAL' ? (
          <TouchableOpacity
            style={styles.talkBtn}
            onPress={() => navigation.navigate('HomeTab', { screen: 'Chat' })}>
            <Text style={styles.talkBtnText}>{t('journal.talk_to_tink')}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
};

export default DisplayJournal;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF8' },
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray3 },
  toolBtn: { padding: 6, width: 40 },
  toolMeta: { flex: 1, alignItems: 'center' },
  toolDate: { fontSize: 14, fontWeight: '700', color: colors.secondary },
  toolTime: { fontSize: 12, color: colors.gray },
  scroll: { padding: 20, paddingBottom: 60 },
  content: { fontSize: 16, lineHeight: 28, color: colors.secondary, marginBottom: 24 },
  aiCard: { backgroundColor: colors.white, borderRadius: 16, padding: 18, marginBottom: 20, elevation: 2 },
  aiCardTitle: { fontSize: 15, fontWeight: '700', color: colors.secondary, marginBottom: 12 },
  aiInsight: { fontSize: 14, fontStyle: 'italic', color: colors.secondary, lineHeight: 22, marginBottom: 12 },
  riskBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  riskBadgeText: { color: colors.white, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  emotionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  emotionChip: { backgroundColor: colors.cream, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  emotionChipText: { fontSize: 13, color: colors.secondary },
  sentimentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sentimentLabel: { fontSize: 12, color: colors.gray, width: 60 },
  sentimentBar: { flex: 1, height: 8, backgroundColor: colors.gray3, borderRadius: 4, overflow: 'hidden' },
  sentimentFill: { height: 8, borderRadius: 4 },
  sentimentValue: { fontSize: 12, fontWeight: '700', color: colors.secondary, width: 40, textAlign: 'right' },
  talkBtn: { backgroundColor: colors.secondary, borderRadius: 24, paddingVertical: 14, alignItems: 'center' },
  talkBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
