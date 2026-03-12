import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import api from '../utils/apiClient';
import { colors } from '../constants/theme';

// IMPORTANT: ADMIN_TOKEN must match process.env.ADMIN_TOKEN on the backend
const ADMIN_TOKEN = 'CHANGE_ME_ADMIN_TOKEN';

const AdminDashboardScreen = () => {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [issues, setIssues] = useState([]);
  const [moods, setMoods] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      setError('');
      try {
        const res = await api.get('/api/admin/users', {
          headers: { 'x-admin-token': ADMIN_TOKEN },
        });
        setUsers(res.data || []);
      } catch (e) {
        setError(e.response?.data?.error || e.message || 'Failed to load users');
      }
      setLoadingUsers(false);
    };
    loadUsers();
  }, []);

  const selectUser = async (user) => {
    setSelected(user);
    setLoadingDetails(true);
    setError('');
    try {
      const [issuesRes, moodsRes] = await Promise.all([
        api.get('/api/admin/issues', {
          params: { userId: user.id },
          headers: { 'x-admin-token': ADMIN_TOKEN },
        }),
        api.get('/api/admin/mood', {
          params: { userId: user.id },
          headers: { 'x-admin-token': ADMIN_TOKEN },
        }),
      ]);
      setIssues(issuesRes.data || []);
      setMoods(moodsRes.data || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to load user data');
    }
    setLoadingDetails(false);
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        selected?.id === item.id && styles.userItemSelected,
      ]}
      onPress={() => selectUser(item)}
      activeOpacity={0.8}>
      <Text style={styles.userName}>{item.name}</Text>
      <Text style={styles.userEmail}>{item.email}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MindCare Admin</Text>
        <Text style={styles.headerSubtitle}>User assessments & mood history</Text>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={styles.content}>
        <View style={styles.userList}>
          <Text style={styles.sectionTitle}>Users</Text>
          {loadingUsers ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => item.id}
              renderItem={renderUserItem}
            />
          )}
        </View>
        <View style={styles.details}>
          {!selected ? (
            <Text style={styles.placeholderText}>
              Select a user to view check-ins and mood history.
            </Text>
          ) : (
            <ScrollView contentContainerStyle={styles.detailsScroll}>
              <Text style={styles.detailsName}>{selected.name}</Text>
              <Text style={styles.detailsEmail}>{selected.email}</Text>

              <Text style={styles.detailsSection}>AI Assessments</Text>
              {loadingDetails ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
              ) : issues.length === 0 ? (
                <Text style={styles.placeholderText}>No assessments yet.</Text>
              ) : (
                issues.map((r) => (
                  <View key={r.id} style={styles.card}>
                    <Text style={styles.cardTitle}>
                      {new Date(r.createdAt).toLocaleString()}
                    </Text>
                    <Text style={styles.cardText}>
                      Category: <Text style={styles.cardHighlight}>{r.category}</Text> ·
                      Severity: <Text style={styles.cardHighlight}>{r.severity}</Text> ·
                      Risk: <Text style={styles.cardHighlight}>{r.riskLevel}</Text>
                    </Text>
                    {r.moodTag ? (
                      <Text style={styles.cardText}>Mood tag: {r.moodTag}</Text>
                    ) : null}
                    {r.description ? (
                      <Text style={styles.cardText}>Note: {r.description}</Text>
                    ) : null}
                  </View>
                ))
              )}

              <Text style={styles.detailsSection}>Mood history</Text>
              {loadingDetails ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
              ) : moods.length === 0 ? (
                <Text style={styles.placeholderText}>No mood entries yet.</Text>
              ) : (
                moods.map((m) => (
                  <View key={m.id} style={styles.card}>
                    <Text style={styles.cardTitle}>
                      {new Date(m.date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.cardText}>
                      Rating: <Text style={styles.cardHighlight}>{m.rating}</Text>
                    </Text>
                    {m.note ? (
                      <Text style={styles.cardText}>Note: {m.note}</Text>
                    ) : null}
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
};

export default AdminDashboardScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: {
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.white2,
    marginTop: 2,
  },
  errorText: {
    color: colors.redPink,
    fontSize: 13,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  content: { flex: 1, flexDirection: 'row' },
  userList: {
    width: '40%',
    borderRightWidth: 1,
    borderRightColor: colors.gray3,
    paddingTop: 8,
  },
  details: { flex: 1, padding: 10 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  userItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  userItemSelected: {
    backgroundColor: colors.accent,
  },
  userName: { fontSize: 14, fontWeight: '600', color: colors.secondary },
  userEmail: { fontSize: 12, color: colors.gray },
  placeholderText: {
    fontSize: 13,
    color: colors.gray,
    marginTop: 12,
  },
  detailsScroll: { paddingBottom: 20 },
  detailsName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.secondary,
  },
  detailsEmail: {
    fontSize: 13,
    color: colors.gray,
    marginBottom: 8,
  },
  detailsSection: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.secondary,
    marginTop: 12,
    marginBottom: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 2,
  },
  cardText: {
    fontSize: 12,
    color: colors.gray,
  },
  cardHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },
});

