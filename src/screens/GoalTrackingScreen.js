import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, Animated,
} from 'react-native';
import api from '../utils/apiClient';
import { colors } from '../constants/theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// ─── Constants ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'mental_health', label: '🧠 Mental Health', color: '#7C4DFF' },
  { id: 'fitness',       label: '💪 Fitness',       color: '#F4511E' },
  { id: 'social',        label: '👥 Social',        color: '#039BE5' },
  { id: 'academic',      label: '📚 Academic',      color: '#F6BF26' },
  { id: 'self_care',     label: '🌿 Self-Care',     color: '#33B679' },
  { id: 'sleep',         label: '🌙 Sleep',         color: '#3F51B5' },
  { id: 'other',         label: '✨ Other',         color: '#616161' },
];

const getCategoryMeta = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

const STATUS_CONFIG = {
  active:    { label: 'Active',     color: '#33B679', icon: 'play-circle' },
  paused:    { label: 'Paused',     color: '#F6BF26', icon: 'pause-circle' },
  completed: { label: 'Completed',  color: '#7C4DFF', icon: 'check-circle' },
};

// ─── Progress Ring Component ────────────────────────────────────────────────
const ProgressRing = ({ progress, size = 56, color = colors.primary }) => {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const filled = circ * (progress / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 5, borderColor: `${color}30`,
        position: 'absolute',
      }} />
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 5, borderColor: color,
        borderStyle: 'dashed', position: 'absolute', opacity: progress > 0 ? 1 : 0,
        // A rough approximation using border—ideal would be SVG
      }} />
      <Text style={{ fontSize: 14, fontWeight: '800', color }}>{progress}%</Text>
    </View>
  );
};

// ─── Goal Card Component ─────────────────────────────────────────────────────
const GoalCard = ({ goal, onPressProgress, onPressMilestones, onDelete }) => {
  const cat = getCategoryMeta(goal.category);
  const status = STATUS_CONFIG[goal.status] || STATUS_CONFIG.active;

  const daysLeft = goal.targetDate
    ? Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const completedMilestones = (goal.milestones || []).filter(m => m.completed).length;
  const totalMilestones = (goal.milestones || []).length;

  return (
    <View style={[styles.card, { borderTopColor: cat.color }]}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.catBadge, { backgroundColor: `${cat.color}20` }]}>
          <Text style={[styles.catText, { color: cat.color }]}>{cat.label}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
          <MaterialCommunityIcons name={status.icon} size={12} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {/* Title + Description */}
      <Text style={styles.goalTitle}>{goal.title}</Text>
      {goal.description ? <Text style={styles.goalDesc}>{goal.description}</Text> : null}

      {/* Days left chip */}
      {daysLeft !== null && (
        <Text style={[styles.daysLeft, { color: daysLeft < 7 ? '#F4511E' : colors.gray }]}>
          {daysLeft > 0 ? `🗓  ${daysLeft} days left` : daysLeft === 0 ? '🗓  Due today!' : '⏰ Overdue'}
        </Text>
      )}

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={[styles.progressPct, { color: cat.color }]}>{goal.progress}%</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${goal.progress}%`, backgroundColor: cat.color }]} />
        </View>
      </View>

      {/* Milestones summary */}
      {totalMilestones > 0 && (
        <TouchableOpacity style={styles.milestoneRow} onPress={() => onPressMilestones(goal)}>
          <MaterialCommunityIcons name="flag-checkered" size={14} color={colors.gray} />
          <Text style={styles.milestoneText}>{completedMilestones}/{totalMilestones} milestones</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.gray} />
        </TouchableOpacity>
      )}

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${cat.color}15` }]} onPress={() => onPressProgress(goal)}>
          <MaterialCommunityIcons name="pencil" size={14} color={cat.color} />
          <Text style={[styles.actionBtnText, { color: cat.color }]}>Update</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F4511E15' }]} onPress={() => onDelete(goal._id)}>
          <MaterialCommunityIcons name="trash-can-outline" size={14} color="#F4511E" />
          <Text style={[styles.actionBtnText, { color: '#F4511E' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const GoalTrackingScreen = ({ navigation }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');  // all | active | completed | paused

  // Create Modal
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'mental_health', targetDate: '' });
  const [milestoneInputs, setMilestoneInputs] = useState(['']);
  const [saving, setSaving] = useState(false);

  // Progress Modal
  const [progressModal, setProgressModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [progressValue, setProgressValue] = useState(0);

  // Milestone Modal
  const [msModal, setMsModal] = useState(false);
  const [msGoal, setMsGoal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/goals');
      setGoals(res.data || []);
    } catch (e) {
      Alert.alert('Error', 'Could not load goals.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.title.trim()) return Alert.alert('Required', 'Goal title is required.');
    setSaving(true);
    try {
      await api.post('/api/goals', {
        ...form,
        targetDate: form.targetDate || undefined,
        milestones: milestoneInputs.filter(m => m.trim()),
      });
      setCreateModal(false);
      setForm({ title: '', description: '', category: 'mental_health', targetDate: '' });
      setMilestoneInputs(['']);
      load();
    } catch (e) {
      Alert.alert('Error', 'Failed to create goal.');
    }
    setSaving(false);
  };

  const handleUpdateProgress = async () => {
    try {
      await api.patch(`/api/goals/${selectedGoal._id}/progress`, { progress: progressValue });
      setProgressModal(false);
      load();
    } catch (e) {
      Alert.alert('Error', 'Failed to update progress.');
    }
  };

  const handleToggleMilestone = async (goalId, msId) => {
    try {
      const res = await api.patch(`/api/goals/${goalId}/milestone/${msId}`);
      // Update the msGoal locally so checkboxes respond instantly
      setMsGoal(res.data);
      setGoals(prev => prev.map(g => g._id === goalId ? res.data : g));
    } catch (e) {
      Alert.alert('Error', 'Failed to toggle milestone.');
    }
  };

  const handleDelete = (goalId) => {
    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/goals/${goalId}`);
            load();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete goal.');
          }
        },
      },
    ]);
  };

  const filtered = goals.filter(g => filter === 'all' ? true : g.status === filter);
  const stats = {
    total: goals.length,
    active: goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
  };

  if (loading) {
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
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.headerTitle}>Goal Tracker</Text>
          <Text style={styles.headerSub}>
            {stats.active} active · {stats.completed} completed
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setCreateModal(true)}>
          <AntDesign name="plus" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Stats Summary Bar */}
      <View style={styles.statsBar}>
        {[
          { label: 'Total',     value: stats.total,     color: colors.primary },
          { label: 'Active',    value: stats.active,    color: '#33B679' },
          { label: 'Done',      value: stats.completed, color: '#7C4DFF' },
        ].map(s => (
          <View key={s.label} style={styles.statItem}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {['all', 'active', 'paused', 'completed'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Goal List */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="target" size={56} color={colors.gray3} />
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptyDesc}>Tap + to create your first personal milestone.</Text>
          </View>
        ) : (
          filtered.map(goal => (
            <GoalCard
              key={goal._id}
              goal={goal}
              onPressProgress={g => { setSelectedGoal(g); setProgressValue(g.progress); setProgressModal(true); }}
              onPressMilestones={g => { setMsGoal(g); setMsModal(true); }}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>

      {/* ── Create Goal Modal ── */}
      <Modal visible={createModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.sheet}>
            <Text style={styles.sheetTitle}>New Goal</Text>

            <Text style={styles.lbl}>Title *</Text>
            <TextInput style={styles.input} placeholder="e.g. Meditate daily for a month" placeholderTextColor={colors.gray} value={form.title} onChangeText={t => setForm({ ...form, title: t })} />

            <Text style={styles.lbl}>Description</Text>
            <TextInput style={[styles.input, { minHeight: 70 }]} placeholder="Why is this important to me?" placeholderTextColor={colors.gray} multiline value={form.description} onChangeText={t => setForm({ ...form, description: t })} />

            <Text style={styles.lbl}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.catChip, form.category === c.id && { backgroundColor: c.color }]}
                  onPress={() => setForm({ ...form, category: c.id })}
                >
                  <Text style={[styles.catChipText, form.category === c.id && { color: '#fff' }]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.lbl}>Target Date (optional, YYYY-MM-DD)</Text>
            <TextInput style={styles.input} placeholder="2026-06-30" placeholderTextColor={colors.gray} value={form.targetDate} onChangeText={t => setForm({ ...form, targetDate: t })} />

            <Text style={styles.lbl}>Milestones (optional, up to 5)</Text>
            {milestoneInputs.map((m, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder={`Milestone ${i + 1}`}
                  placeholderTextColor={colors.gray}
                  value={m}
                  onChangeText={v => {
                    const updated = [...milestoneInputs];
                    updated[i] = v;
                    setMilestoneInputs(updated);
                  }}
                />
                {milestoneInputs.length > 1 && (
                  <TouchableOpacity style={{ padding: 10, justifyContent: 'center' }} onPress={() => setMilestoneInputs(milestoneInputs.filter((_, idx) => idx !== i))}>
                    <AntDesign name="close" size={16} color="#F4511E" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {milestoneInputs.length < 5 && (
              <TouchableOpacity style={styles.addMsBtn} onPress={() => setMilestoneInputs([...milestoneInputs, ''])}>
                <AntDesign name="plus" size={14} color={colors.primary} />
                <Text style={styles.addMsBtnText}>Add Milestone</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Create Goal</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Update Progress Modal ── */}
      <Modal visible={progressModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Update Progress</Text>
            {selectedGoal && <Text style={styles.sheetSub}>{selectedGoal.title}</Text>}
            <View style={styles.progressInputRow}>
              <TouchableOpacity onPress={() => setProgressValue(Math.max(0, progressValue - 5))} style={styles.stepBtn}>
                <AntDesign name="minus" size={20} color={colors.primary} />
              </TouchableOpacity>
              <View style={styles.progressDisplay}>
                <Text style={styles.progressBigNum}>{progressValue}%</Text>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${progressValue}%`, backgroundColor: colors.primary }]} />
                </View>
              </View>
              <TouchableOpacity onPress={() => setProgressValue(Math.min(100, progressValue + 5))} style={styles.stepBtn}>
                <AntDesign name="plus" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            {/* Quick set buttons */}
            <View style={styles.quickRow}>
              {[25, 50, 75, 100].map(v => (
                <TouchableOpacity key={v} style={[styles.quickBtn, progressValue === v && styles.quickBtnActive]} onPress={() => setProgressValue(v)}>
                  <Text style={[styles.quickBtnText, progressValue === v && { color: '#fff' }]}>{v}%</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdateProgress}>
              <Text style={styles.primaryBtnText}>Save Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setProgressModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Milestones Modal ── */}
      <Modal visible={msModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Milestones</Text>
            {msGoal && <Text style={styles.sheetSub}>{msGoal.title}</Text>}
            <ScrollView style={{ maxHeight: 320, marginBottom: 16 }}>
              {(msGoal?.milestones || []).map(ms => (
                <TouchableOpacity
                  key={ms._id}
                  style={styles.msRow}
                  onPress={() => handleToggleMilestone(msGoal._id, ms._id)}
                >
                  <View style={[styles.msCheck, ms.completed && styles.msCheckDone]}>
                    {ms.completed && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                  </View>
                  <Text style={[styles.msLabel, ms.completed && styles.msLabelDone]}>{ms.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setMsModal(false)}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default GoalTrackingScreen;

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: { backgroundColor: colors.primary, paddingTop: 48, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },

  // Stats
  statsBar: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: -12, borderRadius: 14, elevation: 4, padding: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, color: colors.gray, fontWeight: '600', marginTop: 2 },

  // Filter
  filterRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, marginBottom: 4, gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E8EAF6', alignItems: 'center' },
  filterBtnActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '700', color: colors.gray },
  filterTextActive: { color: '#fff' },

  // Goal Card
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, borderTopWidth: 4, elevation: 2, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  catText: { fontSize: 12, fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '700' },
  goalTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  goalDesc: { fontSize: 13, color: colors.gray, marginBottom: 8, lineHeight: 18 },
  daysLeft: { fontSize: 12, fontWeight: '600', marginBottom: 10 },

  progressSection: { marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: colors.gray, fontWeight: '600' },
  progressPct: { fontSize: 12, fontWeight: '800' },
  progressBg: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  milestoneText: { flex: 1, fontSize: 13, color: colors.gray },

  cardActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10 },
  actionBtnText: { fontSize: 13, fontWeight: '700' },

  // Empty
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', marginTop: 16 },
  emptyDesc: { fontSize: 14, color: colors.gray, marginTop: 8, textAlign: 'center' },

  // Modal Sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  sheetSub: { fontSize: 14, color: colors.gray, marginBottom: 16 },
  lbl: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#F5F6FA', borderRadius: 12, padding: 12, fontSize: 14, color: '#1A1A2E', marginBottom: 4, textAlignVertical: 'top' },

  catChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8 },
  catChipText: { fontSize: 13, fontWeight: '600', color: '#333' },

  addMsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, marginTop: 4 },
  addMsBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },

  primaryBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cancelBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  cancelBtnText: { color: colors.gray, fontWeight: '700', fontSize: 14 },

  // Progress Modal
  progressInputRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 20 },
  stepBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  progressDisplay: { flex: 1, alignItems: 'center' },
  progressBigNum: { fontSize: 36, fontWeight: '800', color: colors.primary, marginBottom: 10 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  quickBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#F0F0F0', borderRadius: 10, alignItems: 'center' },
  quickBtnActive: { backgroundColor: colors.primary },
  quickBtnText: { fontSize: 14, fontWeight: '700', color: '#333' },

  // Milestones Modal
  msRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 12 },
  msCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.gray3, alignItems: 'center', justifyContent: 'center' },
  msCheckDone: { backgroundColor: '#33B679', borderColor: '#33B679' },
  msLabel: { flex: 1, fontSize: 15, color: '#1A1A2E', fontWeight: '500' },
  msLabelDone: { textDecorationLine: 'line-through', color: colors.gray },
});
