import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import { connect } from 'react-redux';
import TherapistCard from '../components/TherapistCard';
import api from '../utils/apiClient';
import TrackedTouchable from '../components/TrackedTouchable';
import localData from '../constants/doctors';
import { colors } from '../constants/theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const FALLBACK_CATEGORIES = [
  { id: '1', name: 'Psychologist', icon: 'https://cdn-icons-png.flaticon.com/512/2785/2785819.png' },
  { id: '2', name: 'Psychiatrist', icon: 'https://cdn-icons-png.flaticon.com/512/3308/3308392.png' },
  { id: '3', name: 'Counsellor', icon: 'https://cdn-icons-png.flaticon.com/512/2461/2461102.png' },
  { id: '4', name: 'Social Worker', icon: 'https://cdn-icons-png.flaticon.com/512/3179/3179068.png' },
];

const TherapistHomeScreen = (props) => {
  const [query, setQuery] = useState('');
  const [therapists, setTherapists] = useState(localData);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(false);

  // For Therapist Role
  const [myPatients, setMyPatients] = useState([]);
  const isTherapist = props.auth.user && props.auth.user.role === 'therapist';

  useEffect(() => {
    if (isTherapist) {
        fetchMyPatients();
    } else {
        fetchTherapists();
        fetchCategories();
    }
  }, [isTherapist]);

  const fetchMyPatients = async () => {
    setLoading(true);
    try {
      // Find appointments where this therapist is assigned
      const res = await api.get('/api/appointments/therapist/me');
      setMyPatients(res.data || []);
    } catch (e) {
      console.warn('Patients fetch error:', e.message);
    }
    setLoading(false);
  };

  const fetchTherapists = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/therapists');
        if (Array.isArray(res.data)) setTherapists(res.data);
      } catch (e) {
        setTherapists(localData);
      }
      setLoading(false);
  };

  const fetchCategories = async () => {
      try {
        const res = await api.get('/api/therapists/categories');
        if (Array.isArray(res.data) && res.data.length > 0) setCategories(res.data);
      } catch (_) {}
  };

  const renderCategory = ({ item }) => (
    <TrackedTouchable
      eventName={`Therapist_Category_${item.name}`}
      style={styles.catCard}
      onPress={() =>
        props.navigation.navigate('Therapist', {
          data: therapists.filter((d) => d.specialisation === item.name),
          category: item.name,
        })
      }
      activeOpacity={0.8}>
      <Image source={{ uri: item.icon }} style={styles.catIcon} />
      <Text style={styles.catName}>{item.name}</Text>
    </TrackedTouchable>
  );

  if (isTherapist) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Professional Workspace</Text>
            <Text style={styles.headerSubtitle}>Manage your patients and session notes</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>My Patients</Text>
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : myPatients.length === 0 ? (
                <View style={styles.empty}>
                    <MaterialCommunityIcons name="account-search-outline" size={60} color={colors.gray3} />
                    <Text style={styles.emptyText}>No active patients assigned yet.</Text>
                </View>
            ) : (
                myPatients.map(apt => (
                    <View key={apt._id} style={styles.patientCard}>
                        <View style={styles.patientInfo}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{apt.user?.name[0]}</Text>
                            </View>
                            <View style={{ marginLeft: 15, flex: 1 }}>
                                <Text style={styles.patientName}>{apt.user?.name}</Text>
                                <Text style={styles.patientSub}>{apt.requestedSpeciality || 'General Session'}</Text>
                            </View>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>{apt.status}</Text>
                            </View>
                        </View>
                        <View style={styles.patientActions}>
                            <TouchableOpacity 
                                style={styles.actionBtn}
                                onPress={() => props.navigation.navigate('TherapistPatientHistory', { 
                                    patientId: apt.user?._id, 
                                    patientName: apt.user?.name 
                                })}
                            >
                                <MaterialCommunityIcons name="history" size={18} color={colors.primary} />
                                <Text style={styles.actionBtnText}>Clinical History</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.actionBtn, styles.primaryBtn]}
                                onPress={() => props.navigation.navigate('AddSessionNote', { 
                                    patientId: apt.user?._id, 
                                    patientName: apt.user?.name 
                                })}
                            >
                                <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                                <Text style={[styles.actionBtnText, { color: '#fff' }]}>Add Note</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Consultation</Text>
        <Text style={styles.headerSubtitle}>Talk to a professional</Text>
        <View style={styles.searchWrap}>
          <Searchbar
            style={styles.search}
            placeholder="Search by name or specialty..."
            onChangeText={setQuery}
            value={query}
            placeholderTextColor={colors.gray}
          />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Browse by type</Text>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
        />

        <Text style={styles.sectionTitle}>Top professionals</Text>
        <View style={styles.cardList}>
          {therapists.map((doc) => (
            <View key={doc.id} style={styles.cardWrap}>
              <TherapistCard data={doc} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const mapStateToProps = (state) => ({
    auth: state.auth
});

export default connect(mapStateToProps)(TherapistHomeScreen);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 24,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.white },
  headerSubtitle: { fontSize: 13, color: colors.white, opacity: 0.9, marginTop: 4 },
  searchWrap: { marginTop: 16 },
  search: { backgroundColor: colors.white, borderRadius: 12, elevation: 0 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.secondary,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  catList: { paddingHorizontal: 12, paddingBottom: 8 },
  catCard: {
    width: 100,
    marginHorizontal: 8,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  catIcon: { width: 36, height: 36, marginBottom: 8, resizeMode: 'contain' },
  catName: { fontSize: 12, fontWeight: '600', color: colors.secondary, textAlign: 'center' },
  cardList: { paddingHorizontal: 16 },
  cardWrap: { marginBottom: 14 },
  // Professional Styles
  patientCard: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 16, elevation: 3 },
  patientInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  patientSub: { fontSize: 12, color: colors.gray, marginTop: 2 },
  statusBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, color: '#2E7D32', fontWeight: 'bold', textTransform: 'uppercase' },
  patientActions: { flexDirection: 'row', gap: 10, marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.primary },
  primaryBtn: { backgroundColor: colors.primary },
  actionBtnText: { fontSize: 13, fontWeight: 'bold', color: colors.primary },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: colors.gray, marginTop: 15, fontSize: 15 }
});

