import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { connect } from 'react-redux';
import { LineChart, BarChart, ProgressChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../utils/apiClient';
import { colors } from '../constants/theme';

const screenWidth = Dimensions.get('window').width;

const EmotionalFingerprintScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchFingerprint();
  }, []);

  const fetchFingerprint = async () => {
    try {
      const res = await api.get('/api/analytics/fingerprint');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch fingerprint:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5c3ab6" />
        <Text style={styles.loadingText}>Unlocking your emotional patterns...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconWrap}>
          <Icon name="alert-circle-outline" size={48} color="#FF7675" />
        </View>
        <Text style={styles.errorTitle}>Not Enough Data Yet</Text>
        <Text style={styles.errorText}>Keep tracking your mood for a few more days to view your dynamic emotional signature.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(92, 58, 182, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    labelColor: (opacity = 1) => `rgba(60, 64, 72, ${opacity})`,
  };

  const safeNum = (val, fallback) => {
    const n = Number(val);
    return isNaN(n) ? fallback : n;
  };

  const velocity = safeNum(data.metrics?.recoveryVelocityHours, 48);
  const stability = safeNum(data.metrics?.sentimentStability, 0.5);
  const sleep = safeNum(data.metrics?.sleepQualityScore, 3);

  const progressData = {
    labels: ["Resilience", "Stability", "Rest"],
    data: [
      Math.max(0, Math.min(1, 48 / (velocity === 0 ? 48 : velocity))),
      Math.max(0, Math.min(1, stability)),
      Math.max(0, Math.min(1, sleep / 5))
    ]
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color="#2D3436" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emotional Fingerprint</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Summary Card */}
        <View style={styles.premiumCard}>
          <View style={styles.signatureHeader}>
            <View style={styles.iconCircle}>
              <Icon name="fingerprint" size={36} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Your Emotional Profile</Text>
              <Text style={styles.cardSubtitle}>Analytics derived from your recent logs</Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <View style={styles.metricLabelRow}>
                <Icon name="timer-sand" size={16} color="#5c3ab6" style={{ marginRight: 4 }} />
                <Text style={styles.metricLabel}>Recovery Rate</Text>
              </View>
              <Text style={styles.metricValue}>{data.metrics?.recoveryVelocityHours || 0}h</Text>
            </View>
            <View style={[styles.metricItem, { borderLeftWidth: 1, borderLeftColor: '#f1f2f6' }]}>
              <View style={styles.metricLabelRow}>
                <Icon name="fire" size={16} color="#e17055" style={{ marginRight: 4 }} />
                <Text style={styles.metricLabel}>Burnout Risk</Text>
              </View>
              <Text style={[styles.metricValue, { color: (data.metrics?.burnoutRiskIndex || 0) > 0.6 ? '#d63031' : '#27ae60' }]}>
                {((data.metrics?.burnoutRiskIndex || 0) * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Chart */}
        <View style={styles.premiumCard}>
          <Text style={styles.sectionTitle}>✨ Resilience & Recovery Dynamics</Text>
          <ProgressChart
            data={progressData}
            width={screenWidth - 64}
            height={180}
            strokeWidth={16}
            radius={32}
            chartConfig={chartConfig}
            hideLegend={false}
          />
        </View>

        {/* Heatmap Card */}
        <View style={styles.premiumCard}>
          <Text style={styles.sectionTitle}>📊 Stress Distribution</Text>
          <BarChart
            data={{
              labels: Object.keys(data.insights?.stressHeatmap || {}).length > 0 ? Object.keys(data.insights.stressHeatmap) : ['None'],
              datasets: [{ data: Object.values(data.insights?.stressHeatmap || {}).length > 0 ? Object.values(data.insights.stressHeatmap).map(v => safeNum(v, 0)) : [0] }]
            }}
            width={screenWidth - 64}
            height={200}
            yAxisLabel=""
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(225, 112, 85, ${opacity})`,
            }}
            verticalLabelRotation={0}
            fromZero
          />
        </View>

        {/* Triggers Card */}
        <View style={styles.premiumCard}>
          <Text style={styles.sectionTitle}>⚠️ Identified Triggers</Text>
          {(data.insights?.commonTriggers || []).map((trigger, index) => (
            <View key={index} style={styles.triggerItem}>
              <View style={[styles.dot, { backgroundColor: index === 0 ? '#ff7675' : index === 1 ? '#e17055' : '#fdcb6e' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.triggerName}>{trigger.name}</Text>
                <Text style={styles.triggerCount}>{trigger.count} incidents logged</Text>
              </View>
            </View>
          ))}
          {(!data.insights?.commonTriggers || data.insights.commonTriggers.length === 0) && (
            <Text style={styles.noData}>No triggers identified yet.</Text>
          )}
        </View>

        {/* Insight Card */}
        <View style={[styles.premiumCard, styles.insightCard]}>
          <View style={styles.insightIconCircle}>
            <Icon name="lightbulb-on" size={24} color="#5c3ab6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.insightTitle}>Care Insight</Text>
            <Text style={styles.insightText}>
              You are typically most stress-prone on <Text style={{ fontWeight: '800', color: '#5c3ab6' }}>{data.insights?.stressProneDays?.join(' and ') || 'various days'}</Text>. 
              Focus on breathing exercises or talk to Tink around these periods to keep calm.
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFC' },
  loadingText: { marginTop: 15, color: '#2D3436', fontWeight: '600', fontSize: 15 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f2f6', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#2D3436' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  premiumCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#5c3ab6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(238, 241, 246, 0.8)',
  },
  signatureHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5c3ab6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#2D3436' },
  cardSubtitle: { fontSize: 12, color: '#636e72', marginTop: 3 },
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f2f6', paddingTop: 16 },
  metricItem: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  metricLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  metricLabel: { fontSize: 11, color: '#636e72', fontWeight: '600', textTransform: 'uppercase' },
  metricValue: { fontSize: 22, fontWeight: '900', color: '#2D3436' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#2D3436', marginBottom: 16 },
  triggerItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, backgroundColor: '#f9f9fb', padding: 12, borderRadius: 14 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  triggerName: { fontSize: 14, color: '#2D3436', fontWeight: '700' },
  triggerCount: { fontSize: 12, color: '#636e72', marginTop: 1 },
  insightCard: { backgroundColor: '#f0ecfc', flexDirection: 'row', alignItems: 'flex-start', borderColor: 'rgba(92, 58, 182, 0.1)', borderWidth: 1 },
  insightIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  insightTitle: { fontSize: 14, fontWeight: '800', color: '#5c3ab6', marginBottom: 3 },
  insightText: { fontSize: 13, color: '#2D3436', lineHeight: 19 },
  noData: { color: '#636e72', fontStyle: 'italic', textAlign: 'center', paddingVertical: 10 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#F9FAFC' },
  errorIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFEAA7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  errorTitle: { fontSize: 18, fontWeight: '800', color: '#2D3436', marginBottom: 8 },
  errorText: { fontSize: 14, color: '#636e72', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  backBtn: { backgroundColor: '#5c3ab6', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28, elevation: 2 },
  backBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});

const mapStateToProps = (state) => ({ auth: state.auth });
export default connect(mapStateToProps)(EmotionalFingerprintScreen);
