import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../../utils/apiClient';
import { colors, sizes } from '../../../constants/theme';
import BadgeCard from '../components/BadgeCard';

// Define the static list of all badges so we can show locked ones
const ALL_BADGE_KEYS = [
  { key: 'first_checkin',   label: 'First Step',       icon: 'star-face',          color: '#F59E0B', desc: 'Logged your first mood check-in' },
  { key: 'week_warrior',    label: 'Week Warrior',      icon: 'fire',               color: '#EF4444', desc: 'Maintained a 7-day streak' },
  { key: 'fortnight_focus', label: 'Fortnight Focus',   icon: 'calendar-check',     color: '#8B5CF6', desc: 'Maintained a 14-day streak' },
  { key: 'monthly_master',  label: 'Monthly Master',    icon: 'crown',              color: '#10B981', desc: 'Maintained a 30-day streak' },
  { key: 'mood_explorer',   label: 'Mood Explorer',     icon: 'compass',            color: '#3B82F6', desc: 'Logged 10 mood check-ins' },
  { key: 'consistent_50',   label: 'Consistent Mind',   icon: 'brain',              color: '#EC4899', desc: 'Logged 50 mood check-ins' },
  { key: 'centurion',       label: 'Centurion',         icon: 'shield-star',        color: '#F97316', desc: 'Logged 100 mood check-ins' },
];

const BadgesScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    try {
      const res = await api.get('/api/streaks/me');
      setData(res.data);
      
      // Clear badge alerts on view
      await api.patch('/api/streaks/seen');
    } catch (err) {
      console.warn('Error loading badges:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const { currentStreak, longestStreak, totalCheckins, badges = [], nextStreakGoal, nextCheckinGoal } = data || {};
  const earnedKeys = new Set((badges || []).map(b => b.key));

  // Build full list of badges: if earned, include earnedAt, otherwise mark locked
  const fullBadges = ALL_BADGE_KEYS.map(meta => {
    const earnedBadge = badges.find(b => b.key === meta.key);
    return {
      ...meta,
      earnedAt: earnedBadge ? earnedBadge.earnedAt : null,
      locked: !earnedKeys.has(meta.key),
    };
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements & Streaks</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats Summary Panel */}
        <View style={styles.statsPanel}>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="fire" size={32} color="#FF6D00" />
            <Text style={styles.statNum}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxBorder]}>
            <MaterialCommunityIcons name="trophy-outline" size={32} color="#F59E0B" />
            <Text style={styles.statNum}>{longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="check-all" size={32} color="#10B981" />
            <Text style={styles.statNum}>{totalCheckins}</Text>
            <Text style={styles.statLabel}>Total Logs</Text>
          </View>
        </View>

        {/* Goals Progress */}
        {(nextStreakGoal || nextCheckinGoal) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Milestone Goals</Text>
            {nextStreakGoal && (
              <View style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalTitleCont}>
                    <MaterialCommunityIcons name={nextStreakGoal.icon || 'trophy'} size={20} color={nextStreakGoal.color} style={{ marginRight: 6 }} />
                    <Text style={styles.goalLabel}>{nextStreakGoal.label}</Text>
                  </View>
                  <Text style={styles.goalProgressText}>
                    {nextStreakGoal.progress} / {nextStreakGoal.target} days
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: nextStreakGoal.color,
                        width: `${Math.min(100, (nextStreakGoal.progress / nextStreakGoal.target) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.goalDesc}>{nextStreakGoal.desc}</Text>
              </View>
            )}

            {nextCheckinGoal && (
              <View style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalTitleCont}>
                    <MaterialCommunityIcons name={nextCheckinGoal.icon || 'trophy'} size={20} color={nextCheckinGoal.color} style={{ marginRight: 6 }} />
                    <Text style={styles.goalLabel}>{nextCheckinGoal.label}</Text>
                  </View>
                  <Text style={styles.goalProgressText}>
                    {nextCheckinGoal.progress} / {nextCheckinGoal.target} logs
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: nextCheckinGoal.color,
                        width: `${Math.min(100, (nextCheckinGoal.progress / nextCheckinGoal.target) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.goalDesc}>{nextCheckinGoal.desc}</Text>
              </View>
            )}
          </View>
        )}

        {/* Badges Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Badges ({badges.length} / {ALL_BADGE_KEYS.length})</Text>
          <View style={styles.badgesGrid}>
            {fullBadges.map(item => (
              <BadgeCard
                key={item.key}
                label={item.label}
                icon={item.icon}
                color={item.color}
                desc={item.desc}
                earnedAt={item.earnedAt}
                locked={item.locked}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default BadgesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBFD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.secondary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  statsPanel: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    margin: 16,
    borderRadius: 20,
    paddingVertical: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBoxBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: 14,
  },
  goalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalTitleCont: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.secondary,
  },
  goalProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
