import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Switch, RefreshControl
} from 'react-native';
import api from '../utils/apiClient';
import { colors } from '../constants/theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const PeerMatchingScreen = ({ navigation }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('discover'); // discover | requests | peers

  const loadData = useCallback(async () => {
    try {
      // 1. Get profile status
      const profileRes = await api.get('/api/profile/me');
      setIsEnabled(profileRes.data.isPeerMatchingEnabled || false);

      if (profileRes.data.isPeerMatchingEnabled) {
        const [sugRes, reqRes, peerRes] = await Promise.all([
          api.get('/api/peers/suggestions'),
          api.get('/api/peers/requests'),
          api.get('/api/peers/list')
        ]);
        setSuggestions(sugRes.data || []);
        setRequests(reqRes.data || { incoming: [], outgoing: [] });
        setPeers(peerRes.data || []);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load community data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => {
      setRefreshing(true);
      loadData();
  };

  const toggleMatching = async (value) => {
    setLoading(true);
    try {
      await api.patch('/api/profile/update', { isPeerMatchingEnabled: value });
      setIsEnabled(value);
      if (value) {
          loadData();
      } else {
          setSuggestions([]);
          setRequests({ incoming: [], outgoing: [] });
          setPeers([]);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update preferences.');
    }
    setLoading(false);
  };

  const handleConnect = async (userId) => {
    try {
      await api.post(`/api/peers/connect/${userId}`);
      Alert.alert('Request Sent', 'We will notify you if they accept!');
      loadData();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to send request.');
    }
  };

  const handleRequestAction = async (requestId, status) => {
    try {
      await api.patch(`/api/peers/requests/${requestId}`, { status });
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to process request.');
    }
  };

  if (loading && !refreshing) {
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={26} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Peer Matching</Text>
      </View>

      {/* Opt-in Card */}
      <View style={styles.optInCard}>
        <View style={styles.optInRow}>
          <View style={styles.optInInfo}>
            <Text style={styles.optInTitle}>Enable Community Discovery</Text>
            <Text style={styles.optInSub}>Allow others with similar concerns to find and connect with you.</Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={toggleMatching}
            trackColor={{ false: '#767577', true: colors.primary }}
          />
        </View>
      </View>

      {!isEnabled ? (
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-group-outline" size={100} color={colors.gray3} />
          <Text style={styles.emptyTitle}>Join the Community</Text>
          <Text style={styles.emptyDesc}>Enable discovery to find peers who understand your journey and share similar mental health goals.</Text>
          <TouchableOpacity style={styles.enableBtn} onPress={() => toggleMatching(true)}>
            <Text style={styles.enableBtnText}>Enable Now</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <>
          {/* Tabs */}
          <View style={styles.tabRow}>
            {['discover', 'requests', 'peers'].map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'requests' && requests.incoming.length > 0 && ` (${requests.incoming.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {activeTab === 'discover' && (
              <>
                {suggestions.length === 0 ? (
                  <View style={styles.emptyState}>
                    <AntDesign name="search1" size={50} color={colors.gray} />
                    <Text style={styles.emptyStateText}>No new suggestions right now. Check back later!</Text>
                  </View>
                ) : (
                  suggestions.map(s => (
                    <View key={s.userId} style={styles.peerCard}>
                      <View style={styles.peerHeader}>
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>{s.name[0]}</Text>
                        </View>
                        <View style={styles.peerInfo}>
                          <Text style={styles.peerName}>{s.name}</Text>
                          <View style={styles.concernRow}>
                            {s.sharedConcerns.map(c => (
                              <View key={c} style={styles.concernBadge}>
                                <Text style={styles.concernLabel}>{c}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>
                      <Text style={styles.peerBio} numberOfLines={2}>{s.peerBio || "No bio provided."}</Text>
                      <TouchableOpacity style={styles.connectBtn} onPress={() => handleConnect(s.userId)}>
                        <Text style={styles.connectBtnText}>Send Connection Request</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </>
            )}

            {activeTab === 'requests' && (
              <>
                <Text style={styles.sectionTitle}>Incoming Requests</Text>
                {requests.incoming.length === 0 ? (
                  <Text style={styles.emptySub}>No pending requests.</Text>
                ) : (
                  requests.incoming.map(r => (
                    <View key={r.requestId} style={styles.requestCard}>
                      <Text style={styles.reqName}>{r.userName} wants to connect</Text>
                      <Text style={styles.reqSub}>Shares: {r.sharedConcerns.join(', ')}</Text>
                      <View style={styles.reqActions}>
                        <TouchableOpacity style={[styles.reqBtn, styles.acceptBtn]} onPress={() => handleRequestAction(r.requestId, 'accepted')}>
                          <Text style={styles.reqBtnText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.reqBtn, styles.declineBtn]} onPress={() => handleRequestAction(r.requestId, 'declined')}>
                          <Text style={[styles.reqBtnText, { color: '#F4511E' }]}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}

                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Sent Requests</Text>
                {requests.outgoing.length === 0 ? (
                  <Text style={styles.emptySub}>No active outgoing requests.</Text>
                ) : (
                  requests.outgoing.map(o => (
                    <View key={o.requestId} style={styles.requestCard}>
                      <Text style={styles.reqName}>Pending: {o.userName}</Text>
                      <Text style={styles.reqSub}>Waiting for them to respond...</Text>
                    </View>
                  ))
                )}
              </>
            )}

            {activeTab === 'peers' && (
              <>
                {peers.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="human-handsup" size={60} color={colors.gray} />
                    <Text style={styles.emptyStateText}>You haven't connected with anyone yet.</Text>
                  </View>
                ) : (
                  peers.map(p => (
                    <View key={p.userId} style={styles.peerCard}>
                      <View style={styles.peerHeader}>
                        <View style={[styles.avatarPlaceholder, { backgroundColor: '#81C784' }]}>
                          <Text style={styles.avatarText}>{p.userName[0]}</Text>
                        </View>
                        <View style={styles.peerInfo}>
                          <Text style={styles.peerName}>{p.userName}</Text>
                          <Text style={styles.peerSub}>Connected since {new Date(p.connectedAt).toLocaleDateString()}</Text>
                        </View>
                        <TouchableOpacity style={styles.chatBtn}>
                          <MaterialCommunityIcons name="chat-outline" size={24} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
};

export default PeerMatchingScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  optInCard: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16, elevation: 2 },
  optInRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optInInfo: { flex: 1, marginRight: 10 },
  optInTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  optInSub: { fontSize: 12, color: '#666', marginTop: 4 },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  tabText: { fontSize: 13, color: '#666', fontWeight: 'bold' },
  activeTabText: { color: colors.primary },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  peerCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
  peerHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  peerInfo: { marginLeft: 15, flex: 1 },
  peerName: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  peerSub: { fontSize: 12, color: '#666', marginTop: 2 },
  concernRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5, gap: 5 },
  concernBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  concernLabel: { fontSize: 10, color: '#2E7D32', fontWeight: 'bold' },
  peerBio: { fontSize: 14, color: '#444', marginVertical: 12, lineHeight: 20 },
  connectBtn: { backgroundColor: colors.accent, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  connectBtnText: { color: colors.primary, fontWeight: 'bold' },
  requestCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: colors.primary },
  reqName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  reqSub: { fontSize: 12, color: '#666', marginTop: 4 },
  reqActions: { flexDirection: 'row', marginTop: 12, gap: 10 },
  reqBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  acceptBtn: { backgroundColor: colors.primary },
  declineBtn: { backgroundColor: '#F4511E15' },
  reqBtnText: { color: '#fff', fontWeight: 'bold' },
  emptySub: { fontStyle: 'italic', color: '#999', marginVertical: 10 },
  chatBtn: { padding: 8 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 20 },
  emptyDesc: { fontSize: 15, color: '#666', textAlign: 'center', marginTop: 15, lineHeight: 22 },
  enableBtn: { backgroundColor: colors.primary, marginTop: 30, paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 },
  enableBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyStateText: { color: '#999', marginTop: 15, textAlign: 'center' }
});
