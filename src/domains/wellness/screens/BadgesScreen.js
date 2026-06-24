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
import useTranslation from '../../../utils/i18n';

const ALL_BADGE_KEYS = [
  { key: 'first_checkin',   labelKey: 'badges.first_checkin_label',       icon: 'star-face',          color: '#F59E0B', descKey: 'badges.first_checkin_desc' },
  { key: 'week_warrior',    labelKey: 'badges.week_warrior_label',        icon: 'fire',               color: '#EF4444', descKey: 'badges.week_warrior_desc' },
  { key: 'fortnight_focus', labelKey: 'badges.fortnight_focus_label',     icon: 'calendar-check',     color: '#8B5CF6', descKey: 'badges.fortnight_focus_desc' },
  { key: 'monthly_master',  labelKey: 'badges.monthly_master_label',      icon: 'crown',              color: '#10B981', descKey: 'badges.monthly_master_desc' },
  { key: 'mood_explorer',   labelKey: 'badges.mood_explorer_label',       icon: 'compass',            color: '#3B82F6', descKey: 'badges.mood_explorer_desc' },
  { key: 'consistent_50',   labelKey: 'badges.consistent_50_label',       icon: 'brain',              color: '#EC4899', descKey: 'badges.consistent_50_desc' },
  { key: 'centurion',       labelKey: 'badges.centurion_label',           icon: 'shield-star',        color: '#F97316', descKey: 'badges.centurion_desc' },
];

const BadgesScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const { t } = useTranslation();
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

  const fullBadges = ALL_BADGE_KEYS.map(meta => {
    const earnedBadge = badges.find(b => b.key === meta.key);
    return {
      ...meta,
      label: t(meta.labelKey),
      desc: t(meta.descKey),
      earnedAt: earnedBadge ? earnedBadge.earnedAt : null,
      locked: !earnedKeys.has(meta.key),
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('badges.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statsPanel}>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="fire" size={32} color="#FF6D00" />
            <Text style={styles.statNum}>{currentStreak}</Text>
            <Text style={styles.statLabel}>{t('badges.current_streak')}</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxBorder]}>
            <MaterialCommunityIcons name="trophy-outline" size={32} color="#F59E0B" />
            <Text style={styles.statNum}>{longestStreak}</Text>
            <Text style={styles.statLabel}>{t('badges.longest_streak')}</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="check-all" size={32} color="#10B981" />
            <Text style={styles.statNum}>{totalCheckins}</Text>
            <Text style={styles.statLabel}>{t('badges.total_logs')}</Text>
          </View>
        </View>

        {(nextStreakGoal || nextCheckinGoal) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('badges.next_milestone')}</Text>
            {nextStreakGoal && (
              <View style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalTitleCont}>
                    <MaterialCommunityIcons name={nextStreakGoal.icon || 'trophy'} size={20} color={nextStreakGoal.color} style={{ marginRight: 6 }} />
                    <Text style={styles.goalLabel}>{nextStreakGoal.label}</Text>
                  </View>
                  <Text style={styles.goalProgressText}>
                    {t('badges.days_progress', { progress: nextStreakGoal.progress, target: nextStreakGoal.target })}
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
                    {t('badges.logs_progress', { progress: nextCheckinGoal.progress, target: nextCheckinGoal.target })}
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('badges.your_badges', { earned: badges.length, total: ALL_BADGE_KEYS.length })}</Text>
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
