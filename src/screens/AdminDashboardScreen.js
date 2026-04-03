import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ScrollView, ActivityIndicator, TextInput, Alert, Modal, Linking, Dimensions
} from 'react-native';
import api from '../utils/apiClient';
import { colors } from '../constants/theme';
import { LineChart, ContributionGraph } from 'react-native-chart-kit';

const ADMIN_TOKEN = 'CHANGE_ME_ADMIN_TOKEN';
const H = { headers: { 'x-admin-token': ADMIN_TOKEN } };

const RISK_COLORS = { LOW: '#81C784', MEDIUM: '#FFB74D', HIGH: '#E57373', CRITICAL: '#C62828' };
const ACTION_COLORS = { none: colors.gray, contacted: '#4FC3F7', referred: '#FFB74D', resolved: '#81C784' };

const PREDEFINED_RESOURCES = [
  { id: 'r1', title: 'Managing Severe Anxiety Patterns', type: 'article', url: 'https://mindcare.example.com/r/anxiety-patterns' },
  { id: 'r2', title: 'Guided Grounding Meditation (10 mins)', type: 'video', url: 'https://mindcare.example.com/r/grounding-meditation' },
  { id: 'r3', title: 'Crisis Coping Worksheet', type: 'exercise', url: 'https://mindcare.example.com/r/crisis-worksheet' },
  { id: 'r4', title: 'Sleep Hygiene Refresher', type: 'article', url: 'https://mindcare.example.com/r/sleep-hygiene' },
];

// ─── Pending Verification Tab ───────────────────────────────────────────────
const PendingTab = () => {
  const [data, setData] = useState({ appointmentRequests: [], riskReports: [], pendingContacts: [], wellnessPlans: [], deletionRequests: [], totalPending: 0, escalatedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [therapists, setTherapists] = useState([]);

  // Assign modal state
  const [assignModal, setAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignTherapist, setAssignTherapist] = useState(null);
  const [assignDate, setAssignDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [assignSlot, setAssignSlot] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Verify report modal state
  const [verifyModal, setVerifyModal] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [verifyNote, setVerifyNote] = useState('');
  const [verifyAction, setVerifyAction] = useState('contacted');
  const [verifyResources, setVerifyResources] = useState([]);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // EC verification modal state
  const [ecModal, setEcModal] = useState(false);
  const [ecTarget, setEcTarget] = useState(null);
  const [ecNote, setEcNote] = useState('');
  const [ecLoading, setEcLoading] = useState(false);

  // Crisis call modal state
  const [callModal, setCallModal] = useState(false);
  const [callTarget, setCallTarget] = useState(null);  // { userId, contactName, phone, userMessage }
  const [callOutcome, setCallOutcome] = useState('reached');
  const [callNote, setCallNote] = useState('');
  const [callLoading, setCallLoading] = useState(false);

  // Wellness Plan Builder modal state
  const [planModal, setPlanModal] = useState(false);
  const [planTarget, setPlanTarget] = useState(null);
  const [planFocus, setPlanFocus] = useState('');
  const [planNote, setPlanNote] = useState('');
  const [planTasks, setPlanTasks] = useState([{ dayNumber: 1, title: 'Deep Breathing', type: 'breathing', description: 'Take 5 minutes to focus on your breath.' }]);
  const [planLoading, setPlanLoading] = useState(false);

  // Deletion Request modal state
  const [delModal, setDelModal] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [delNote, setDelNote] = useState('');
  const [delLoading, setDelLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendRes, therapistsRes] = await Promise.all([
        api.get('/api/admin/pending-verification', H),
        api.get('/api/therapists'),
      ]);
      setData(pendRes.data);
      setTherapists(therapistsRes.data || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load pending items.');
    }
    setLoading(false);
  }, []);

  const runSLACheck = async () => {
    try {
      await api.post('/api/admin/sla/run', {}, H);
      Alert.alert('SLA Check Complete', 'Escalated reports have been flagged.');
      load();
    } catch (e) {
      Alert.alert('Error', 'Failed to run SLA check.');
    }
  };

  useEffect(() => { load(); }, [load]);

  const checkSlots = async () => {
    if (!assignTherapist || !assignDate) return;
    setSlotsLoading(true);
    setAvailableSlots([]);
    setAssignSlot('');
    try {
      const res = await api.get('/api/admin/therapist-availability', {
        ...H,
        params: { therapistId: assignTherapist.id, date: assignDate },
      });
      setAvailableSlots(res.data.available || []);
    } catch (e) {
      Alert.alert('Error', 'Could not fetch availability.');
    }
    setSlotsLoading(false);
  };

  const confirmAssign = async () => {
    if (!assignTherapist || !assignDate || !assignSlot) {
      Alert.alert('Incomplete', 'Select therapist, date, and time slot.');
      return;
    }
    setAssignLoading(true);
    try {
      await api.post(`/api/admin/appointments/${assignTarget.id}/assign`, {
        therapistId: assignTherapist.id,
        date: assignDate,
        timeSlot: assignSlot,
        adminNote: assignNote,
      }, H);
      Alert.alert('✅ Assigned!', `${assignTarget.userName}'s session confirmed with ${assignTherapist.name} on ${assignDate} at ${assignSlot}.`);
      setAssignModal(false);
      load();
    } catch (e) {
      Alert.alert('Failed', e.response?.data?.error || 'Could not assign.');
    }
    setAssignLoading(false);
  };

  const confirmVerify = async () => {
    setVerifyLoading(true);
    try {
      await api.patch(`/api/admin/issues/${verifyTarget.id}/verify`, {
        adminNote: verifyNote.trim(), 
        adminAction: verifyAction,
        assignedResources: verifyResources
      }, H);
      Alert.alert('✅ Verified', `Report marked as "${verifyAction}".`);
      setVerifyModal(false);
      load();
    } catch (e) {
      Alert.alert('Failed', 'Could not verify report.');
    }
    setVerifyLoading(false);
  };

  const confirmVerifyEC = async (action) => {
    setEcLoading(true);
    try {
      const endpoint = action === 'verify'
        ? `/api/admin/emergency-contacts/${ecTarget.id}/verify`
        : `/api/admin/emergency-contacts/${ecTarget.id}/reject`;
      const body = action === 'verify' ? { adminNote: ecNote } : { rejectionReason: ecNote };
      await api.patch(endpoint, body, H);
      Alert.alert(action === 'verify' ? '✅ Verified' : '❌ Rejected', `Emergency contact for ${ecTarget.userName} has been ${action === 'verify' ? 'verified' : 'rejected'}.`);
      setEcModal(false);
      load();
    } catch (e) {
      Alert.alert('Failed', 'Could not process EC verification.');
    }
    setEcLoading(false);
  };

  const openCallModal = async (userId) => {
    try {
      const res = await api.get(`/api/admin/emergency-contacts/${userId}`, H);
      if (res.data.exists) {
        setCallTarget({ ...res.data, userId });
        setCallOutcome('reached');
        setCallNote('');
        setCallModal(true);
      } else {
        Alert.alert('No Contact', 'This user has no verified emergency contact on file.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not load emergency contact.');
    }
  };

  const logCall = async () => {
    setCallLoading(true);
    try {
      await api.post(`/api/admin/emergency-contacts/${callTarget.userId}/log-call`, {
        outcome: callOutcome, adminNote: callNote, triggeredBy: verifyTarget?.id || '',
      }, H);
      Alert.alert('📋 Logged', 'Call outcome saved to audit trail.');
      setCallModal(false);
    } catch (e) {
      Alert.alert('Error', 'Could not log call outcome.');
    }
    setCallLoading(false);
  };

  const assignPlan = async () => {
    if (!planFocus) return Alert.alert('Error', 'Please provide a Plan Focus.');
    setPlanLoading(true);
    try {
      // Group tasks by day to match backend DailyPlanSchema
      const grouped = {};
      planTasks.forEach(t => {
        if (!grouped[t.dayNumber]) grouped[t.dayNumber] = [];
        grouped[t.dayNumber].push(t);
      });
      const dailyPlans = Object.keys(grouped).map(dayStr => ({
        dayNumber: parseInt(dayStr, 10),
        tasks: grouped[dayStr]
      }));

      await api.post(`/api/admin/wellness-plans/${planTarget.id}/assign`, {
        planFocus,
        adminNote: planNote,
        dailyPlans
      }, H);
      Alert.alert('✅ Plan Assigned', `Wellness plan sent to ${planTarget.userName}`);
      setPlanModal(false);
      load();
    } catch (e) {
      Alert.alert('Error', 'Failed to assign plan.');
    }
    setPlanLoading(false);
  };

  const updateTask = (index, field, value) => {
    const updated = [...planTasks];
    updated[index][field] = value;
    setPlanTasks(updated);
  };

  const reviewDeletion = async (action) => {
    setDelLoading(true);
    try {
      await api.patch(`/api/admin/deletion-requests/${delTarget.id}/review`, {
        action,
        adminNote: delNote
      }, H);
      Alert.alert(action === 'approve' ? '✅ Approved' : '❌ Rejected', `Deletion request has been ${action}d.`);
      setDelModal(false);
      load();
    } catch (e) {
      Alert.alert('Error', 'Failed to process deletion request.');
    }
    setDelLoading(false);
  };

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <ScrollView contentContainerStyle={styles.pendingScroll}>
      {/* SLA Escalation Alert Banner */}
      {data.escalatedCount > 0 && (
        <View style={styles.escalationBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.escalationBannerIcon}>🚨</Text>
            <Text style={styles.escalationBannerTitle}>
              SLA BREACH — {data.escalatedCount} REPORT{data.escalatedCount !== 1 ? 'S' : ''} OVERDUE
            </Text>
          </View>
          <Text style={styles.escalationBannerText}>
            These HIGH/CRITICAL reports exceeded the response time window. Immediate action required.
          </Text>
          <TouchableOpacity style={styles.slaRunBtn} onPress={runSLACheck}>
            <Text style={styles.slaRunBtnText}>↻ Re-run SLA Check</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Badge count */}
      <View style={styles.pendingBanner}>
        <Text style={styles.pendingBannerText}>🔔 {data.totalPending} item{data.totalPending !== 1 ? 's' : ''} need your attention</Text>
      </View>

      {/* ── Appointment Requests ── */}
      <Text style={styles.pendingSectionTitle}>📋 Consultation Requests ({data.appointmentRequests.length})</Text>
      {data.appointmentRequests.length === 0 ? (
        <Text style={styles.emptyHint}>No pending appointment requests. 🎉</Text>
      ) : data.appointmentRequests.map(req => (
        <View key={req.id} style={[styles.pendingCard, { borderLeftColor: '#9E9E9E' }]}>
          <View style={styles.pendingCardHeader}>
            <Text style={styles.pendingUser}>👤 {req.userName}</Text>
            <Text style={styles.pendingTime}>{new Date(req.createdAt).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.pendingDetail}>🎯 Specialist: <Text style={styles.bold}>{req.requestedSpeciality || 'Any'}</Text></Text>
          <Text style={styles.pendingDetail}>🕐 Time pref: <Text style={styles.bold}>{req.preferredTime || 'Any'}</Text></Text>
          {req.preferredDates?.length > 0 && (
            <Text style={styles.pendingDetail}>📅 Prefers: {req.preferredDates.join(', ')}</Text>
          )}
          {req.userNote ? <Text style={styles.userNoteText}>"{req.userNote}"</Text> : null}
          <TouchableOpacity
            style={styles.assignBtn}
            onPress={() => { setAssignTarget(req); setAssignModal(true); setAssignTherapist(null); setAssignDate(''); setAvailableSlots([]); setAssignSlot(''); setAssignNote(''); }}
          >
            <Text style={styles.assignBtnText}>Assign Therapist & Confirm →</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* ── Risk Reports ── */}
      <Text style={styles.pendingSectionTitle}>⚠️ Unverified Risk Reports ({data.riskReports.length})</Text>
      {data.riskReports.length === 0 ? (
        <Text style={styles.emptyHint}>No unverified HIGH/CRITICAL reports. 🎉</Text>
      ) : data.riskReports.map(rep => (
        <View key={rep.id} style={[styles.pendingCard, { borderLeftColor: rep.escalated ? '#B71C1C' : RISK_COLORS[rep.riskLevel], borderLeftWidth: rep.escalated ? 6 : 4 }]}>
          {rep.escalated && (
            <View style={styles.escalatedStrip}>
              <Text style={styles.escalatedStripText}>🚨 SLA BREACHED — {rep.slaBreachMinutes}min overdue</Text>
            </View>
          )}
          <View style={styles.pendingCardHeader}>
            <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[rep.riskLevel] }]}>
              <Text style={styles.riskBadgeText}>{rep.riskLevel}</Text>
            </View>
            <Text style={styles.pendingTime}>{new Date(rep.createdAt).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.pendingUser}>👤 {rep.userName} · {rep.userEmail}</Text>
          <Text style={styles.pendingDetail}>Category: <Text style={styles.bold}>{rep.category?.replace(/_/g, ' ')}</Text> · Severity {rep.severity}/5</Text>
          {rep.description ? <Text style={styles.userNoteText}>"{rep.description}"</Text> : null}
          {rep.emotionTags?.length > 0 && <Text style={styles.pendingDetail}>Emotions: {rep.emotionTags.join(', ')}</Text>}
          {rep.safetyTriggered && <Text style={[styles.pendingDetail, { color: '#C62828', fontWeight: '700' }]}>🚨 Safety response triggered</Text>}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.assignBtn, { flex: 1, backgroundColor: rep.escalated ? '#B71C1C' : RISK_COLORS[rep.riskLevel], marginTop: 0 }]}
              onPress={() => { setVerifyTarget(rep); setVerifyNote(''); setVerifyAction('contacted'); setVerifyResources([]); setVerifyModal(true); }}
            >
              <Text style={styles.assignBtnText}>{rep.escalated ? '🚨 URGENT: Review Now' : 'Review & Action'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.assignBtn, { flex: 1, backgroundColor: '#C62828', marginTop: 0 }]}
              onPress={() => { setVerifyTarget(rep); openCallModal(rep.userId); }}
            >
              <Text style={styles.assignBtnText}>📞 Emergency Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}


      {/* ── Emergency Contacts Awaiting Verification ── */}
      <Text style={styles.pendingSectionTitle}>🆘 Emergency Contacts ({(data.pendingContacts || []).length})</Text>
      {(data.pendingContacts || []).length === 0 ? (
        <Text style={styles.emptyHint}>No emergency contacts pending verification. 🎉</Text>
      ) : (data.pendingContacts || []).map(ec => (
        <View key={ec.id} style={[styles.pendingCard, { borderLeftColor: '#C62828' }]}>
          <View style={styles.pendingCardHeader}>
            <View style={styles.ecBadge}><Text style={styles.ecBadgeText}>🆘 EC</Text></View>
            <Text style={styles.pendingTime}>{new Date(ec.createdAt).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.pendingUser}>👤 {ec.userName} · {ec.userEmail}</Text>
          <Text style={styles.pendingDetail}>Contact: <Text style={styles.bold}>{ec.contactName}</Text> ({ec.relationship})</Text>
          <Text style={styles.pendingDetail}>📞 {ec.phone} · via {ec.reachVia}</Text>
          {ec.userMessage ? <Text style={styles.userNoteText}>Context: "{ec.userMessage}"</Text> : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.assignBtn, { flex: 1, backgroundColor: '#81C784' }]}
              onPress={() => { setEcTarget(ec); setEcNote(''); setEcModal(true); }}
            >
              <Text style={styles.assignBtnText}>✅ Verify / ❌ Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* ── Wellness Plans Awaiting Setup ── */}
      <Text style={styles.pendingSectionTitle}>🧘 Wellness Plan Requests ({(data.wellnessPlans || []).length})</Text>
      {(data.wellnessPlans || []).length === 0 ? (
        <Text style={styles.emptyHint}>No wellness plan requests pending. 🎉</Text>
      ) : (data.wellnessPlans || []).map(wp => (
        <View key={wp.id} style={[styles.pendingCard, { borderLeftColor: '#81C784' }]}>
          <View style={styles.pendingCardHeader}>
            <View style={[styles.ecBadge, { backgroundColor: '#81C784' }]}><Text style={styles.ecBadgeText}>🧘 PLAN</Text></View>
            <Text style={styles.pendingTime}>{new Date(wp.createdAt).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.pendingUser}>👤 {wp.userName} · {wp.userEmail}</Text>
          <Text style={styles.pendingDetail}>Goals: <Text style={styles.bold}>{(wp.goals || []).join(', ')}</Text></Text>
          <Text style={styles.pendingDetail}>Pace: <Text style={styles.bold}>{wp.preferredPace}</Text></Text>
          {wp.currentStruggles ? <Text style={styles.userNoteText}>Struggles: "{wp.currentStruggles}"</Text> : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.assignBtn, { flex: 1, backgroundColor: '#81C784' }]}
              onPress={() => {
                setPlanTarget(wp);
                setPlanFocus(`30-Day Plan: ${(wp.goals || [])[0] || 'Wellness'}`);
                setPlanNote(`Hello ${wp.userName}, I reviewed your goals and created this routine for you.`);
                setPlanTasks([{ dayNumber: 1, title: 'Deep Breathing', type: 'breathing', description: 'Take 5 minutes to focus on your breath.' }]);
                setPlanModal(true);
              }}
            >
              <Text style={styles.assignBtnText}>🛠️ Build & Assign Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* ── Deletion Requests Awaiting Review ── */}
      <Text style={styles.pendingSectionTitle}>🗑️ Account Deletion Requests ({(data.deletionRequests || []).length})</Text>
      {(data.deletionRequests || []).length === 0 ? (
        <Text style={styles.emptyHint}>No deletion requests pending. 🎉</Text>
      ) : (data.deletionRequests || []).map(del => (
        <View key={del.id} style={[styles.pendingCard, { borderLeftColor: '#E57373' }]}>
          <View style={styles.pendingCardHeader}>
            <View style={[styles.ecBadge, { backgroundColor: '#E57373' }]}><Text style={styles.ecBadgeText}>🗑️ DELETE</Text></View>
            <Text style={styles.pendingTime}>{new Date(del.createdAt).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.pendingUser}>👤 {del.userName} · {del.userEmail}</Text>
          <Text style={styles.pendingDetail}>Reason for leaving: <Text style={styles.bold}>{del.reason}</Text></Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.assignBtn, { flex: 1, backgroundColor: '#E57373' }]}
              onPress={() => {
                setDelTarget(del);
                setDelNote('');
                setDelModal(true);
              }}
            >
              <Text style={styles.assignBtnText}>Review Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* ── Assign Modal ── */}
      <Modal visible={assignModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Therapist</Text>
            {assignTarget && (
              <Text style={styles.modalSubtitle}>For: {assignTarget.userName} · needs {assignTarget.requestedSpeciality || 'any specialist'}</Text>
            )}

            <Text style={styles.modalLabel}>1. Select Therapist</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {therapists
                .filter(t => !assignTarget?.requestedSpeciality || assignTarget.requestedSpeciality === 'Any' || t.specialisation === assignTarget.requestedSpeciality)
                .map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.therapistChip, assignTherapist?.id === t.id && styles.therapistChipActive]}
                    onPress={() => { setAssignTherapist(t); setAvailableSlots([]); setAssignSlot(''); }}
                  >
                    <Text style={[styles.therapistChipText, assignTherapist?.id === t.id && styles.therapistChipTextActive]}>{t.name}</Text>
                    <Text style={[styles.therapistSpecText, assignTherapist?.id === t.id && { color: 'rgba(255,255,255,0.8)' }]}>{t.specialisation}</Text>
                  </TouchableOpacity>
                ))
              }
            </ScrollView>

            <Text style={styles.modalLabel}>2. Choose a Date</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="YYYY-MM-DD"
              value={assignDate}
              onChangeText={setAssignDate}
              placeholderTextColor={colors.gray}
            />

            <TouchableOpacity style={styles.checkSlotsBtn} onPress={checkSlots} disabled={!assignTherapist || !assignDate}>
              {slotsLoading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.checkSlotsBtnText}>Check Available Slots</Text>}
            </TouchableOpacity>

            {availableSlots.length > 0 && (
              <>
                <Text style={styles.modalLabel}>3. Pick a Time Slot</Text>
                <View style={styles.slotsGrid}>
                  {availableSlots.map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.slotBtn, assignSlot === s && styles.slotBtnActive]}
                      onPress={() => setAssignSlot(s)}
                    >
                      <Text style={[styles.slotText, assignSlot === s && styles.slotTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            {assignTherapist && assignDate && availableSlots.length === 0 && !slotsLoading && (
              <Text style={styles.noSlotsHint}>No available slots for this date. Try another date.</Text>
            )}

            <Text style={styles.modalLabel}>4. Note for User (optional)</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 60 }]}
              placeholder="e.g. Please join 5 mins early..."
              value={assignNote}
              onChangeText={setAssignNote}
              multiline
              placeholderTextColor={colors.gray}
            />

            <TouchableOpacity style={styles.confirmAssignBtn} onPress={confirmAssign} disabled={assignLoading}>
              {assignLoading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.confirmAssignBtnText}>✅ Confirm & Assign</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setAssignModal(false)}>
              <Text style={styles.cancelModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Verify Report Modal ── */}
      <Modal visible={verifyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ Review Risk Report</Text>
            {verifyTarget && (
              <>
                <Text style={styles.modalSubtitle}>{verifyTarget.userName} · {verifyTarget.riskLevel} RISK</Text>
                {verifyTarget.description ? <Text style={styles.userNoteText}>"{verifyTarget.description}"</Text> : null}
              </>
            )}

            <Text style={styles.modalLabel}>Action Taken</Text>
            <View style={styles.actionRow}>
              {['contacted', 'referred', 'resolved'].map(act => (
                <TouchableOpacity
                  key={act}
                  style={[styles.actionChip, verifyAction === act && { backgroundColor: ACTION_COLORS[act] }]}
                  onPress={() => setVerifyAction(act)}
                >
                  <Text style={[styles.actionChipText, verifyAction === act && { color: colors.white }]}>{act.charAt(0).toUpperCase() + act.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Attach Resources (optional)</Text>
            <View style={{ marginBottom: 16 }}>
              {PREDEFINED_RESOURCES.map(res => {
                const isSelected = verifyResources.some(vr => vr.id === res.id);
                return (
                  <TouchableOpacity
                    key={res.id}
                    style={{
                      flexDirection: 'row', alignItems: 'center', padding: 10,
                      backgroundColor: isSelected ? '#E8F5E9' : colors.cream,
                      borderRadius: 8, marginBottom: 8, borderWidth: 1,
                      borderColor: isSelected ? '#81C784' : colors.gray3
                    }}
                    onPress={() => {
                      if (isSelected) setVerifyResources(verifyResources.filter(vr => vr.id !== res.id));
                      else setVerifyResources([...verifyResources, res]);
                    }}
                  >
                    <Text style={{ flex: 1, fontSize: 13, color: colors.secondary, fontWeight: isSelected ? '700' : '500' }}>
                      {res.type.toUpperCase()}: {res.title}
                    </Text>
                    {isSelected && <Text style={{ fontSize: 16 }}>✅</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modalLabel}>Admin Note</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 80 }]}
              placeholder="Document what action was taken..."
              value={verifyNote}
              onChangeText={setVerifyNote}
              multiline
              placeholderTextColor={colors.gray}
            />

            <TouchableOpacity style={styles.confirmAssignBtn} onPress={confirmVerify} disabled={verifyLoading}>
              {verifyLoading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.confirmAssignBtnText}>Save & Mark Verified</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setVerifyModal(false)}>
              <Text style={styles.cancelModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
      {/* ── EC Verify Modal ── */}
      <Modal visible={ecModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>🆘 Verify Emergency Contact</Text>
            {ecTarget && (
              <>
                <Text style={styles.modalSubtitle}>From: {ecTarget.userName}</Text>
                <View style={styles.ecDetailBox}>
                  <Text style={styles.ecDetailLine}>Contact: <Text style={{ fontWeight: '700' }}>{ecTarget.contactName}</Text> ({ecTarget.relationship})</Text>
                  <Text style={styles.ecDetailLine}>📞 {ecTarget.phone}</Text>
                  <Text style={styles.ecDetailLine}>Reach via: {ecTarget.reachVia}</Text>
                  {ecTarget.userMessage ? <Text style={styles.ecDetailLine}>Context: "{ecTarget.userMessage}"</Text> : null}
                </View>
              </>
            )}
            <Text style={styles.modalLabel}>Admin Note (optional)</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 60 }]}
              placeholder="Any note about this verification..."
              value={ecNote}
              onChangeText={setEcNote}
              multiline
              placeholderTextColor={colors.gray}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.confirmAssignBtn, { flex: 1, backgroundColor: '#81C784' }]}
                onPress={() => confirmVerifyEC('verify')}
                disabled={ecLoading}
              >
                {ecLoading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.confirmAssignBtnText}>✅ Verify</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmAssignBtn, { flex: 1, backgroundColor: '#E57373' }]}
                onPress={() => confirmVerifyEC('reject')}
                disabled={ecLoading}
              >
                <Text style={styles.confirmAssignBtnText}>❌ Reject</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setEcModal(false)}>
              <Text style={styles.cancelModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Crisis Call Modal ── */}
      <Modal visible={callModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: '#C62828' }]}>🚨 Emergency Call</Text>
            {callTarget && (
              <>
                <View style={styles.crisisContactBox}>
                  <Text style={styles.crisisContactName}>{callTarget.contactName}</Text>
                  <Text style={styles.crisisContactRel}>{callTarget.relationship}</Text>
                  <Text style={styles.crisisContactPhone}>{callTarget.phone}</Text>
                  {callTarget.userMessage ? (
                    <View style={styles.crisisNoteBox}>
                      <Text style={styles.crisisNoteLabel}>📝 User's context note:</Text>
                      <Text style={styles.crisisNoteText}>"{callTarget.userMessage}"</Text>
                    </View>
                  ) : null}
                  {callTarget.callLogCount > 0 && (
                    <Text style={styles.crisisCallCount}>Called {callTarget.callLogCount} time(s) before</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.dialBtn}
                  onPress={() => Linking.openURL(`tel:${callTarget.phone}`).catch(() => Alert.alert('Error', 'Could not open dialer.'))}
                >
                  <Text style={styles.dialBtnText}>📞 Open Phone Dialer</Text>
                </TouchableOpacity>
                <Text style={styles.modalLabel}>Log Call Outcome</Text>
                <View style={styles.actionRow}>
                  {['reached', 'no_answer', 'voicemail', 'referred'].map(o => (
                    <TouchableOpacity
                      key={o}
                      style={[styles.actionChip, callOutcome === o && { backgroundColor: '#C62828' }]}
                      onPress={() => setCallOutcome(o)}
                    >
                      <Text style={[styles.actionChipText, callOutcome === o && { color: colors.white }]}>
                        {o.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.modalLabel}>Note</Text>
                <TextInput
                  style={[styles.modalInput, { minHeight: 60 }]}
                  placeholder="e.g. Spoke with mother, she will visit user..."
                  value={callNote}
                  onChangeText={setCallNote}
                  multiline
                  placeholderTextColor={colors.gray}
                />
                <TouchableOpacity style={styles.confirmAssignBtn} onPress={logCall} disabled={callLoading}>
                  {callLoading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.confirmAssignBtnText}>📋 Save to Audit Trail</Text>}
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setCallModal(false)}>
              <Text style={styles.cancelModalBtnText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Wellness Plan Builder Modal ── */}
      <Modal visible={planModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: '#81C784' }]}>🛠️ Build Wellness Plan</Text>
            {planTarget && (
              <>
                <Text style={styles.modalSubtitle}>For: {planTarget.userName}</Text>
                
                <Text style={styles.modalLabel}>Plan Focus</Text>
                <TextInput
                  style={styles.modalInput}
                  value={planFocus}
                  onChangeText={setPlanFocus}
                  placeholderTextColor={colors.gray}
                />

                <Text style={styles.modalLabel}>Personal Note</Text>
                <TextInput
                  style={[styles.modalInput, { minHeight: 60 }]}
                  value={planNote}
                  onChangeText={setPlanNote}
                  multiline
                  placeholderTextColor={colors.gray}
                />

                <Text style={styles.modalLabel}>Tasks Overview</Text>
                {planTasks.map((t, i) => (
                  <View key={i} style={[styles.planTaskItem, { padding: 10, backgroundColor: colors.cream, marginVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.gray3 }]}>
                    <Text style={styles.planTaskHeader}>Day {t.dayNumber}</Text>
                    <TextInput 
                      style={[styles.modalInput, { marginBottom: 4 }]} 
                      placeholder="Title" 
                      value={t.title} 
                      onChangeText={(val) => updateTask(i, 'title', val)} 
                    />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput 
                        style={[styles.modalInput, { flex: 1, marginBottom: 4 }]} 
                        placeholder="Type (e.g. breathing)" 
                        value={t.type} 
                        onChangeText={(val) => updateTask(i, 'type', val)} 
                      />
                      <TextInput 
                        style={[styles.modalInput, { flex: 1, marginBottom: 4 }]} 
                        placeholder="Day Number" 
                        keyboardType="numeric"
                        value={String(t.dayNumber)} 
                        onChangeText={(val) => updateTask(i, 'dayNumber', parseInt(val || '1', 10))} 
                      />
                    </View>
                    <TextInput 
                      style={[styles.modalInput, { minHeight: 40, marginBottom: 4 }]} 
                      placeholder="Description" 
                      value={t.description} 
                      onChangeText={(val) => updateTask(i, 'description', val)} 
                      multiline 
                    />
                    <TouchableOpacity onPress={() => setPlanTasks(planTasks.filter((_, idx) => idx !== i))}>
                      <Text style={{color: '#C62828', fontSize: 13, marginTop: 5, textAlign: 'right'}}>Remove Task</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                
                <TouchableOpacity 
                  style={styles.addTaskBtn} 
                  onPress={() => {
                    const nextDay = planTasks.length > 0 ? planTasks[planTasks.length - 1].dayNumber + 1 : 1;
                    setPlanTasks([...planTasks, { dayNumber: nextDay, title: '', type: 'journal', description: '' }]);
                  }}
                >
                  <Text style={styles.addTaskBtnText}>+ Add Custom Task</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.confirmAssignBtn, { backgroundColor: '#81C784', marginTop: 24 }]} onPress={assignPlan} disabled={planLoading}>
                  {planLoading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.confirmAssignBtnText}>✅ Publish Plan</Text>}
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setPlanModal(false)}>
              <Text style={styles.cancelModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Delete Request Modal ── */}
      <Modal visible={delModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>🗑️ Review Deletion Request</Text>
            {delTarget && (
              <>
                <Text style={styles.modalSubtitle}>User: {delTarget.userName}</Text>
                <View style={styles.ecDetailBox}>
                  <Text style={styles.ecDetailLine}>Reason: {delTarget.reason}</Text>
                </View>
                <Text style={styles.modalLabel}>Admin Note</Text>
                <TextInput
                  style={[styles.modalInput, { minHeight: 60 }]}
                  placeholder="Note for audit log..."
                  value={delNote}
                  onChangeText={setDelNote}
                  multiline
                  placeholderTextColor={colors.gray}
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.confirmAssignBtn, { flex: 1, backgroundColor: '#E57373' }]}
                    onPress={() => reviewDeletion('approve')}
                    disabled={delLoading}
                  >
                    {delLoading ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.confirmAssignBtnText}>Approve (Delete Data)</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmAssignBtn, { flex: 1, backgroundColor: '#9E9E9E' }]}
                    onPress={() => reviewDeletion('reject')}
                    disabled={delLoading}
                  >
                    <Text style={styles.confirmAssignBtnText}>Reject Request</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setDelModal(false)}>
              <Text style={styles.cancelModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

// ─── Groups Tab ──────────────────────────────────────────────────────────────
const GroupsTab = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create Modal
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', scheduledDate: '', meetingLink: '', maxParticipants: '10' });
  const [saving, setSaving] = useState(false);

  // Assign Modal
  const [assignModal, setAssignModal] = useState(false);
  const [targetGroup, setTargetGroup] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const gRes = await api.get('/api/groups/admin', H);
      setGroups(gRes.data || []);
      const uRes = await api.get('/api/admin/users', H);
      setUsers(uRes.data || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load groups');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.scheduledDate || !form.meetingLink) {
      return Alert.alert('Error', 'Missing required fields.');
    }
    setSaving(true);
    try {
      await api.post('/api/groups', {
        ...form,
        maxParticipants: parseInt(form.maxParticipants, 10) || 10
      }, H);
      setCreateModal(false);
      setForm({ title: '', description: '', scheduledDate: '', meetingLink: '', maxParticipants: '10' });
      load();
    } catch (e) {
      Alert.alert('Error', 'Failed to create group session.');
    }
    setSaving(false);
  };

  const handleAssign = async () => {
    if (!selectedUser || !targetGroup) return;
    try {
        const id = targetGroup._id || targetGroup.id;
      await api.patch(`/api/groups/${id}/assign`, { userId: selectedUser.id }, H);
      Alert.alert('Success', 'User assigned to group.');
      setAssignModal(false);
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to assign user.');
    }
  };

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <ScrollView contentContainerStyle={styles.pendingScroll}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={styles.sectionTitle}>Group Sessions</Text>
        <TouchableOpacity style={styles.tabBtnActive} onPress={() => setCreateModal(true)}>
          <Text style={styles.tabTextActive}>+ Create New</Text>
        </TouchableOpacity>
      </View>

      {groups.length === 0 ? <Text style={styles.emptyHint}>No group sessions found.</Text> : groups.map(g => (
        <View key={g._id || g.id} style={[styles.pendingCard, { borderLeftColor: colors.primary }]}>
          <Text style={{fontWeight: 'bold', fontSize: 16, marginBottom: 4}}>{g.title}</Text>
          <Text style={styles.pendingDetail}>{g.description}</Text>
          <Text style={[styles.pendingDetail, {marginTop: 6}]}>📅 {new Date(g.scheduledDate).toLocaleString()}</Text>
          <Text style={styles.pendingDetail}>Participants: {g.participants?.length || 0} / {g.maxParticipants}</Text>
          <TouchableOpacity style={[styles.assignBtn, { backgroundColor: colors.primary }]} onPress={() => { setTargetGroup(g); setSelectedUser(null); setAssignModal(true); }}>
            <Text style={styles.assignBtnText}>Assign User</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Create Modal */}
      <Modal visible={createModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Group Session</Text>
            <TextInput style={[styles.modalInput, {color: '#000'}]} placeholder="Title" placeholderTextColor={colors.gray} value={form.title} onChangeText={t => setForm({...form, title: t})} />
            <TextInput style={[styles.modalInput, {minHeight:60, color: '#000'}]} placeholder="Description" placeholderTextColor={colors.gray} multiline value={form.description} onChangeText={t => setForm({...form, description: t})} />
            <TextInput style={[styles.modalInput, {color: '#000'}]} placeholder="Scheduled Date (YYYY-MM-DDTHH:MM)" placeholderTextColor={colors.gray} value={form.scheduledDate} onChangeText={t => setForm({...form, scheduledDate: t})} />
            <TextInput style={[styles.modalInput, {color: '#000'}]} placeholder="Meeting Link (URL)" placeholderTextColor={colors.gray} value={form.meetingLink} onChangeText={t => setForm({...form, meetingLink: t})} />
            <TextInput style={[styles.modalInput, {color: '#000'}]} placeholder="Max Participants" placeholderTextColor={colors.gray} keyboardType="numeric" value={form.maxParticipants} onChangeText={t => setForm({...form, maxParticipants: t})} />
            
            <TouchableOpacity style={styles.confirmAssignBtn} onPress={handleCreate} disabled={saving}>
              {saving ? <ActivityIndicator color="white"/> : <Text style={styles.confirmAssignBtnText}>Create Group</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setCreateModal(false)}>
              <Text style={styles.cancelModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Assign Modal */}
      <Modal visible={assignModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign User to Group</Text>
            {targetGroup && <Text style={styles.modalSubtitle}>{targetGroup.title}</Text>}
            <Text style={styles.modalLabel}>Select User:</Text>
            <ScrollView style={{maxHeight: 200, marginBottom: 16}}>
              {users.map(u => (
                <TouchableOpacity key={u.id} style={{padding: 10, backgroundColor: selectedUser?.id === u.id ? '#E8F5E9' : colors.cream, marginVertical: 4, borderRadius: 8}} onPress={() => setSelectedUser(u)}>
                  <Text style={{fontWeight: selectedUser?.id === u.id ? 'bold' : 'normal'}}>{u.name} ({u.email})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.confirmAssignBtn} onPress={handleAssign} disabled={!selectedUser}>
              <Text style={styles.confirmAssignBtnText}>Confirm Assignment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setAssignModal(false)}>
              <Text style={styles.cancelModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

// ─── Analytics Tab ───────────────────────────────────────────────────────────
const AnalyticsTab = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ riskTrend: [], moodHeatmap: [] });
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/admin/analytics', H);
        setData(res.data || { riskTrend: [], moodHeatmap: [] });
      } catch (e) {
        Alert.alert('Error', 'Failed to load analytics.');
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  const screenWidth = Dimensions.get('window').width - 32;

  // Format Risk Trend
  const riskLabels = data.riskTrend.map(d => new Date(d._id.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })).slice(-10); // limit to last 10 points
  const riskCounts = data.riskTrend.map(d => d.count).slice(-10);
  
  // Format Heatmap
  const heatmapValues = data.moodHeatmap.map(d => ({ date: d._id, count: d.avgRating }));

  return (
    <ScrollView contentContainerStyle={styles.pendingScroll}>
      <Text style={[styles.sectionTitle, { fontSize: 20, marginBottom: 16 }]}>Platform Analytics</Text>

      <Text style={styles.modalLabel}>System Risk Trend (Last 30 Days)</Text>
      {riskCounts.length > 0 ? (
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <LineChart
            data={{
              labels: riskLabels.length ? riskLabels : ['No Data'],
              datasets: [{ data: riskCounts.length ? riskCounts : [0] }]
            }}
            width={screenWidth}
            height={220}
            fromZero
            chartConfig={{
              backgroundColor: colors.white,
              backgroundGradientFrom: colors.white,
              backgroundGradientTo: colors.white,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(229, 115, 115, ${opacity})`,
              labelColor: (opacity = 1) => colors.gray,
              propsForDots: { r: '4', strokeWidth: '2', stroke: '#C62828' }
            }}
            bezier
            style={{ borderRadius: 12, elevation: 1, padding: 10, backgroundColor: colors.white }}
          />
        </View>
      ) : (
        <Text style={styles.placeholderText}>No risk reports in the last 30 days.</Text>
      )}

      <Text style={[styles.modalLabel, { marginTop: 24 }]}>Global Mood Heatmap</Text>
      {heatmapValues.length > 0 ? (
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <ContributionGraph
            values={heatmapValues}
            endDate={new Date()}
            numDays={90}
            width={screenWidth}
            height={220}
            chartConfig={{
              backgroundColor: colors.white,
              backgroundGradientFrom: colors.white,
              backgroundGradientTo: colors.white,
              color: (opacity = 1) => `rgba(129, 199, 132, ${opacity})`,
              labelColor: (opacity = 1) => colors.gray,
            }}
            style={{ borderRadius: 12, elevation: 1, padding: 10, backgroundColor: colors.white }}
          />
        </View>
      ) : (
        <Text style={styles.placeholderText}>No mood data recorded yet.</Text>
      )}
    </ScrollView>
  );
};

// ─── Main Admin Dashboard ────────────────────────────────────────────────────
const AdminDashboardScreen = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [feed, setFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [issues, setIssues] = useState([]);
  const [moods, setMoods] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let interval;
    const loadFeed = async () => {
      setLoadingFeed(true);
      setError('');
      try {
        const res = await api.get('/api/admin/activity_feed', H);
        setFeed(res.data || []);
      } catch (e) {
        setError(e.response?.data?.error || e.message || 'Failed to load feed');
      }
      setLoadingFeed(false);
    };
    if (activeTab === 'feed') {
      loadFeed();
      interval = setInterval(loadFeed, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'users' || users.length > 0) return;
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await api.get('/api/admin/users', H);
        setUsers(res.data || []);
      } catch (e) {
        setError(e.response?.data?.error || e.message || 'Failed to load users');
      }
      setLoadingUsers(false);
    };
    loadUsers();
  }, [activeTab, users.length]);

  const selectUser = async (user) => {
    setSelected(user);
    setLoadingDetails(true);
    try {
      const [issuesRes, moodsRes] = await Promise.all([
        api.get('/api/admin/issues', { params: { userId: user.id }, ...H }),
        api.get('/api/admin/mood', { params: { userId: user.id }, ...H }),
      ]);
      setIssues(issuesRes.data || []);
      setMoods(moodsRes.data || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to load user data');
    }
    setLoadingDetails(false);
  };

  const TABS = [
    { id: 'pending', label: '🔔 Actions' },
    { id: 'analytics', label: '📈 Analytics' },
    { id: 'feed', label: '📡 Live Feed' },
    { id: 'users', label: '👥 Users' },
    { id: 'groups', label: '🤝 Groups' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MindCare Admin</Text>
        <Text style={styles.headerSubtitle}>Admin Verification Center</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabBtn, activeTab === t.id && styles.tabBtnActive]}
              onPress={() => setActiveTab(t.id)}
            >
              <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {activeTab === 'pending' && <PendingTab />}
      
      {activeTab === 'analytics' && <AnalyticsTab />}

      {activeTab === 'groups' && <GroupsTab />}

      {activeTab === 'feed' && (
        <View style={styles.feedContainer}>
          <Text style={styles.sectionTitle}>Global User Activity Stream</Text>
          {loadingFeed && feed.length === 0 ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
          ) : (
            <FlatList
              data={feed}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.feedCard}>
                  <View style={styles.feedHeader}>
                    <Text style={styles.feedUser}>👤 {item.userName}</Text>
                    <Text style={styles.feedTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
                  </View>
                  <Text style={styles.feedAction}>{item.action.replace(/_/g, ' ')}</Text>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      )}

      {activeTab === 'users' && (
        <View style={styles.content}>
          <View style={styles.userList}>
            <Text style={styles.sectionTitle}>Users</Text>
            {loadingUsers ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
            ) : (
              <FlatList
                data={users}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.userItem, selected?.id === item.id && styles.userItemSelected]}
                    onPress={() => selectUser(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
          <View style={styles.details}>
            {!selected ? (
              <Text style={styles.placeholderText}>Select a user to view check-ins and mood history.</Text>
            ) : (
              <ScrollView contentContainerStyle={styles.detailsScroll}>
                <Text style={styles.detailsName}>{selected.name}</Text>
                <Text style={styles.detailsEmail}>{selected.email}</Text>
                <Text style={styles.detailsSection}>AI Assessments</Text>
                {loadingDetails ? <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} /> :
                  issues.length === 0 ? <Text style={styles.placeholderText}>No assessments yet.</Text> :
                    issues.map(r => (
                      <View key={r.id} style={[styles.card, r.riskLevel && { borderLeftWidth: 3, borderLeftColor: RISK_COLORS[r.riskLevel] }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={styles.cardTitle}>{new Date(r.createdAt).toLocaleString()}</Text>
                          {r.adminVerified && <Text style={{ fontSize: 10, color: '#81C784', fontWeight: '700' }}>✓ VERIFIED</Text>}
                        </View>
                        <Text style={styles.cardText}>Category: <Text style={styles.cardHighlight}>{r.category}</Text> · Risk: <Text style={styles.cardHighlight}>{r.riskLevel}</Text></Text>
                        {r.adminNote ? <Text style={[styles.cardText, { color: colors.primary }]}>Admin note: {r.adminNote}</Text> : null}
                      </View>
                    ))
                }
                <Text style={styles.detailsSection}>Mood history</Text>
                {loadingDetails ? <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} /> :
                  moods.length === 0 ? <Text style={styles.placeholderText}>No mood entries yet.</Text> :
                    moods.map(m => (
                      <View key={m.id} style={styles.card}>
                        <Text style={styles.cardTitle}>{new Date(m.date).toLocaleDateString()}</Text>
                        <Text style={styles.cardText}>Rating: <Text style={styles.cardHighlight}>{m.rating}</Text></Text>
                        {m.note ? <Text style={styles.cardText}>Note: {m.note}</Text> : null}
                      </View>
                    ))
                }
              </ScrollView>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

export default AdminDashboardScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { paddingTop: 40, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: colors.primary },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.white },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  tabContainer: { flexDirection: 'row', marginTop: 14 },
  tabBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: 'rgba(255,255,255,0.15)' },
  tabBtnActive: { backgroundColor: colors.white },
  tabText: { color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: colors.primary },
  errorText: { color: '#E57373', fontSize: 13, paddingHorizontal: 16, paddingTop: 6 },
  // Pending tab
  pendingScroll: { padding: 16, paddingBottom: 60 },
  pendingBanner: { backgroundColor: colors.secondary, borderRadius: 12, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
  pendingBannerText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  pendingSectionTitle: { fontSize: 16, fontWeight: '700', color: colors.secondary, marginBottom: 10, marginTop: 4 },
  pendingCard: { backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 12, elevation: 2, borderLeftWidth: 5 },
  pendingCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pendingUser: { fontSize: 14, fontWeight: '700', color: colors.secondary },
  pendingTime: { fontSize: 11, color: colors.gray },
  pendingDetail: { fontSize: 13, color: colors.gray, marginBottom: 3 },
  bold: { fontWeight: '700', color: colors.secondary },
  userNoteText: { fontSize: 13, fontStyle: 'italic', color: colors.secondary, backgroundColor: colors.cream, borderRadius: 8, padding: 10, marginVertical: 8 },
  emptyHint: { fontSize: 13, color: colors.gray, marginBottom: 12 },
  assignBtn: { marginTop: 12, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  assignBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  riskBadgeText: { color: colors.white, fontWeight: '700', fontSize: 11 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.secondary, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: colors.gray, marginBottom: 16 },
  modalLabel: { fontSize: 14, fontWeight: '700', color: colors.secondary, marginTop: 12, marginBottom: 6 },
  modalInput: { borderWidth: 1, borderColor: colors.gray3, borderRadius: 10, padding: 12, fontSize: 14, textAlignVertical: 'top' },
  therapistChip: { backgroundColor: colors.cream, borderRadius: 12, padding: 12, marginRight: 10, minWidth: 110 },
  therapistChipActive: { backgroundColor: colors.secondary },
  therapistChipText: { fontSize: 13, fontWeight: '700', color: colors.secondary },
  therapistChipTextActive: { color: colors.white },
  therapistSpecText: { fontSize: 11, color: colors.gray, marginTop: 2 },
  checkSlotsBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  checkSlotsBtnText: { color: colors.white, fontWeight: '700' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  slotBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.cream, borderRadius: 8 },
  slotBtnActive: { backgroundColor: colors.secondary },
  slotText: { fontSize: 13, color: colors.secondary, fontWeight: '600' },
  slotTextActive: { color: colors.white },
  noSlotsHint: { fontSize: 13, color: '#E57373', marginTop: 8 },
  confirmAssignBtn: { backgroundColor: colors.secondary, borderRadius: 24, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  confirmAssignBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  cancelModalBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelModalBtnText: { color: colors.gray, fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  actionChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.cream, borderRadius: 20 },
  actionChipText: { fontSize: 13, fontWeight: '600', color: colors.secondary },
  // Feed & Users tab
  feedContainer: { flex: 1, padding: 12 },
  feedCard: { backgroundColor: colors.white, padding: 12, borderRadius: 8, marginBottom: 8, elevation: 1 },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  feedUser: { fontSize: 13, fontWeight: '700', color: colors.secondary },
  feedTime: { fontSize: 11, color: colors.gray },
  feedAction: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  content: { flex: 1, flexDirection: 'row' },
  userList: { width: '40%', borderRightWidth: 1, borderRightColor: colors.gray3, paddingTop: 8 },
  details: { flex: 1, padding: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.secondary, paddingHorizontal: 10, marginBottom: 4 },
  userItem: { paddingVertical: 8, paddingHorizontal: 12 },
  userItemSelected: { backgroundColor: colors.accent },
  userName: { fontSize: 14, fontWeight: '600', color: colors.secondary },
  userEmail: { fontSize: 12, color: colors.gray },
  placeholderText: { fontSize: 13, color: colors.gray, marginTop: 12 },
  detailsScroll: { paddingBottom: 20 },
  detailsName: { fontSize: 18, fontWeight: '700', color: colors.secondary },
  detailsEmail: { fontSize: 13, color: colors.gray, marginBottom: 8 },
  detailsSection: { fontSize: 15, fontWeight: '600', color: colors.secondary, marginTop: 12, marginBottom: 4 },
  card: { backgroundColor: colors.white, borderRadius: 10, padding: 10, marginBottom: 8, elevation: 1 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: colors.secondary, marginBottom: 2 },
  cardText: { fontSize: 12, color: colors.gray },
  cardHighlight: { color: colors.primary, fontWeight: '600' },
  // EC detail styles
  ecBadge: { backgroundColor: '#C62828', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ecBadgeText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  ecDetailBox: { backgroundColor: colors.cream, borderRadius: 10, padding: 12, marginBottom: 10 },
  ecDetailLine: { fontSize: 14, color: colors.secondary, marginBottom: 4 },
  // SLA / Escalation styles
  escalationBanner: {
    backgroundColor: '#B71C1C', borderRadius: 14, padding: 16, marginBottom: 16,
  },
  escalationBannerIcon: { fontSize: 22, marginRight: 8 },
  escalationBannerTitle: { color: '#fff', fontWeight: '800', fontSize: 15, flex: 1 },
  escalationBannerText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  slaRunBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start' },
  slaRunBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  escalatedStrip: { backgroundColor: '#FFEBEE', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10 },
  escalatedStripText: { color: '#B71C1C', fontWeight: '800', fontSize: 12 },
  // Plan task styles
  planTaskItem: { marginBottom: 8 },
  planTaskHeader: { fontSize: 14, fontWeight: '700', color: colors.secondary, marginBottom: 2 },
  planTaskSub: { fontSize: 12, color: colors.gray },
  addTaskBtn: { backgroundColor: colors.cream, borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.gray3, borderStyle: 'dashed', marginBottom: 8 },
  addTaskBtnText: { color: colors.primary, fontWeight: '700' },
});
