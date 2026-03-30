import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { connect } from 'react-redux';
import api from '../utils/apiClient';
import { colors } from '../constants/theme';

const STATUS_COLORS = {
  awaiting_admin: '#9E9E9E',
  pending: '#FFB74D',
  confirmed: '#81C784',
  cancelled: '#E57373',
  completed: '#64B5F6',
};

const STATUS_CONFIG = {
  awaiting_admin: { icon: '👀', label: 'Under Admin Review', hint: 'Admin is checking therapist availability for you.' },
  pending:        { icon: '⏳', label: 'Pending Confirmation', hint: 'Therapist assigned. Awaiting final confirmation.' },
  confirmed:      { icon: '✅', label: 'Confirmed!', hint: 'Your session is set. See details below.' },
  cancelled:      { icon: '❌', label: 'Cancelled', hint: 'This appointment was cancelled.' },
  completed:      { icon: '🏁', label: 'Completed', hint: 'Session completed. Hope it helped! 💙' },
};

const FILTERS = ['all', 'awaiting_admin', 'confirmed', 'cancelled'];

const AppointmentsScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchAppointments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/api/appointments');
      setAppointments(res.data || []);
    } catch (e) {
      Alert.alert('Error', 'Could not load appointments.');
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const cancelRequest = async (id, status) => {
    const label = status === 'awaiting_admin' ? 'request' : 'appointment';
    Alert.alert(
      `Cancel ${label.charAt(0).toUpperCase() + label.slice(1)}`,
      `Are you sure you want to cancel this ${label}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
            try {
              await api.patch(`/api/appointments/${id}/cancel`);
              setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
            } catch (e) {
              Alert.alert('Error', e.response?.data?.error || 'Could not cancel.');
            }
          },
        },
      ]
    );
  };

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

  const renderItem = ({ item }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    return (
      <View style={[styles.card, { borderLeftColor: STATUS_COLORS[item.status] }]}>
        {/* Status row */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
            <Text style={styles.statusIcon}>{config.icon}</Text>
            <Text style={styles.statusText}>{config.label}</Text>
          </View>
          <Text style={styles.createdAt}>
            {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </View>

        <Text style={styles.statusHint}>{config.hint}</Text>

        {/* Request info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Request</Text>
          {item.requestedSpeciality ? <Text style={styles.detail}>👤 {item.requestedSpeciality}</Text> : null}
          {item.preferredTime ? <Text style={styles.detail}>🕐 {item.preferredTime} preference</Text> : null}
          {item.preferredDates?.length > 0 ? (
            <Text style={styles.detail}>📅 Preferred: {item.preferredDates.slice(0, 3).join(', ')}{item.preferredDates.length > 3 ? '...' : ''}</Text>
          ) : null}
          {item.userNote ? <Text style={styles.noteText}>📝 "{item.userNote}"</Text> : null}
        </View>

        {/* Confirmed session details */}
        {(item.status === 'confirmed' || item.status === 'completed') && item.therapistName ? (
          <View style={[styles.section, styles.confirmedSection]}>
            <Text style={styles.sectionTitle}>✅ Assigned Session</Text>
            <Text style={styles.therapistName}>{item.therapistName}</Text>
            {item.specialisation ? <Text style={styles.therapistSpec}>{item.specialisation}</Text> : null}
            <Text style={styles.detail}>📅 {item.date ? new Date(item.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</Text>
            <Text style={styles.detail}>🕐 {item.timeSlot || '—'}</Text>
            {item.adminNote ? <Text style={styles.adminNoteText}>💬 Admin note: {item.adminNote}</Text> : null}
          </View>
        ) : null}

        {/* Actions */}
        {(item.status === 'awaiting_admin' || item.status === 'pending') && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelRequest(item.id, item.status)}>
            <Text style={styles.cancelBtnText}>Cancel Request</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Appointments</Text>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <View style={[styles.filterDot, { backgroundColor: f === 'all' ? colors.secondary : STATUS_COLORS[f] }]} />
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'awaiting_admin' ? 'Pending' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🗓️</Text>
          <Text style={styles.emptyTitle}>{filter === 'all' ? 'No appointments yet' : `No ${filter} requests`}</Text>
          <Text style={styles.emptyText}>
            {filter === 'all' ? 'Submit a consultation request and our admin team will assign you a therapist.' : `You have no ${filter} appointments right now.`}
          </Text>
          {filter === 'all' && (
            <TouchableOpacity style={styles.newReqBtn} onPress={() => navigation.navigate('TherapistHome')}>
              <Text style={styles.newReqText}>Request a Consultation</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAppointments(true); }} colors={[colors.primary]} />}
        />
      )}
    </View>
  );
};

const mapStateToProps = state => ({ auth: state.auth });
export default connect(mapStateToProps)(AppointmentsScreen);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { backgroundColor: colors.primary, paddingTop: 48, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 16 },
  backText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.white },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexWrap: 'wrap' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, backgroundColor: colors.white, borderRadius: 20, elevation: 1, gap: 6 },
  filterChipActive: { backgroundColor: colors.secondary },
  filterDot: { width: 8, height: 8, borderRadius: 4 },
  filterText: { fontSize: 13, color: colors.secondary, fontWeight: '600' },
  filterTextActive: { color: colors.white },
  list: { padding: 16, paddingBottom: 60 },
  card: { backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 14, elevation: 2, borderLeftWidth: 5 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5 },
  statusIcon: { fontSize: 12 },
  statusText: { fontSize: 11, color: colors.white, fontWeight: '700' },
  createdAt: { fontSize: 11, color: colors.gray },
  statusHint: { fontSize: 12, color: colors.gray, marginBottom: 12 },
  section: { borderTopWidth: 1, borderTopColor: colors.gray3, paddingTop: 10, marginTop: 6 },
  confirmedSection: { backgroundColor: '#F1F8E9', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#A5D6A7', marginTop: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.gray, textTransform: 'uppercase', marginBottom: 6 },
  therapistName: { fontSize: 15, fontWeight: '800', color: colors.secondary },
  therapistSpec: { fontSize: 13, color: colors.gray, fontStyle: 'italic', marginBottom: 6 },
  detail: { fontSize: 13, color: colors.secondary, marginBottom: 2 },
  noteText: { fontSize: 13, color: colors.gray, fontStyle: 'italic', marginTop: 4 },
  adminNoteText: { fontSize: 13, color: colors.primary, fontStyle: 'italic', marginTop: 6 },
  cancelBtn: { marginTop: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E57373', borderRadius: 10, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: '#E57373', fontWeight: '600' },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.secondary, marginBottom: 8 },
  emptyText: { fontSize: 15, color: colors.gray, textAlign: 'center', marginBottom: 24 },
  newReqBtn: { backgroundColor: colors.secondary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24 },
  newReqText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
