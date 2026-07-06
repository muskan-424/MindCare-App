import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import api from '../../../utils/apiClient';
import { colors } from '../../../constants/theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useTranslation from '../../../utils/i18n';
import { formatDateTime } from '../../../utils/locale';

const GroupSessionsScreen = ({ navigation }) => {
  const { t, language } = useTranslation();
  const [myGroups, setMyGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('registered'); // registered | discover

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [myRes, allRes] = await Promise.all([
        api.get('/api/groups/my-groups'),
        api.get('/api/groups'),
      ]);
      setMyGroups(myRes.data || []);
      setAllGroups(allRes.data || []);
    } catch (err) {
      console.error(err);
      Alert.alert(t('common.error'), t('groups.error_load'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openLink = async (url) => {
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('common.error'), t('groups.error_link'));
      }
    } catch (e) {
      Alert.alert(t('common.error'), t('groups.error_open_link'));
    }
  };

  const handleRegister = async (sessionId) => {
    try {
      await api.post(`/api/groups/${sessionId}/join`);
      Alert.alert(t('common.success'), t('groups.register_success'));
      loadData();
    } catch (err) {
      Alert.alert(t('common.error'), err.response?.data?.error || t('groups.error_register'));
    }
  };

  const renderItem = ({ item }) => {
    const d = new Date(item.scheduledDate);
    const isRegistered = myGroups.some((g) => g._id === item._id);
    const isFull = (item.participants || []).length >= (item.maxParticipants || 10);
    const spotsFilled = (item.participants || []).length;
    const maxSpots = item.maxParticipants || 10;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.date}>
            {formatDateTime(d, language, { month: 'short', day: 'numeric' }, { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.desc}>{item.description}</Text>

        <View style={styles.facilitatorRow}>
          <MaterialCommunityIcons name="account-tie" size={18} color="#64748B" />
          <Text style={styles.facilitator}>{t('groups.led_by')} {item.facilitatorName}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.spotsBadge}>
            <MaterialCommunityIcons name="account-group" size={16} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.spotsText}>
              {spotsFilled} / {maxSpots} {t('groups.spots_filled')}
            </Text>
          </View>

          {activeTab === 'registered' ? (
            <TouchableOpacity style={styles.joinBtn} onPress={() => openLink(item.meetingLink)}>
              <Text style={styles.joinBtnText}>{t('groups.join_room')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.joinBtn,
                isRegistered && styles.registeredBtn,
                !isRegistered && isFull && styles.fullBtn,
              ]}
              disabled={isRegistered || isFull}
              onPress={() => handleRegister(item._id)}
            >
              <Text style={[styles.joinBtnText, isRegistered && styles.registeredBtnText]}>
                {isRegistered ? t('groups.joined') : isFull ? t('groups.full') : t('groups.join')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('groups.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'registered' && styles.activeTab]}
          onPress={() => setActiveTab('registered')}
        >
          <Text style={[styles.tabText, activeTab === 'registered' && styles.activeTabText]}>
            {t('groups.registered')} ({myGroups.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
            {t('groups.explore')} ({allGroups.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'registered' ? myGroups : allGroups}
        keyExtractor={(item) => item._id || item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name={activeTab === 'registered' ? 'calendar-blank' : 'calendar-search'}
              size={64}
              color="#CBD5E1"
            />
            <Text style={styles.emptyText}>
              {activeTab === 'registered'
                ? t('groups.no_registered')
                : t('groups.no_sessions')}
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default GroupSessionsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFD' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFBFD' },
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
  headerTitle: { color: colors.secondary, fontSize: 18, fontWeight: '800' },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  tabText: { fontSize: 13, color: '#64748B', fontWeight: 'bold' },
  activeTabText: { color: colors.primary },
  list: { padding: 16, paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', marginTop: 16, color: '#94A3B8', fontSize: 15, lineHeight: 22 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap' },
  title: { fontSize: 16, fontWeight: '800', color: colors.secondary, flex: 1, marginRight: 8 },
  date: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  desc: { fontSize: 13, color: '#475569', marginBottom: 12, lineHeight: 18 },
  facilitatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  facilitator: { marginLeft: 6, fontSize: 12, color: '#64748B', fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spotsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  spotsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  joinBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  registeredBtn: { backgroundColor: '#ECEFF1' },
  fullBtn: { backgroundColor: '#F1F5F9' },
  joinBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 13 },
  registeredBtnText: { color: '#78909C' },
});
