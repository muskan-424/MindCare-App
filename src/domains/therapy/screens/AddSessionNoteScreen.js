import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import api from '../../../utils/apiClient';
import { colors } from '../../../constants/theme';
import useTranslation from '../../../utils/i18n';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const CATEGORIES = [
    { id: 'Progress',  icon: 'trending-up',     color: '#4CAF50', labelKey: 'history_cat_progress' },
    { id: 'Clinical',  icon: 'stethoscope',     color: '#2196F3', labelKey: 'history_cat_clinical' },
    { id: 'Crisis',    icon: 'alert-decagram',  color: '#F44336', labelKey: 'history_cat_crisis' },
    { id: 'Follow-up', icon: 'calendar-clock',  color: '#FF9800', labelKey: 'history_cat_followup' }
];

const CONFIDENTIALITY_LEVELS = [
    { level: 1, labelKey: 'note_conf_low', descKey: 'note_conf_low_desc', icon: 'lock-open-outline',  color: '#4CAF50' },
    { level: 2, labelKey: 'note_conf_medium', descKey: 'note_conf_medium_desc', icon: 'lock-outline',       color: '#FF9800' },
    { level: 3, labelKey: 'note_conf_high', descKey: 'note_conf_high_desc', icon: 'lock',               color: '#F44336' },
];

const AddSessionNoteScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { patientId, patientName } = route.params;
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Progress');
  const [confidentialityLevel, setConfidentialityLevel] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return Alert.alert(t('common.required'), t('therapy.note_required'));
    setLoading(true);
    try {
      await api.post('/api/therapists/notes', {
        patientId,
        content: content.trim(),
        category,
        confidentialityLevel,
        sessionDate: new Date()
      });
      Alert.alert(t('common.success'), t('therapy.note_saved'));
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('common.error'), t('therapy.note_save_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
          <AntDesign name="close" size={26} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('therapy.note_title')}</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>{t('common.save')}</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLbl}>{t('therapy.note_patient')}</Text>
          <Text style={styles.infoVal}>{patientName}</Text>
        </View>

        <Text style={styles.lbl}>{t('therapy.note_category')}</Text>
        <View style={styles.catRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.catBtn, 
                category === c.id && { backgroundColor: c.color, borderColor: c.color }
              ]}
              onPress={() => setCategory(c.id)}
            >
              <MaterialCommunityIcons 
                name={c.icon} 
                size={16} 
                color={category === c.id ? '#fff' : c.color} 
              />
              <Text style={[styles.catBtnText, { color: category === c.id ? '#fff' : '#333' }]}>
                {t(`therapy.${c.labelKey}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.lbl}>{t('therapy.note_confidentiality')}</Text>
        <View style={styles.confRow}>
          {CONFIDENTIALITY_LEVELS.map(c => {
            const isActive = confidentialityLevel === c.level;
            return (
              <TouchableOpacity
                key={c.level}
                style={[
                  styles.confBtn,
                  isActive && { backgroundColor: c.color, borderColor: c.color }
                ]}
                onPress={() => setConfidentialityLevel(c.level)}
              >
                <MaterialCommunityIcons name={c.icon} size={20} color={isActive ? '#fff' : c.color} />
                <View>
                  <Text style={[styles.confLabel, isActive && { color: '#fff' }]}>{t(`therapy.${c.labelKey}`)}</Text>
                  <Text style={[styles.confDesc, isActive && { color: 'rgba(255,255,255,0.8)' }]}>{t(`therapy.${c.descKey}`)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.lbl}>{t('therapy.note_documentation')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('therapy.note_placeholder')}
          placeholderTextColor={colors.gray}
          multiline
          numberOfLines={10}
          value={content}
          onChangeText={setContent}
          textAlignVertical="top"
          autoFocus
        />

        <View style={styles.privacyMsg}>
          <MaterialCommunityIcons name="shield-lock-outline" size={18} color="#666" />
          <Text style={styles.privacyText}>
            {t('therapy.note_privacy')}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddSessionNoteScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    backgroundColor: '#2D3436',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  saveText: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: colors.primary },
  infoLbl: { fontSize: 11, color: '#999', fontWeight: 'bold', textTransform: 'uppercase' },
  infoVal: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 4 },
  lbl: { fontSize: 13, fontWeight: 'bold', color: '#2D3436', marginBottom: 12 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  catBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#DCDFE6',
    backgroundColor: '#fff'
  },
  catBtnText: { fontSize: 12, fontWeight: '600' },
  input: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 15, 
    color: '#333', 
    minHeight: 200, 
    borderWidth: 1, 
    borderColor: '#E4E7ED',
    textAlignVertical: 'top'
  },
  privacyMsg: { flexDirection: 'row', gap: 10, marginTop: 24, padding: 16, backgroundColor: '#EDF2F7', borderRadius: 10 },
  privacyText: { flex: 1, fontSize: 11, color: '#666', lineHeight: 16, fontStyle: 'italic' },
  confRow: { gap: 8, marginBottom: 24 },
  confBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DCDFE6',
    backgroundColor: '#fff',
  },
  confLabel: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  confDesc: { fontSize: 11, color: '#888', marginTop: 1 },
});
