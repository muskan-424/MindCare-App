const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'screens', 'TherapistHomeScreen.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Replace the isTherapist return block
const oldReturn = `  if (isTherapist) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                    <Text style={styles.headerTitle}>Professional Workspace</Text>
                    <Text style={styles.headerSubtitle}>Manage your patients and session notes</Text>
                </View>
                <TouchableOpacity onPress={() => props.logout()}>
                    <MaterialCommunityIcons name="logout" size={24} color={colors.white} />
                </TouchableOpacity>
            </View>
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
  }`;

const newReturn = `  if (isTherapist) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
      <View style={styles.container}>
        {/* HERO HEADER */}
        <View style={styles.profHeader}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.heroGreeting}>{greeting}, Dr. {(props.auth.user?.name || '').split(' ')[0]}</Text>
                    <Text style={styles.heroSub}>Ready to make a difference today?</Text>
                </View>
                <TouchableOpacity onPress={() => props.logout()} style={styles.logoutBtn}>
                    <MaterialCommunityIcons name="logout" size={20} color={colors.primary} />
                </TouchableOpacity>
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
            {/* QUICK ACTIONS ROW */}
            <View style={styles.quickOpsContainer}>
                <Text style={styles.sectionTitle}>Operations</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickOpsScroll}>
                    <TouchableOpacity style={styles.quickOpBtn} activeOpacity={0.8}>
                        <View style={[styles.qIconWrap, { backgroundColor: '#E3F2FD' }]}>
                            <MaterialCommunityIcons name="calendar-edit" size={24} color="#1E88E5" />
                        </View>
                        <Text style={styles.qText}>Availability</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickOpBtn} activeOpacity={0.8} onPress={() => props.navigation.navigate('TherapistProfile')}>
                        <View style={[styles.qIconWrap, { backgroundColor: '#F3E5F5' }]}>
                            <MaterialCommunityIcons name="account-details" size={24} color="#8E24AA" />
                        </View>
                        <Text style={styles.qText}>My Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickOpBtn} activeOpacity={0.8}>
                        <View style={[styles.qIconWrap, { backgroundColor: '#E8F5E9' }]}>
                            <MaterialCommunityIcons name="cash-multiple" size={24} color="#43A047" />
                        </View>
                        <Text style={styles.qText}>Earnings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickOpBtn} activeOpacity={0.8}>
                        <View style={[styles.qIconWrap, { backgroundColor: '#FFF3E0' }]}>
                            <MaterialCommunityIcons name="school" size={24} color="#FB8C00" />
                        </View>
                        <Text style={styles.qText}>Training</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

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
  }`;

code = code.replace(oldReturn, newReturn);

// 2. Add new styles
const newStyles = `
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
  heroGreeting: { fontSize: 26, fontWeight: '800', color: colors.white },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  logoutBtn: { backgroundColor: colors.white, padding: 10, borderRadius: 14 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32 },
  metricCard: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingVertical: 14, marginHorizontal: 4 },
  metricValue: { color: colors.white, fontSize: 22, fontWeight: 'bold', marginTop: 4 },
  metricLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2, textAlign: 'center' },
  
  quickOpsContainer: { marginTop: 15 },
  quickOpsScroll: { paddingHorizontal: 20, paddingBottom: 10 },
  quickOpBtn: { alignItems: 'center', marginRight: 20, width: 65 },
  qIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  qText: { fontSize: 11, fontWeight: '600', color: colors.secondary, textAlign: 'center' },

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
`;

code = code.replace("emptyText: { color: colors.gray, marginTop: 15, fontSize: 15 }", "emptyText: { color: colors.gray, marginTop: 15, fontSize: 15 }," + newStyles);

fs.writeFileSync(filePath, code);
console.log('Clinician Portal successfully upgraded with engaging UX logic!');
