import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import api from '../utils/apiClient';
import { colors } from '../constants/theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const CATEGORIES = [
    { label: 'Progress',  icon: 'trending-up',     color: '#4CAF50' },
    { label: 'Clinical',  icon: 'stethoscope',     color: '#2196F3' },
    { label: 'Crisis',    icon: 'alert-decagram',  color: '#F44336' },
    { label: 'Follow-up', icon: 'calendar-clock',  color: '#FF9800' }
];

const AddSessionNoteScreen = ({ route, navigation }) => {
  const { patientId, patientName } = route.params;
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Progress');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return Alert.alert('Required', 'Please enter session details.');
    setLoading(true);
    try {
      await api.post('/api/therapists/notes', {
        patientId,
        content: content.trim(),
        category,
        sessionDate: new Date()
      });
      Alert.alert('Success', 'Session note saved successfully!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save note. Please check your credentials.');
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
        <Text style={styles.headerTitle}>New Session Note</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLbl}>Patient</Text>
          <Text style={styles.infoVal}>{patientName}</Text>
        </View>

        <Text style={styles.lbl}>Category</Text>
        <View style={styles.catRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.label}
              style={[
                styles.catBtn, 
                category === c.label && { backgroundColor: c.color, borderColor: c.color }
              ]}
              onPress={() => setCategory(c.label)}
            >
              <MaterialCommunityIcons 
                name={c.icon} 
                size={16} 
                color={category === c.label ? '#fff' : c.color} 
              />
              <Text style={[styles.catBtnText, { color: category === c.label ? '#fff' : '#333' }]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.lbl}>Session Documentation</Text>
        <TextInput
          style={styles.input}
          placeholder="Document the clinical observations, progress, and future plan for this session..."
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
            Clinical Confidentiality: Note contents are only visible to you. The patient will NOT be notified or allowed to view these notes.
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
});
