import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../../utils/apiClient';
import { colors } from '../../../constants/theme';
import useTranslation from '../../../utils/i18n';

const StreakBanner = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { t } = useTranslation();
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFocused) {
      fetchStreakData();
    }
  }, [isFocused]);

  const fetchStreakData = async () => {
    try {
      const res = await api.get('/api/streaks/me');
      setStreakData(res.data);
    } catch (err) {
      console.warn('Error fetching streak data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingCont]}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  }

  if (!streakData) return null;

  const { currentStreak, nextStreakGoal } = streakData;
  const progressPercent = nextStreakGoal
    ? Math.min(100, Math.round((nextStreakGoal.progress / nextStreakGoal.target) * 100))
    : 100;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('Badges')}
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <View style={styles.streakInfo}>
          <View style={styles.fireBadge}>
            <MaterialCommunityIcons name="fire" size={28} color="#FF6D00" />
            <Text style={styles.streakCount}>{currentStreak}</Text>
          </View>
          <View style={styles.textColumn}>
            <Text style={styles.titleText}>
              {currentStreak > 0
                ? t('streak.day_streak', { count: currentStreak })
                : t('streak.start_today')}
            </Text>
            <Text style={styles.subtitleText}>
              {currentStreak > 0
                ? t('streak.subtitle_active')
                : t('streak.subtitle_inactive')}
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.secondary} />
      </View>

      {nextStreakGoal && (
        <View style={styles.progressSection}>
          <View style={styles.goalInfoRow}>
            <Text style={styles.goalText}>
              {t('streak.next_label', { label: nextStreakGoal.label })}
            </Text>
            <Text style={styles.progressText}>
              {t('streak.days_progress', { progress: nextStreakGoal.progress, target: nextStreakGoal.target })}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default StreakBanner;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3FBF2',
    borderColor: '#E2F3E1',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  loadingCont: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fireBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEAD2',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 12,
  },
  streakCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E65100',
    marginLeft: 4,
  },
  textColumn: {
    flex: 1,
    paddingRight: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
  },
  subtitleText: {
    fontSize: 12,
    color: '#556652',
    marginTop: 2,
  },
  progressSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2F3E1',
    paddingTop: 10,
  },
  goalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalText: {
    fontSize: 12,
    color: '#556652',
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2F3E1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
});
