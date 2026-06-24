import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { connect } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../../utils/apiClient';
import { colors } from '../../../constants/theme';
import useTranslation from '../../../utils/i18n';

const GOALS_LIST = [
  { value: 'Reduce Anxiety', labelKey: 'wellness.goal_reduce_anxiety' },
  { value: 'Better Sleep', labelKey: 'wellness.goal_better_sleep' },
  { value: 'Manage Work Stress', labelKey: 'wellness.goal_manage_stress' },
  { value: 'Improve Focus', labelKey: 'wellness.goal_improve_focus' },
  { value: 'Overcome Burnout', labelKey: 'wellness.goal_overcome_burnout' },
  { value: 'Build Self-Esteem', labelKey: 'wellness.goal_build_self_esteem' },
];

const PACES = [
  { value: 'Relaxed', labelKey: 'wellness.pace_relaxed' },
  { value: 'Moderate', labelKey: 'wellness.pace_moderate' },
  { value: 'Intense', labelKey: 'wellness.pace_intense' },
];

const TASK_ICONS = {
  breathing: 'weather-windy',
  journal: 'book-open-page-variant',
  meditation: 'meditation',
  reading: 'glasses',
  activity: 'run',
  custom: 'star',
};

const WellnessPlanScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState(null);

  const [selectedGoals, setSelectedGoals] = useState([]);
  const [struggles, setStruggles] = useState('');
  const [pace, setPace] = useState('Moderate');
  const [submitting, setSubmitting] = useState(false);

  const [activeDay, setActiveDay] = useState(1);
  const [togglingTask, setTogglingTask] = useState(null);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/wellness');
      if (res.data && res.data.exists) {
        setPlanData(res.data);
        if (res.data.status === 'active' && res.data.dailyPlans) {
          const firstIncomplete = res.data.dailyPlans.find(
            d => d.tasks.some(task => !task.completed)
          );
          setActiveDay(firstIncomplete ? firstIncomplete.dayNumber : 1);
        }
      } else {
        setPlanData(null);
      }
    } catch (e) {
      Alert.alert(t('common.error'), t('wellness.error_load'));
    }
    setLoading(false);
  }, [t]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const toggleGoal = (goalValue) => {
    setSelectedGoals(prev =>
      prev.includes(goalValue) ? prev.filter(g => g !== goalValue) : [...prev, goalValue]
    );
  };

  const submitRequest = async () => {
    if (selectedGoals.length === 0) {
      Alert.alert(t('goals.required_title'), t('wellness.required_select_goal'));
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/wellness/request', {
        goals: selectedGoals,
        currentStruggles: struggles,
        preferredPace: pace,
      });
      fetchPlan();
    } catch (e) {
      Alert.alert(t('common.error'), e.response?.data?.error || t('wellness.error_submit'));
    }
    setSubmitting(false);
  };

  const toggleTask = async (dayId, task) => {
    if (togglingTask) return;
    setTogglingTask(task._id);
    try {
      const res = await api.patch(`/api/wellness/task/${dayId}/${task._id}/complete`, {
        completed: !task.completed,
      });
      if (res.data.success) {
        setPlanData(prev => {
          const newPlan = { ...prev, progress: res.data.totalTasksCompleted };
          const newDays = prev.dailyPlans.map(d => {
            if (d._id === dayId) {
              return {
                ...d,
                tasks: d.tasks.map(taskItem => taskItem._id === task._id ? { ...taskItem, completed: !task.completed } : taskItem)
              };
            }
            return d;
          });
          newPlan.dailyPlans = newDays;
          return newPlan;
        });
      }
    } catch (e) {
      Alert.alert(t('common.error'), t('wellness.error_update_task'));
    }
    setTogglingTask(null);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!planData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('wellness.plan_title')}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.questionCard}>
            <Text style={styles.title}>{t('wellness.request_title')}</Text>
            <Text style={styles.subtitle}>
              {t('wellness.request_subtitle')}
            </Text>

            <Text style={styles.label}>{t('wellness.label_goals')}</Text>
            <View style={styles.chipsWrap}>
              {GOALS_LIST.map(g => (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.chip, selectedGoals.includes(g.value) && styles.chipActive]}
                  onPress={() => toggleGoal(g.value)}
                >
                  <Text style={[styles.chipText, selectedGoals.includes(g.value) && styles.chipTextActive]}>{t(g.labelKey)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{t('wellness.label_struggles')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('wellness.placeholder_struggles')}
              value={struggles}
              onChangeText={setStruggles}
              multiline
              textAlignVertical="top"
              placeholderTextColor={colors.gray}
            />

            <Text style={styles.label}>{t('wellness.label_pace')}</Text>
            <View style={styles.paceRow}>
              {PACES.map(p => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.paceBtn, pace === p.value && styles.paceBtnActive]}
                  onPress={() => setPace(p.value)}
                >
                  <Text style={[styles.paceText, pace === p.value && styles.paceTextActive]}>{t(p.labelKey)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={submitRequest}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitBtnText}>{t('wellness.submit_request')}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (planData.status === 'awaiting_admin') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('wellness.plan_title')}</Text>
        </View>
        <View style={styles.centeredPending}>
          <MaterialCommunityIcons name="clipboard-text-clock" size={60} color={colors.primary} />
          <Text style={styles.pendingTitle}>{t('wellness.pending_title')}</Text>
          <Text style={styles.pendingText}>
            {t('wellness.pending_text')}
          </Text>
          <View style={styles.pendingGoalsBox}>
            <Text style={styles.pendingGoalsLabel}>{t('wellness.pending_focus_label')}</Text>
            {planData.goals.map(g => <Text key={g} style={styles.pendingGoalItem}>• {g}</Text>)}
          </View>
        </View>
      </View>
    );
  }

  const currentDayData = planData.dailyPlans?.find(d => d.dayNumber === activeDay) || null;
  const totalTasks = planData.dailyPlans?.reduce((acc, d) => acc + d.tasks.length, 0) || 1;
  const progressPercent = Math.round((planData.progress / totalTasks) * 100);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingBottom: 24 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{t('wellness.my_plan_title')}</Text>
            <Text style={styles.headerFocus}>{planData.planFocus}</Text>
          </View>
        </View>

        <View style={styles.progressBox}>
          <View style={styles.progressTextRow}>
            <Text style={styles.progressLabel}>{t('wellness.overall_progress')}</Text>
            <Text style={styles.progressValue}>
              {t('wellness.progress_value', { percent: progressPercent, completed: planData.progress, total: totalTasks })}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>
      </View>

      {planData.adminNote ? (
        <View style={styles.adminNoteBanner}>
          <MaterialCommunityIcons name="heart" size={16} color={colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.adminNoteText}>"{planData.adminNote}"</Text>
        </View>
      ) : null}

      <View style={styles.timelineWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timelineScroll}>
          {planData.dailyPlans?.map(d => {
            const allDone = d.tasks.length > 0 && d.tasks.every(task => task.completed);
            const isActive = d.dayNumber === activeDay;
            return (
              <TouchableOpacity
                key={d._id}
                style={[styles.dayCircle, isActive && styles.dayCircleActive, allDone && styles.dayCircleDone]}
                onPress={() => setActiveDay(d.dayNumber)}
              >
                <Text style={[styles.dayCircleNum, isActive && styles.dayCircleNumActive, allDone && { color: colors.white }]}>
                  {allDone ? '✓' : d.dayNumber}
                </Text>
                <Text style={[styles.dayCircleLabel, isActive && styles.dayCircleLabelActive, allDone && { color: colors.white }]}>{t('wellness.day_label')}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.tasksScroll}>
        <Text style={styles.dayTitle}>{t('wellness.day_routine', { day: activeDay })}</Text>

        {currentDayData?.tasks?.map(task => (
          <TouchableOpacity
            key={task._id}
            style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
            onPress={() => toggleTask(currentDayData._id, task)}
            activeOpacity={0.8}
            disabled={togglingTask === task._id}
          >
            <View style={[styles.taskIconBox, { backgroundColor: task.completed ? colors.white : colors.cream }]}>
              <MaterialCommunityIcons
                name={TASK_ICONS[task.type] || 'star'}
                size={24}
                color={task.completed ? '#81C784' : colors.primary}
              />
            </View>
            <View style={styles.taskInfo}>
              <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                {task.title}
              </Text>
              <Text style={styles.taskType}>{task.type.toUpperCase()}</Text>
              {task.description ? (
                <Text style={[styles.taskDesc, task.completed && styles.taskDescCompleted]}>{task.description}</Text>
              ) : null}
            </View>
            <View style={[styles.checkbox, task.completed && styles.checkboxChecked]}>
              {togglingTask === task._id ? (
                <ActivityIndicator size="small" color={task.completed ? colors.white : colors.primary} />
              ) : (
                task.completed && <MaterialCommunityIcons name="check" size={16} color={colors.white} />
              )}
            </View>
          </TouchableOpacity>
        ))}

        {(!currentDayData || currentDayData.tasks.length === 0) && (
          <Text style={styles.emptyTasksHint}>{t('wellness.empty_tasks')}</Text>
        )}
      </ScrollView>

    </View>
  );
};

const mapStateToProps = state => ({ auth: state.auth });
export default connect(mapStateToProps)(WellnessPlanScreen);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: colors.primary, paddingTop: 48, paddingBottom: 16, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.white },
  headerFocus: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  scroll: { padding: 20, paddingBottom: 60 },
  questionCard: { backgroundColor: colors.white, borderRadius: 16, padding: 20, elevation: 2 },
  title: { fontSize: 20, fontWeight: '800', color: colors.secondary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.gray, marginBottom: 20, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '700', color: colors.secondary, marginBottom: 10, marginTop: 12 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.cream, borderRadius: 24, borderWidth: 1, borderColor: colors.gray3 },
  chipActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  chipText: { fontSize: 13, color: colors.secondary, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  input: { borderWidth: 1, borderColor: colors.gray3, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 90 },
  paceRow: { flexDirection: 'row', gap: 10 },
  paceBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, backgroundColor: colors.cream, borderRadius: 12, borderWidth: 1, borderColor: colors.gray3 },
  paceBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  paceText: { fontSize: 14, fontWeight: '600', color: colors.secondary },
  paceTextActive: { color: colors.white },
  submitBtn: { backgroundColor: colors.secondary, borderRadius: 24, paddingVertical: 16, alignItems: 'center', marginTop: 30 },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },

  centeredPending: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  pendingTitle: { fontSize: 22, fontWeight: '800', color: colors.secondary, marginTop: 16, marginBottom: 8 },
  pendingText: { fontSize: 14, color: colors.gray, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  pendingGoalsBox: { backgroundColor: colors.white, padding: 16, borderRadius: 12, width: '100%', elevation: 1 },
  pendingGoalsLabel: { fontSize: 14, fontWeight: '700', color: colors.secondary, marginBottom: 8 },
  pendingGoalItem: { fontSize: 14, color: colors.primary, fontWeight: '500', marginBottom: 4 },

  progressBox: { backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: 12 },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { color: colors.white, fontSize: 13, fontWeight: '600' },
  progressValue: { color: colors.white, fontSize: 13, fontWeight: '700' },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.white, borderRadius: 3 },
  adminNoteBanner: { backgroundColor: colors.accent, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  adminNoteText: { color: colors.white, fontSize: 13, fontWeight: '600', fontStyle: 'italic' },
  timelineWrap: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray3, paddingVertical: 12 },
  timelineScroll: { paddingHorizontal: 16, gap: 12 },
  dayCircle: { width: 50, height: 60, borderRadius: 12, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  dayCircleActive: { backgroundColor: colors.secondary, elevation: 4 },
  dayCircleDone: { backgroundColor: '#81C784' },
  dayCircleNum: { fontSize: 18, fontWeight: '800', color: colors.secondary },
  dayCircleNumActive: { color: colors.white },
  dayCircleLabel: { fontSize: 10, color: colors.gray, fontWeight: '600' },
  dayCircleLabelActive: { color: 'rgba(255,255,255,0.8)' },
  tasksScroll: { padding: 20, paddingBottom: 60 },
  dayTitle: { fontSize: 18, fontWeight: '800', color: colors.secondary, marginBottom: 16 },
  taskCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 1 },
  taskCardCompleted: { backgroundColor: '#E8F5E9', opacity: 0.8 },
  taskIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  taskInfo: { flex: 1, marginLeft: 16, marginRight: 12 },
  taskTitle: { fontSize: 15, fontWeight: '700', color: colors.secondary, marginBottom: 2 },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: colors.gray },
  taskType: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  taskDesc: { fontSize: 12, color: colors.gray, marginTop: 4, lineHeight: 18 },
  taskDescCompleted: { textDecorationLine: 'line-through' },
  checkbox: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.gray3, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#81C784', borderColor: '#81C784' },
  emptyTasksHint: { textAlign: 'center', fontSize: 14, color: colors.gray, marginTop: 20, fontStyle: 'italic' },
});
