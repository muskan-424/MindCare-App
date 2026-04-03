import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import api from '../utils/apiClient';
import { colors } from '../constants/theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const NOTE_CATEGORIES = {
    'Progress':   { color: '#4CAF50', icon: 'trending-up' },
    'Clinical':   { color: '#2196F3', icon: 'stethoscope' },
    'Crisis':     { color: '#F44336', icon: 'alert-decagram' },
    'Follow-up':  { color: '#FF9800', icon: 'calendar-clock' }
};

const TherapistPatientHistoryScreen = ({ route, navigation }) => {
  const { patientId, patientName } = route.params;
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      const res = await api.get(`/api/therapists/notes/${patientId}`);
      setNotes(res.data || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load session history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotes();
  };

  const handleDelete = (noteId) => {
    Alert.alert('Delete Note', 'Are you sure? This action cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
            try {
                await api.delete(`/api/therapists/notes/${noteId}`);
                loadNotes();
            } catch (e) {
                Alert.alert('Error', 'Failed to delete note.');
            }
        }}
    ]);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={26} color={colors.white} />
        </TouchableOpacity>
        <View style={{ marginLeft: 15, flex: 1 }}>
          <Text style={styles.headerTitle}>{patientName}</Text>
          <Text style={styles.headerSub}>Clinical Session History</Text>
        </View>
        <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddSessionNote', { patientId, patientName })}
        >
          <AntDesign name="plus" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="notebook-outline" size={80} color={colors.gray3} />
            <Text style={styles.emptyTitle}>No notes recorded yet</Text>
            <Text style={styles.emptySub}>Tap the + button to document your first session.</Text>
          </View>
        ) : (
          notes.map((note, index) => {
            const cat = NOTE_CATEGORIES[note.category] || NOTE_CATEGORIES.Progress;
            return (
              <View key={note._id} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                    <View style={[styles.catBadge, { backgroundColor: `${cat.color}15` }]}>
                        <MaterialCommunityIcons name={cat.icon} size={14} color={cat.color} />
                        <Text style={[styles.catText, { color: cat.color }]}>{note.category}</Text>
                    </View>
                    <Text style={styles.noteDate}>{new Date(note.sessionDate).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.noteContent}>{note.content}</Text>
                <View style={styles.noteFooter}>
                    <TouchableOpacity onPress={() => handleDelete(note._id)}>
                        <AntDesign name="delete" size={16} color={colors.gray} />
                    </TouchableOpacity>
                </View>
                {/* Timeline Line */}
                {index < notes.length - 1 && <View style={styles.timelineLine} />}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default TherapistPatientHistoryScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#2D3436',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  noteCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 2, position: 'relative' },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  catText: { fontSize: 11, fontWeight: 'bold' },
  noteDate: { fontSize: 12, color: colors.gray, fontWeight: '600' },
  noteContent: { fontSize: 14, color: '#333', lineHeight: 22 },
  noteFooter: { marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0', alignItems: 'flex-end' },
  timelineLine: { position: 'absolute', bottom: -24, left: 30, width: 2, height: 24, backgroundColor: '#D1D8E0' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#636E72', marginTop: 20 },
  emptySub: { fontSize: 14, color: '#95A5A6', textAlign: 'center', marginTop: 10, paddingHorizontal: 40 },
});
