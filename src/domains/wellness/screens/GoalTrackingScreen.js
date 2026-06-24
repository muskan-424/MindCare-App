import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import api from '../../../utils/apiClient';
import { colors } from '../../../constants/theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useTranslation from '../../../utils/i18n';

const CATEGORIES = [
  { id: 'mental_health', labelKey: 'goals.category_mental_health', color: '#7C4DFF' },
  { id: 'fitness',       labelKey: 'goals.category_fitness',       color: '#F4511E' },
  { id: 'social',        labelKey: 'goals.category_social',        color: '#039BE5' },
  { id: 'academic',      labelKey: 'goals.category_academic',      color: '#F6BF26' },
  { id: 'self_care',     labelKey: 'goals.category_self_care',     color: '#33B679' },
  { id: 'sleep',         labelKey: 'goals.category_sleep',         color: '#3F51B5' },
  { id: 'other',         labelKey: 'goals.category_other',         color: '#616161' },
];

const getCategoryMeta = (id, t) => {
  const cat = CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
  return { ...cat, label: t(cat.labelKey) };
};

const STATUS_KEYS = {
  active:    { labelKey: 'goals.status_active',     color: '#33B679', icon: 'play-circle' },
  paused:    { labelKey: 'goals.status_paused',     color: '#F6BF26', icon: 'pause-circle' },
  completed: { labelKey: 'goals.status_completed',  color: '#7C4DFF', icon: 'check-circle' },
};

const FILTER_KEYS = ['all', 'active', 'paused', 'completed'];

const GoalCard = ({ goal, onPressProgress, onPressMilestones, onDelete }) => {
  const { t } = useTranslation();
  const cat = getCategoryMeta(goal.category, t);
  const statusMeta = STATUS_KEYS[goal.status] || STATUS_KEYS.active;
  const status = { ...statusMeta, label: t(statusMeta.labelKey) };

  const daysLeft = goal.targetDate
    ? Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const completedMilestones = (goal.milestones || []).filter(m => m.completed).length;
  const totalMilestones = (goal.milestones || []).length;

  return (
    <View style={[styles.card, { borderTopColor: cat.color }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.catBadge, { backgroundColor: `${cat.color}20` }]}>
          <Text style={[styles.catText, { color: cat.color }]}>{cat.label}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
          <MaterialCommunityIcons name={status.icon} size={12} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <Text style={styles.goalTitle}>{goal.title}</Text>
      {goal.description ? <Text style={styles.goalDesc}>{goal.description}</Text> : null}

      {daysLeft !== null && (
        <Text style={[styles.daysLeft, { color: daysLeft < 7 ? '#F4511E' : colors.gray }]}>
          {daysLeft > 0
            ? t('goals.days_left', { count: daysLeft })
            : daysLeft === 0
              ? t('goals.due_today')
              : t('goals.overdue')}
        </Text>
      )}

      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>{t('goals.progress')}</Text>
          <Text style={[styles.progressPct, { color: cat.color }]}>{goal.progress}%</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${goal.progress}%`, backgroundColor: cat.color }]} />
        </View>
      </View>

      {totalMilestones > 0 && (
        <TouchableOpacity style={styles.milestoneRow} onPress={() => onPressMilestones(goal)}>
          <MaterialCommunityIcons name="flag-checkered" size={14} color={colors.gray} />
          <Text style={styles.milestoneText}>
            {t('goals.milestones_count', { completed: completedMilestones, total: totalMilestones })}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.gray} />
        </TouchableOpacity>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${cat.color}15` }]} onPress={() => onPressProgress(goal)}>
          <MaterialCommunityIcons name="pencil" size={14} color={cat.color} />
          <Text style={[styles.actionBtnText, { color: cat.color }]}>{t('goals.update')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F4511E15' }]} onPress={() => onDelete(goal._id)}>
          <MaterialCommunityIcons name="trash-can-outline" size={14} color="#F4511E" />
          <Text style={[styles.actionBtnText, { color: '#F4511E' }]}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const GoalTrackingScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'mental_health', targetDate: '' });
  const [milestoneInputs, setMilestoneInputs] = useState(['']);
  const [saving, setSaving] = useState(false);

  const [progressModal, setProgressModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [progressValue, setProgressValue] = useState(0);

  const [msModal, setMsModal] = useState(false);
  const [msGoal, setMsGoal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/goals');
      setGoals(res.data || []);
    } catch (e) {
      Alert.alert(t('common.error'), t('goals.error_load'));
    }
    setLoading(false);
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.title.trim()) return Alert.alert(t('goals.required_title'), t('goals.title_required'));
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
      Alert.alert(t('common.error'), t('goals.error_create'));
    }
    setSaving(false);
  };

  const handleUpdateProgress = async () => {
    try {
      await api.patch(`/api/goals/${selectedGoal._id}/progress`, { progress: progressValue });
      setProgressModal(false);
      load();
    } catch (e) {
      Alert.alert(t('common.error'), t('goals.error_update_progress'));
    }
  };

  const handleToggleMilestone = async (goalId, msId) => {
    try {
      const res = await api.patch(`/api/goals/${goalId}/milestone/${msId}`);
      setMsGoal(res.data);
      setGoals(prev => prev.map(g => g._id === goalId ? res.data : g));
    } catch (e) {
      Alert.alert(t('common.error'), t('goals.error_toggle_milestone'));
    }
  };

  const handleDelete = (goalId) => {
    Alert.alert(t('goals.delete_title'), t('goals.delete_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/goals/${goalId}`);
            load();
          } catch (e) {
            Alert.alert(t('common.error'), t('goals.error_delete'));
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={26} color={colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.headerTitle}>{t('goals.header_title')}</Text>
          <Text style={styles.headerSub}>
            {t('goals.header_sub', { active: stats.active, completed: stats.completed })}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setCreateModal(true)}>
          <AntDesign name="plus" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        {[
          { labelKey: 'goals.stat_total',     value: stats.total,     color: colors.primary },
          { labelKey: 'goals.stat_active',    value: stats.active,    color: '#33B679' },
          { labelKey: 'goals.stat_done',      value: stats.completed, color: '#7C4DFF' },
        ].map(s => (
          <View key={s.labelKey} style={styles.statItem}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{t(s.labelKey)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.filterRow}>
        {FILTER_KEYS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {t(`goals.filter_${f}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="target" size={56} color={colors.gray3} />
            <Text style={styles.emptyTitle}>{t('goals.empty_title')}</Text>
            <Text style={styles.emptyDesc}>{t('goals.empty_desc')}</Text>
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

      <Modal visible={createModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('goals.modal_new_goal')}</Text>

            <Text style={styles.lbl}>{t('goals.label_title')}</Text>
            <TextInput style={styles.input} placeholder={t('goals.placeholder_title')} placeholderTextColor={colors.gray} value={form.title} onChangeText={text => setForm({ ...form, title: text })} />

            <Text style={styles.lbl}>{t('goals.label_description')}</Text>
            <TextInput style={[styles.input, { minHeight: 70 }]} placeholder={t('goals.placeholder_description')} placeholderTextColor={colors.gray} multiline value={form.description} onChangeText={text => setForm({ ...form, description: text })} />

            <Text style={styles.lbl}>{t('goals.label_category')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.catChip, form.category === c.id && { backgroundColor: c.color }]}
                  onPress={() => setForm({ ...form, category: c.id })}
                >
                  <Text style={[styles.catChipText, form.category === c.id && { color: '#fff' }]}>{t(c.labelKey)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.lbl}>{t('goals.label_target_date')}</Text>
            <TextInput style={styles.input} placeholder={t('goals.placeholder_target_date')} placeholderTextColor={colors.gray} value={form.targetDate} onChangeText={text => setForm({ ...form, targetDate: text })} />

            <Text style={styles.lbl}>{t('goals.label_milestones')}</Text>
            {milestoneInputs.map((m, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder={t('goals.milestone_placeholder', { n: i + 1 })}
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
                <Text style={styles.addMsBtnText}>{t('goals.add_milestone')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{t('goals.create_goal')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateModal(false)}>
              <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={progressModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('goals.modal_update_progress')}</Text>
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
            <View style={styles.quickRow}>
              {[25, 50, 75, 100].map(v => (
                <TouchableOpacity key={v} style={[styles.quickBtn, progressValue === v && styles.quickBtnActive]} onPress={() => setProgressValue(v)}>
                  <Text style={[styles.quickBtnText, progressValue === v && { color: '#fff' }]}>{v}%</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdateProgress}>
              <Text style={styles.primaryBtnText}>{t('goals.save_progress')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setProgressModal(false)}>
              <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={msModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('goals.milestones')}</Text>
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
              <Text style={styles.cancelBtnText}>{t('goals.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default GoalTrackingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { backgroundColor: colors.primary, paddingTop: 48, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },

  statsBar: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: -12, borderRadius: 14, elevation: 4, padding: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, color: colors.gray, fontWeight: '600', marginTop: 2 },

  filterRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, marginBottom: 4, gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E8EAF6', alignItems: 'center' },
  filterBtnActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '700', color: colors.gray },
  filterTextActive: { color: '#fff' },

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

  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', marginTop: 16 },
  emptyDesc: { fontSize: 14, color: colors.gray, marginTop: 8, textAlign: 'center' },

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

  progressInputRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 20 },
  stepBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  progressDisplay: { flex: 1, alignItems: 'center' },
  progressBigNum: { fontSize: 36, fontWeight: '800', color: colors.primary, marginBottom: 10 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  quickBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#F0F0F0', borderRadius: 10, alignItems: 'center' },
  quickBtnActive: { backgroundColor: colors.primary },
  quickBtnText: { fontSize: 14, fontWeight: '700', color: '#333' },

  msRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 12 },
  msCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.gray3, alignItems: 'center', justifyContent: 'center' },
  msCheckDone: { backgroundColor: '#33B679', borderColor: '#33B679' },
  msLabel: { flex: 1, fontSize: 15, color: '#1A1A2E', fontWeight: '500' },
  msLabelDone: { textDecorationLine: 'line-through', color: colors.gray },
});
