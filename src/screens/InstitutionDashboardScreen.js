import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Dimensions,
} from 'react-native';
import api from '../utils/apiClient';
import { colors } from '../constants/theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const InstitutionDashboardScreen = ({ route, navigation }) => {
  const { institutionId } = route.params || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReport = useCallback(async () => {
    try {
      const res = await api.get(`/api/institutions/${institutionId}/report`);
      setData(res.data);
    } catch (e) {
      console.error(e);
      Alert.alert('Privacy Protection', e.response?.data?.error || 'Failed to load report.');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [institutionId, navigation]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReport();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!data) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={26} color={colors.white} />
        </TouchableOpacity>
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.headerTitle}>{data.institutionName}</Text>
          <Text style={styles.headerSub}>Institution Oversight Dashboard</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{data.memberCount}</Text>
            <Text style={styles.statLbl}>Members</Text>
          </View>
          <View style={[styles.statCard, { borderLeftWidth: 1, borderLeftColor: '#eee' }]}>
            <Text style={[styles.statVal, { color: '#4CAF50' }]}>
              {data.moodTrends.length > 0 ? (data.moodTrends.reduce((a, b) => a + b.value, 0) / data.moodTrends.length).toFixed(1) : 'N/A'}
            </Text>
            <Text style={styles.statLbl}>Avg Mood</Text>
          </View>
        </View>

        {/* Top Concerns (Anonymized) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Anonymized Concerns</Text>
          <Text style={styles.sectionDesc}>Frequency of concerns across your entire member set.</Text>
          {data.topConcerns.map((c, i) => (
            <View key={c.concern} style={styles.concernRow}>
              <View style={styles.concernInfo}>
                <Text style={styles.concernName}>{c.concern}</Text>
                <Text style={styles.concernCount}>{c.count} members</Text>
              </View>
              <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${(c.count / data.memberCount) * 100}%` }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Risk Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Exposure (Last 30 Days)</Text>
          <View style={styles.riskGrid}>
            {data.riskDistribution.map(r => (
              <View key={r.level} style={styles.riskItem}>
                <Text style={[styles.riskLevel, { color: r.level === 'CRITICAL' ? '#D32F2F' : r.level === 'HIGH' ? '#F57C00' : '#455A64' }]}>
                  {r.level}
                </Text>
                <Text style={styles.riskCount}>{r.count}</Text>
              </View>
            ))}
            {data.riskDistribution.length === 0 && <Text style={styles.empty}>No recent risk reports.</Text>}
          </View>
        </View>

        {/* Privacy Shield Info */}
        <View style={styles.privacyMsg}>
          <MaterialCommunityIcons name="shield-check" size={20} color="#666" />
          <Text style={styles.privacyText}>
            This data is anonymized and aggregated. Individual user names, profile pictures, and journal contents are protected and never shared with institution administrators.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default InstitutionDashboardScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#1E1E2C',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  statLbl: { fontSize: 12, color: '#666', marginTop: 4, fontWeight: '600' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  sectionDesc: { fontSize: 12, color: '#999', marginBottom: 15 },
  concernRow: { marginBottom: 12 },
  concernInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  concernName: { fontSize: 14, fontWeight: '600', color: '#333' },
  concernCount: { fontSize: 12, color: '#666' },
  barContainer: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  riskGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  riskItem: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 10, minWidth: (width - 80) / 3 },
  riskLevel: { fontSize: 11, fontWeight: 'bold' },
  riskCount: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  empty: { fontSize: 13, color: '#999', fontStyle: 'italic' },
  privacyMsg: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#F0F0F0', borderRadius: 10, borderLeftWidth: 4, borderLeftColor: '#666' },
  privacyText: { flex: 1, fontSize: 11, color: '#666', lineHeight: 16 },
});
