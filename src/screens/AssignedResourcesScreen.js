import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Alert
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../utils/apiClient';
import { colors } from '../constants/theme';

const ICONS = {
  video: 'play-circle',
  article: 'file-document',
  exercise: 'dumbbell'
};

const AssignedResourcesScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await api.get('/api/resources/assigned');
        if (res.data?.success) {
          setResources(res.data.resources);
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to load recommended resources.');
      }
      setLoading(false);
    };
    fetchResources();
  }, []);

  const openUrl = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open this resource link.');
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>For You</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.bannerBox}>
          <MaterialCommunityIcons name="star-shooting" size={32} color={colors.secondary} style={{ marginBottom: 8 }} />
          <Text style={styles.bannerTitle}>Curated Resources</Text>
          <Text style={styles.bannerText}>
            These verified resources were individually assigned to you by our care team following your check-ins.
          </Text>
        </View>

        {resources.length === 0 ? (
          <Text style={styles.emptyHint}>No resources have been assigned to you yet.</Text>
        ) : (
          resources.map((res, index) => (
            <TouchableOpacity
              key={`${res._id || res.id}-${index}`}
              style={styles.resourceCard}
              onPress={() => openUrl(res.url)}
              activeOpacity={0.8}
            >
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name={ICONS[res.type] || 'link'} size={28} color={colors.white} />
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.resType}>{res.type.toUpperCase()}</Text>
                <Text style={styles.resTitle}>{res.title}</Text>
                <Text style={styles.resDate}>
                  Assigned {new Date(res.assignedAt).toLocaleDateString()} after your {res.reportCategory?.replace(/_/g, ' ')} check-in
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default AssignedResourcesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 48, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center'
  },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.white },
  scrollContent: { padding: 20, paddingBottom: 60 },
  bannerBox: {
    backgroundColor: '#E8F5E9', borderRadius: 16, padding: 20,
    marginBottom: 24, alignItems: 'flex-start'
  },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: colors.secondary, marginBottom: 8 },
  bannerText: { fontSize: 14, color: colors.secondary, lineHeight: 22 },
  emptyHint: { textAlign: 'center', color: colors.gray, marginTop: 40, fontSize: 15, fontStyle: 'italic' },
  resourceCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    padding: 16, borderRadius: 16, marginBottom: 12, elevation: 1
  },
  iconBox: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 16
  },
  infoBox: { flex: 1, paddingRight: 8 },
  resType: { fontSize: 10, fontWeight: '800', color: '#81C784', letterSpacing: 1, marginBottom: 2 },
  resTitle: { fontSize: 15, fontWeight: '700', color: colors.secondary, marginBottom: 4 },
  resDate: { fontSize: 11, color: colors.gray, fontStyle: 'italic' }
});
