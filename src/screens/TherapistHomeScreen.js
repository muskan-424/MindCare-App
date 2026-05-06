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
  Animated,
} from 'react-native';
import TouchableScale from 'react-native-touchable-scale';
import { Searchbar } from 'react-native-paper';
import { connect } from 'react-redux';
import { logout } from '../redux/actions/auth';
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
  const [isDarkMode, setIsDarkMode] = useState(false);


  // For Therapist Role
  const [myPatients, setMyPatients] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const isTherapist = props.auth.user &&
    (props.auth.user.role === 'therapist' || props.auth.user.role === 'clinician');

  useEffect(() => {
    if (isTherapist) {
        fetchMyPatients();
        fetchOpenRequests();
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

  const fetchOpenRequests = async () => {
    try {
      const res = await api.get('/api/appointments/open');
      setOpenRequests(res.data || []);
    } catch (e) {
      console.warn('Open requests fetch error:', e.message);
    }
  };

  const claimRequest = async (id) => {
    setLoading(true);
    try {
      await api.post(`/api/appointments/${id}/claim`);
      await fetchOpenRequests();
      await fetchMyPatients();
    } catch (e) {
      console.warn('Claim error:', e.message);
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
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : colors.cream }]}>
        {/* HERO HEADER */}
        <View style={[styles.profHeader, { backgroundColor: isDarkMode ? '#1C2030' : colors.primary }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.heroGreeting}>{greeting}, Dr. {(props.auth.user?.name || '').split(' ')[0]}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <View style={[styles.livePulse, { backgroundColor: '#4ADE80' }]} />
                      <Text style={styles.heroSub}>
                        {props.auth.user?.specialisation ? `${props.auth.user.specialisation} • ` : ''}Active Session
                      </Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableScale onPress={() => setIsDarkMode(!isDarkMode)} style={styles.headerActionBtn} tension={50} friction={7}>
                      <MaterialCommunityIcons name={isDarkMode ? 'weather-sunny' : 'weather-night'} size={18} color={colors.primary} />
                  </TouchableScale>
                  <TouchableScale onPress={() => props.logout()} style={styles.headerActionBtn} tension={50} friction={7}>
                      <MaterialCommunityIcons name="logout" size={18} color={colors.primary} />
                  </TouchableScale>
                </View>
            </View>


            {/* LIVE OPERATIONAL STATS */}
            <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                    <MaterialCommunityIcons name="calendar-clock" size={24} color={colors.white} />
                    <Text style={styles.metricValue}>{myPatients.length}</Text>
                    <Text style={styles.metricLabel}>Daily Sessions</Text>
                </View>
                <View style={styles.metricCard}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={colors.white} />
                    <Text style={styles.metricValue}>0</Text>
                    <Text style={styles.metricLabel}>Pending Notes</Text>
                </View>
                <View style={styles.metricCard}>
                    <MaterialCommunityIcons name="account-group-outline" size={24} color={colors.white} />
                    <Text style={styles.metricValue}>{myPatients.length}</Text>
                    <Text style={styles.metricLabel}>Active Patients</Text>
                </View>
            </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* QUICK ACTIONS GRID */}
            <View style={styles.opsContainer}>
                <Text style={styles.sectionTitle}>Operations</Text>
                <View style={styles.opsGrid}>
                    <TouchableScale style={[styles.opCard, { backgroundColor: '#EBF5FF' }]} activeScale={0.96}>
                        <View style={[styles.opIconWrap, { backgroundColor: '#1E88E5' }]}>
                            <MaterialCommunityIcons name="calendar-edit" size={22} color="#fff" />
                        </View>
                        <Text style={styles.opTitle}>Availability</Text>
                        <Text style={styles.opSub}>Manage slots</Text>
                    </TouchableScale>
                    
                    <TouchableScale style={[styles.opCard, { backgroundColor: '#F9F0FF' }]} activeScale={0.96} onPress={() => props.navigation.navigate('TherapistProfile')}>
                        <View style={[styles.opIconWrap, { backgroundColor: '#8E24AA' }]}>
                            <MaterialCommunityIcons name="account-details" size={22} color="#fff" />
                        </View>
                        <Text style={styles.opTitle}>My Profile</Text>
                        <Text style={styles.opSub}>Edit bio</Text>
                    </TouchableScale>
                    
                    <TouchableScale style={[styles.opCard, { backgroundColor: '#EDFFF1' }]} activeScale={0.96}>
                        <View style={[styles.opIconWrap, { backgroundColor: '#43A047' }]}>
                            <MaterialCommunityIcons name="cash-multiple" size={22} color="#fff" />
                        </View>
                        <Text style={styles.opTitle}>Earnings</Text>
                        <Text style={styles.opSub}>View payouts</Text>
                    </TouchableScale>
                    
                    <TouchableScale style={[styles.opCard, { backgroundColor: '#FFF7ED' }]} activeScale={0.96}>
                        <View style={[styles.opIconWrap, { backgroundColor: '#FB8C00' }]}>
                            <MaterialCommunityIcons name="school" size={22} color="#fff" />
                        </View>
                        <Text style={styles.opTitle}>Training</Text>
                        <Text style={styles.opSub}>New courses</Text>
                    </TouchableScale>
                </View>
            </View>

            {openRequests.length > 0 && (
                <>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20}}>
                        <Text style={[styles.sectionTitle, {marginHorizontal: 0, marginTop: 10}]}>Available Consultations</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}>
                        {openRequests.map(req => (
                            <View key={req._id} style={styles.openRequestCard}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <View>
                                        <Text style={styles.openReqName}>{req.user?.name}</Text>
                                        <Text style={styles.openReqSpec}>{req.requestedSpeciality || 'General Session'}</Text>
                                    </View>
                                    <View style={styles.openReqBadge}>
                                        <Text style={styles.openReqBadgeText}>OPEN</Text>
                                    </View>
                                </View>
                                <View style={styles.openReqDetails}>
                                    <Text style={styles.openReqDate}>{req.preferredDates?.[0] || 'Any Date'}</Text>
                                    <Text style={styles.openReqTime}>{req.preferredTime || 'Any Time'}</Text>
                                </View>
                                <TouchableOpacity style={styles.claimBtn} onPress={() => claimRequest(req._id)}>
                                    <MaterialCommunityIcons name="hand-back-right" size={16} color="#fff" />
                                    <Text style={styles.claimBtnText}>Claim Session</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </>
            )}

            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20}}>
                <Text style={[styles.sectionTitle, {marginHorizontal: 0, marginTop: 10}]}>My Schedule</Text>
                <TouchableOpacity><Text style={{color: colors.primary, fontSize: 13, fontWeight: 'bold', marginTop: 10}}>View All</Text></TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : myPatients.length === 0 ? (
                /* PREMIUM ZERO-STATE UI */
                <View style={styles.premiumEmptyCard}>
                    <View style={styles.emptyIconCircle}>
                        <MaterialCommunityIcons name="calendar-check" size={36} color={colors.primary} />
                    </View>
                    <Text style={styles.emptyCardTitle}>Your schedule is clear!</Text>
                    <Text style={styles.emptyCardText}>
                        Enjoy the downtime, doctor. When new consultations are assigned to you by the triage team, they will automatically appear here.
                    </Text>
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
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : colors.cream }]}>
      <View style={[styles.header, { backgroundColor: isDarkMode ? '#1C2030' : colors.primary }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
                <Text style={styles.headerTitle}>Consultation</Text>
                <Text style={styles.headerSubtitle}>Talk to a professional</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)} style={{ marginRight: 12 }}>
                    <MaterialCommunityIcons name={isDarkMode ? 'weather-sunny' : 'weather-night'} size={24} color={colors.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => props.logout()}>
                    <MaterialCommunityIcons name="logout" size={24} color={colors.white} />
                </TouchableOpacity>
            </View>
        </View>
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

export default connect(mapStateToProps, { logout })(TherapistHomeScreen);

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
  emptyText: { color: colors.gray, marginTop: 15, fontSize: 15 },
  profHeader: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  heroGreeting: { fontSize: 26, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  livePulse: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  headerActionBtn: { backgroundColor: colors.white, width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  metricCard: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 24, paddingVertical: 18, marginHorizontal: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  metricValue: { color: colors.white, fontSize: 24, fontWeight: '900', marginTop: 6 },
  metricLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2, textAlign: 'center' },
  
  opsContainer: { marginTop: 10 },
  opsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between' },
  opCard: { width: '48%', borderRadius: 20, padding: 15, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  opIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  opTitle: { fontSize: 14, fontWeight: '700', color: colors.secondary },
  opSub: { fontSize: 11, color: colors.gray, marginTop: 2 },

  premiumEmptyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(116, 179, 91, 0.1)'
  },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accent + '66', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyCardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.secondary, marginBottom: 8 },
  emptyCardText: { fontSize: 13, color: colors.gray, textAlign: 'center', lineHeight: 22 },

  // Open Requests Styles
  openRequestCard: { backgroundColor: '#FFF9C4', borderRadius: 16, padding: 15, marginRight: 15, width: 260, elevation: 2 },
  openReqName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  openReqSpec: { fontSize: 12, color: '#666', marginTop: 2 },
  openReqBadge: { backgroundColor: '#FBC02D', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  openReqBadgeText: { fontSize: 10, color: '#fff', fontWeight: 'bold' },
  openReqDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 12 },
  openReqDate: { fontSize: 12, color: '#444', fontWeight: '500' },
  openReqTime: { fontSize: 12, color: '#444', fontWeight: '500' },
  claimBtn: { backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 8 },
  claimBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});

