import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import api from '../utils/apiClient';
import { colors, fonts } from '../constants/theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const GroupSessionsScreen = ({ navigation }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/groups/my-groups');
      setGroups(res.data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load group sessions.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const openLink = async (url) => {
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this meeting link.');
      }
    } catch (e) {
      Alert.alert('Error', 'An error occurred trying to open the link.');
    }
  };

  const renderItem = ({ item }) => {
    const d = new Date(item.scheduledDate);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.date}>{d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <Text style={styles.desc}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <MaterialCommunityIcons name="account-group" size={20} color={colors.primary} />
            <Text style={styles.facilitator}>Led by {item.facilitatorName}</Text>
          </View>
          <TouchableOpacity style={styles.joinBtn} onPress={() => openLink(item.meetingLink)}>
            <Text style={styles.joinBtnText}>Join Room</Text>
          </TouchableOpacity>
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
      <View style={styles.header}>
        <AntDesign name="arrowleft" size={28} color={colors.white} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>My Group Sessions</Text>
        <View style={{width: 28}} />
      </View>
      <FlatList
        data={groups}
        keyExtractor={item => item._id || item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>You don't have any upcoming group sessions.</Text>}
      />
    </View>
  );
};

export default GroupSessionsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 40,
  },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  list: { padding: 16 },
  emptyText: { textAlign: 'center', marginTop: 40, color: colors.gray, fontSize: 16 },
  card: {
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.secondary, flex: 1 },
  date: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  desc: { fontSize: 14, color: colors.gray, marginBottom: 16, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  facilitator: { marginLeft: 6, fontSize: 13, color: colors.secondary, fontWeight: '500' },
  joinBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  joinBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
});
