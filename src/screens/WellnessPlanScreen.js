import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { connect } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../utils/apiClient';
import { colors } from '../constants/theme';

const GOALS_LIST = [
  'Reduce Anxiety', 'Better Sleep', 'Manage Work Stress',
  'Improve Focus', 'Overcome Burnout', 'Build Self-Esteem'
];

const PACES = ['Relaxed', 'Moderate', 'Intense'];

const TASK_ICONS = {
  breathing: 'weather-windy',
  journal: 'book-open-page-variant',
  meditation: 'meditation',
  reading: 'glasses',
  activity: 'run',
  custom: 'star',
};

const WellnessPlanScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState(null);

  // Questionnaire state
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [struggles, setStruggles] = useState('');
  const [pace, setPace] = useState('Moderate');
  const [submitting, setSubmitting] = useState(false);

  // Active Plan UI state
  const [activeDay, setActiveDay] = useState(1);
  const [togglingTask, setTogglingTask] = useState(null);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/wellness');
      if (res.data && res.data.exists) {
        setPlanData(res.data);
        if (res.data.status === 'active' && res.data.dailyPlans) {
          // Find the earliest day that isn't fully complete, or default to day 1
          const firstIncomplete = res.data.dailyPlans.find(
            d => d.tasks.some(t => !t.completed)
          );
          setActiveDay(firstIncomplete ? firstIncomplete.dayNumber : 1);
        }
      } else {
        setPlanData(null);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not load your wellness plan.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  const toggleGoal = (goal) => {
    setSelectedGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const submitRequest = async () => {
    if (selectedGoals.length === 0) {
      Alert.alert('Required', 'Please select at least one goal.');
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
      Alert.alert('Error', e.response?.data?.error || 'Failed to submit request.');
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
        // Optimistically update local state
        setPlanData(prev => {
          const newPlan = { ...prev, progress: res.data.totalTasksCompleted };
          const newDays = prev.dailyPlans.map(d => {
            if (d._id === dayId) {
              return {
                ...d,
                tasks: d.tasks.map(t => t._id === task._id ? { ...t, completed: !task.completed } : t)
              };
            }
            return d;
          });
          newPlan.dailyPlans = newDays;
          return newPlan;
        });
      }
    } catch (e) {
      Alert.alert('Error', 'Could not update task.');
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

  // 1️⃣ Render Questionnaire if no plan
  if (!planData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wellness Plan</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.questionCard}>
            <Text style={styles.title}>Request a Custom Plan 🧘</Text>
            <Text style={styles.subtitle}>
              Answer a few questions and our care team will curate a 30-day wellness routine just for you.
            </Text>

            <Text style={styles.label}>1. What are your main goals? (Select at least one) *</Text>
            <View style={styles.chipsWrap}>
              {GOALS_LIST.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, selectedGoals.includes(g) && styles.chipActive]}
                  onPress={() => toggleGoal(g)}
                >
                  <Text style={[styles.chipText, selectedGoals.includes(g) && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>2. Tell us about your current struggles (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Having panic attacks at work..."
              value={struggles}
              onChangeText={setStruggles}
              multiline
              textAlignVertical="top"
              placeholderTextColor={colors.gray}
            />

            <Text style={styles.label}>3. Preferred Pace</Text>
            <View style={styles.paceRow}>
              {PACES.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.paceBtn, pace === p && styles.paceBtnActive]}
                  onPress={() => setPace(p)}
                >
                  <Text style={[styles.paceText, pace === p && styles.paceTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={submitRequest}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 2️⃣ Render Awaiting Admin
  if (planData.status === 'awaiting_admin') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wellness Plan</Text>
        </View>
        <View style={styles.centeredPending}>
          <MaterialCommunityIcons name="clipboard-text-clock" size={60} color={colors.primary} />
          <Text style={styles.pendingTitle}>Plan is being built...</Text>
          <Text style={styles.pendingText}>
            Our team is reviewing your goals and creating a custom 30-day routine for you. Check back soon!
          </Text>
          <View style={styles.pendingGoalsBox}>
            <Text style={styles.pendingGoalsLabel}>Your focus areas:</Text>
            {planData.goals.map(g => <Text key={g} style={styles.pendingGoalItem}>• {g}</Text>)}
          </View>
        </View>
      </View>
    );
  }

  // 3️⃣ Render Active Plan
  const currentDayData = planData.dailyPlans?.find(d => d.dayNumber === activeDay) || null;
  const totalTasks = planData.dailyPlans?.reduce((acc, d) => acc + d.tasks.length, 0) || 1;
  const progressPercent = Math.round((planData.progress / totalTasks) * 100);

  return (
    <View style={styles.container}>
      {/* Dynamic Header */}
      <View style={[styles.header, { paddingBottom: 24 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Wellness Plan</Text>
            <Text style={styles.headerFocus}>{planData.planFocus}</Text>
          </View>
        </View>

        <View style={styles.progressBox}>
          <View style={styles.progressTextRow}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={styles.progressValue}>{progressPercent}% ({planData.progress}/{totalTasks})</Text>
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

      {/* Days Timeline Horizontal Scroll */}
      <View style={styles.timelineWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timelineScroll}>
          {planData.dailyPlans?.map(d => {
            const allDone = d.tasks.length > 0 && d.tasks.every(t => t.completed);
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
                <Text style={[styles.dayCircleLabel, isActive && styles.dayCircleLabelActive, allDone && { color: colors.white }]}>Day</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tasks for Active Day */}
      <ScrollView contentContainerStyle={styles.tasksScroll}>
        <Text style={styles.dayTitle}>Day {activeDay} Routine</Text>
        
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
          <Text style={styles.emptyTasksHint}>No tasks assigned for this day. Rest up! 💤</Text>
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
  
  // Pending UI
  centeredPending: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  pendingTitle: { fontSize: 22, fontWeight: '800', color: colors.secondary, marginTop: 16, marginBottom: 8 },
  pendingText: { fontSize: 14, color: colors.gray, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  pendingGoalsBox: { backgroundColor: colors.white, padding: 16, borderRadius: 12, width: '100%', elevation: 1 },
  pendingGoalsLabel: { fontSize: 14, fontWeight: '700', color: colors.secondary, marginBottom: 8 },
  pendingGoalItem: { fontSize: 14, color: colors.primary, fontWeight: '500', marginBottom: 4 },

  // Active Plan UI
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
