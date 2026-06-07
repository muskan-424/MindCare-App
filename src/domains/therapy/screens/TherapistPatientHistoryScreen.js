import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Modal, Dimensions, TextInput
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import api from '../../../utils/apiClient';
import { colors } from '../../../constants/theme';
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
  const [fullProfile, setFullProfile] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editingNote, setEditingNote] = useState(null);  // { id, content, category }
  const [editContent, setEditContent] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [appointmentId, setAppointmentId] = useState(route.params?.appointmentId || null);
  const [completing, setCompleting] = useState(false);

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

  const fetchFullProfile = async () => {
    setProfileLoading(true);
    setProfileModalVisible(true);
    try {
      const res = await api.get(`/api/therapists/patient/${patientId}/profile`);
      setFullProfile(res.data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load full clinical profile.');
      setProfileModalVisible(false);
    }
    setProfileLoading(false);
  };

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

  const openEditNote = (note) => {
    setEditingNote(note);
    setEditContent(note.content);
  };

  const saveEditNote = async () => {
    if (!editContent.trim()) return Alert.alert('Required', 'Note content cannot be empty.');
    setEditSaving(true);
    try {
      await api.patch(`/api/therapists/notes/${editingNote._id}`, {
        content: editContent.trim(),
        category: editingNote.category,
      });
      setEditingNote(null);
      loadNotes();
    } catch (e) {
      Alert.alert('Error', 'Failed to update note.');
    } finally {
      setEditSaving(false);
    }
  };

  const markSessionComplete = async () => {
    if (!appointmentId) return Alert.alert('Info', 'No linked appointment ID found for this patient visit.');
    Alert.alert(
      'Mark as Complete',
      'Are you sure you want to mark this session as complete? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', onPress: async () => {
          setCompleting(true);
          try {
            await api.patch(`/api/appointments/${appointmentId}/complete`);
            Alert.alert('Done', 'Session marked as complete!');
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', e.response?.data?.error || 'Failed to complete session.');
          } finally {
            setCompleting(false);
          }
        }}
      ]
    );
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

      <TouchableOpacity style={styles.fullProfileBtn} onPress={fetchFullProfile}>
        <MaterialCommunityIcons name="clipboard-pulse-outline" size={20} color={colors.white} />
        <Text style={styles.fullProfileBtnText}>View Full AI & Clinical Profile</Text>
      </TouchableOpacity>

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
                    <TouchableOpacity onPress={() => openEditNote(note)} style={styles.noteAction}>
                        <AntDesign name="edit" size={16} color={colors.primary} />
                        <Text style={styles.noteActionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(note._id)} style={styles.noteAction}>
                        <AntDesign name="delete" size={16} color="#E74C3C" />
                        <Text style={[styles.noteActionText, { color: '#E74C3C' }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
                {/* Timeline Line */}
                {index < notes.length - 1 && <View style={styles.timelineLine} />}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Mark Complete Banner */}
      {appointmentId && (
        <TouchableOpacity
          style={[styles.completeBtn, completing && { opacity: 0.6 }]}
          onPress={markSessionComplete}
          disabled={completing}
        >
          <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
          <Text style={styles.completeBtnText}>
            {completing ? 'Marking Complete...' : 'Mark Session as Complete'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Edit Note Modal */}
      <Modal visible={!!editingNote} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '55%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Note</Text>
              <TouchableOpacity onPress={() => setEditingNote(null)}>
                <AntDesign name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.editInput}
              multiline
              value={editContent}
              onChangeText={setEditContent}
              textAlignVertical="top"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.saveEditBtn, editSaving && { opacity: 0.6 }]}
              onPress={saveEditNote}
              disabled={editSaving}
            >
              {editSaving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveEditBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full Profile Modal */}
      <Modal visible={profileModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Full Clinical Profile</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <AntDesign name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {profileLoading ? (
              <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : fullProfile ? (
              <ScrollView style={styles.modalScroll}>
                <View style={styles.profileSection}>
                  <Text style={styles.sectionTitle}>AI Assessments (Quad-Modal)</Text>
                  
                  {fullProfile.fusions?.length > 0 && (
                    <View style={{ marginVertical: 15 }}>
                      <Text style={[styles.sectionTitle, { fontSize: 13, color: '#2D3436' }]}>📈 Emotional Fingerprint Trend</Text>
                      <LineChart
                        data={{
                          labels: fullProfile.fusions.slice(-5).map((f, i) => `#${i + 1}`),
                          datasets: [{ data: fullProfile.fusions.slice(-5).map(f => Number(f.riskScore * 100)) }]
                        }}
                        width={Dimensions.get('window').width - 70}
                        height={180}
                        yAxisLabel=""
                        yAxisSuffix="%"
                        chartConfig={{
                          backgroundColor: '#ffffff',
                          backgroundGradientFrom: '#ffffff',
                          backgroundGradientTo: '#ffffff',
                          decimalPlaces: 0,
                          color: (opacity = 1) => `rgba(92, 58, 182, ${opacity})`,
                          labelColor: (opacity = 1) => `rgba(60, 64, 72, ${opacity})`,
                          style: { borderRadius: 16 },
                          propsForDots: { r: "5", strokeWidth: "2", stroke: "#5c3ab6" }
                        }}
                        bezier
                        style={{ marginVertical: 8, borderRadius: 16 }}
                      />
                    </View>
                  )}

                  {fullProfile.fusions?.length === 0 && <Text style={styles.emptyText}>No AI assessments found.</Text>}
                  {fullProfile.fusions?.map(f => (
                    <View key={f.id} style={styles.dataCard}>
                      <Text style={styles.dataTitle}>Risk Level: {f.riskLevel}</Text>
                      <Text style={styles.dataText}>Score: {(f.riskScore * 100).toFixed(0)}%</Text>
                      <Text style={styles.dataText}>Markers: {(f.aiMarkers || []).join(', ')}</Text>
                      <Text style={styles.dataDate}>{new Date(f.createdAt).toLocaleDateString()}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.profileSection}>
                  <Text style={styles.sectionTitle}>Risk Reports</Text>
                  {fullProfile.issues?.length === 0 && <Text style={styles.emptyText}>No risk reports found.</Text>}
                  {fullProfile.issues?.map(i => (
                    <View key={i.id} style={styles.dataCard}>
                      <Text style={styles.dataTitle}>{i.category} (Severity: {i.severity}/5)</Text>
                      <Text style={styles.dataText}>Risk: {i.riskLevel}</Text>
                      <Text style={styles.dataDate}>{new Date(i.createdAt).toLocaleDateString()}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.profileSection}>
                  <Text style={styles.sectionTitle}>Recent Moods</Text>
                  {fullProfile.moods?.length === 0 && <Text style={styles.emptyText}>No moods logged.</Text>}
                  {fullProfile.moods?.slice(0, 5).map(m => (
                    <View key={m.id} style={styles.dataCard}>
                      <Text style={styles.dataTitle}>Rating: {m.rating}/10</Text>
                      {m.note ? <Text style={styles.dataText}>Note: {m.note}</Text> : null}
                      <Text style={styles.dataDate}>{new Date(m.date).toLocaleDateString()}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.profileSection}>
                  <Text style={styles.sectionTitle}>Journal Entries</Text>
                  {(!fullProfile.journals || fullProfile.journals.length === 0) && (
                    <Text style={styles.emptyText}>No journal entries found.</Text>
                  )}
                  {fullProfile.journals?.slice(0, 5).map(j => (
                    <View key={j.id} style={[styles.dataCard, { borderLeftWidth: 3, borderLeftColor: colors.primary }]}>
                      <Text style={styles.dataTitle}>{j.title || 'Untitled Entry'}</Text>
                      <Text style={styles.dataText}>{j.contentPreview}</Text>
                      <Text style={styles.dataDate}>{new Date(j.date).toLocaleDateString()}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
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
  fullProfileBtn: { flexDirection: 'row', backgroundColor: '#3498DB', padding: 15, marginHorizontal: 20, marginTop: -15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 3 },
  fullProfileBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', height: '85%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalScroll: { flex: 1 },
  profileSection: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 10, textTransform: 'uppercase' },
  dataCard: { backgroundColor: '#F8F9F9', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#EAEDED' },
  dataTitle: { fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  dataText: { color: '#566573', fontSize: 13, marginBottom: 2 },
  dataDate: { color: '#99A3A4', fontSize: 11, marginTop: 4, textAlign: 'right' },
  emptyText: { color: '#99A3A4', fontStyle: 'italic' },
  noteAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  noteActionText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  completeBtn: {
    backgroundColor: '#2ECC71',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    margin: 16,
    padding: 16,
    borderRadius: 14,
    elevation: 4,
  },
  completeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  editInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E4E7ED',
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  saveEditBtn: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveEditBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
