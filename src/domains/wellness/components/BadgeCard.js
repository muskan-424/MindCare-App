import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../../constants/theme';
import useTranslation from '../../../utils/i18n';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2-column grid layout

const BadgeCard = ({ label, icon, color, desc, earnedAt, locked }) => {
  const { t, language } = useTranslation();
  const badgeColor = color || colors.primary;
  const earnedDate = earnedAt
    ? new Date(earnedAt).toLocaleDateString(language, { month: 'short', day: 'numeric' })
    : '';

  return (
    <View style={[styles.card, locked && styles.lockedCard]}>
      {/* Badge Icon Wrapper */}
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: locked ? '#ECEFF1' : `${badgeColor}15` },
          !locked && { borderColor: badgeColor, borderWidth: 1.5 },
        ]}
      >
        <MaterialCommunityIcons
          name={locked ? 'lock' : icon || 'trophy'}
          size={32}
          color={locked ? '#90A4AE' : badgeColor}
        />
      </View>

      {/* Badge Details */}
      <Text style={[styles.label, locked && styles.lockedText]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.desc} numberOfLines={2}>
        {desc}
      </Text>

      {/* Status or Earned Date */}
      {locked ? (
        <View style={styles.lockedBadge}>
          <Text style={styles.lockedBadgeText}>{t('badges.locked')}</Text>
        </View>
      ) : (
        <Text style={styles.earnedDate}>
          {t('badges.earned_on', { date: earnedDate })}
        </Text>
      )}
    </View>
  );
};

export default BadgeCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    width: cardWidth,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  lockedCard: {
    backgroundColor: '#FAFBFD',
    borderColor: '#E2E8F0',
    elevation: 0,
    shadowOpacity: 0,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  lockedText: {
    color: '#64748B',
  },
  desc: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 15,
    height: 30, // Fits exactly 2 lines
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  earnedDate: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  lockedBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  lockedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
});
