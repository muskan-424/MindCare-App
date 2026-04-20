import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import api from '../utils/apiClient';
import {Chip} from 'react-native-paper';
//import { AntDesign,MaterialIcons,Feather,FontAwesome5,MaterialCommunityIcons,Ionicons} from '@expo/vector-icons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {colors, sizes, fonts} from '../constants/theme';
import {concerns} from '../constants/concerns';
import pastData from '../constants/pastData';
import futureData from '../constants/futureData';
import Appointments from '../components/Appointments';
import {connect} from 'react-redux';
import { getAvatarForGender } from '../utils/avatar';
import { logout } from '../redux/actions/auth';

const ProfileScreen = props => {
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [instModalVisible, setInstModalVisible] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [instLoading, setInstLoading] = useState(false);

  const handleJoinInstitution = async () => {
    if (!accessCode.trim()) return Alert.alert('Required', 'Please enter an access code.');
    setInstLoading(true);
    try {
      const res = await api.post('/api/institutions/join', { accessCode: accessCode.trim() });
      Alert.alert('Success', `You have joined ${res.data.institutionName}!`);
      setInstModalVisible(false);
      // Ideally refresh profile here
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to join institution.');
    }
    setInstLoading(false);
  };

  const requestDeletion = async () => {
    if (!deleteReason.trim()) {
      return Alert.alert('Required', 'Please let us know why you are leaving.');
    }
    setDeleteLoading(true);
    try {
      await api.post('/api/profile/delete-request', {
        uid: props.auth.user._id,
        reason: deleteReason.trim()
      });
      Alert.alert('Request Submitted', 'Your account deletion request is now pending admin review for data purge.');
      setDeleteModalVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to submit request.');
    }
    setDeleteLoading(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => props.logout(), style: 'destructive' }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.background}>
        <View style={styles.top}>
          <AntDesign
            name="arrowleft"
            size={32}
            color={colors.white}
            onPress={() => props.navigation.navigate('Home')}
          />
          <Text style={styles.profileText}>Profile</Text>
          <FontAwesome5
            name="edit"
            size={24}
            color={colors.white}
            onPress={() => props.navigation.navigate('EditProfile')}
          />
        </View>
        <View style={styles.dpCover}>
          <Image
            style={{width: 100, height: 100, borderRadius: 50}}
            source={getAvatarForGender(props.auth.profile.gender)}
          />
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{props.auth.profile.name}</Text>
        <View style={styles.infoBox}>
          <MaterialCommunityIcons
            name="gender-male-female"
            size={20}
            color={colors.tertiary}
          />
          <Text style={styles.otherInfo}>{props.auth.profile.gender}</Text>
        </View>
        <View style={styles.infoBox}>
          <MaterialCommunityIcons
            name="timer-sand-empty"
            size={20}
            color={colors.tertiary}
          />
          <Text style={styles.otherInfo}>
            {props.auth.profile.age} yrs. old
          </Text>
        </View>
        <View style={styles.infoBox}>
          <Feather name="phone" size={20} color={colors.tertiary} />
          <Text style={styles.otherInfo}>{props.auth.profile.phone_no}</Text>
        </View>
        <View style={styles.infoBox}>
          <MaterialCommunityIcons
            name="email-outline"
            size={20}
            color={colors.tertiary}
          />
          <Text style={styles.otherInfo}>{props.auth.user.email}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.historyRow}
        onPress={() => props.navigation.navigate('MoodTracker')}
        activeOpacity={0.8}>
        <MaterialCommunityIcons name="chart-line" size={24} color={colors.primary} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.historyText}>Mood & check-in history</Text>
          <Text style={styles.historySubtext}>View your entries for burnout insights</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.historyRow, { marginTop: 10, borderLeftColor: '#C62828' }]}
        onPress={() => props.navigation.navigate('EmergencyContact')}
        activeOpacity={0.8}>
        <MaterialCommunityIcons name="phone-alert" size={24} color="#C62828" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.historyText}>Emergency Contact</Text>
          <Text style={styles.historySubtext}>Add a trusted contact for extreme emergencies</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.gray} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.historyRow, { marginTop: 10, borderLeftColor: '#81C784' }]}
        onPress={() => props.navigation.navigate('AssignedResources')}
        activeOpacity={0.8}>
        <MaterialCommunityIcons name="star-shooting" size={24} color="#81C784" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.historyText}>Curated Resources</Text>
          <Text style={styles.historySubtext}>View resources assigned to you by your care team</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.gray} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.historyRow, { marginTop: 10, borderLeftColor: '#4FC3F7' }]}
        onPress={() => props.navigation.navigate('GroupSessions')}
        activeOpacity={0.8}>
        <MaterialCommunityIcons name="account-group" size={24} color="#4FC3F7" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.historyText}>Group Sessions</Text>
          <Text style={styles.historySubtext}>Join your upcoming therapeutic group sessions</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.gray} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.historyRow, { marginTop: 10, borderLeftColor: '#7C4DFF' }]}
        onPress={() => props.navigation.navigate('GoalTracking')}
        activeOpacity={0.8}>
        <MaterialCommunityIcons name="target" size={24} color="#7C4DFF" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.historyText}>Goal Tracker</Text>
          <Text style={styles.historySubtext}>Track your personal milestones and progress</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.gray} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.historyRow, { marginTop: 10, borderLeftColor: '#F06292' }]}
        onPress={() => props.navigation.navigate('PeerMatching')}
        activeOpacity={0.8}>
        <MaterialCommunityIcons name="account-group" size={24} color="#F06292" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.historyText}>Peer Matching</Text>
          <Text style={styles.historySubtext}>Connect with others on a similar journey</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.gray} />
      </TouchableOpacity>
      
      {/* Institution Row */}
      {props.auth.user.institutionId ? (
        <TouchableOpacity
          style={[styles.historyRow, { marginTop: 10, borderLeftColor: '#455A64' }]}
          onPress={() => {
            // Check if user is an admin of this institution
            // This logic might need a more robust backend check, but for now we'll attempt navigation
            props.navigation.navigate('InstitutionDashboard', { institutionId: props.auth.user.institutionId });
          }}
          activeOpacity={0.8}>
          <MaterialCommunityIcons name="office-building" size={24} color="#455A64" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.historyText}>My Organization</Text>
            <Text style={styles.historySubtext}>View aggregate wellness trends (Admins only)</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.gray} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.historyRow, { marginTop: 10, borderLeftColor: '#9E9E9E' }]}
          onPress={() => setInstModalVisible(true)}
          activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#9E9E9E" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.historyText}>Join Organization</Text>
            <Text style={styles.historySubtext}>Connect to your school or workplace</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.gray} />
        </TouchableOpacity>
      )}

      <View style={styles.concernContainer}>
        <Text style={styles.concernTitle}>My Concerns:</Text>
        <View style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap'}}>
          {concerns
            .filter(chip => (props.auth.profile.concerns || []).includes(chip.id))
            .map(chip => {
              return (
                <Chip
                  key={chip.id}
                  icon="check-circle-outline"
                  style={styles.chip}>
                  {chip.name}
                </Chip>
              );
            })}
          {(!props.auth.profile.concerns || props.auth.profile.concerns.length === 0) && (
            <Text style={{ textAlign: 'center', width: '100%', color: colors.gray, marginTop: 10 }}>
              No concerns added yet.
            </Text>
          )}
        </View>
      </View>
      <View style={{position: 'relative', top: 60}}>
        <Appointments data={futureData} type="Future" />
      </View>
      <View style={{position: 'relative', top: 60, marginBottom: 70}}>
        <Appointments data={pastData} type="Past" />
      </View>

      <View style={{position: 'relative', top: 50, marginBottom: 80}}>
        <TouchableOpacity
          style={[styles.deleteBtn, { borderColor: colors.primary, marginBottom: 15 }]}
          onPress={handleLogout}>
          <Text style={[styles.deleteBtnText, { color: colors.primary }]}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => setDeleteModalVisible(true)}>
          <Text style={styles.deleteBtnText}>Delete Account (GDPR)</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={deleteModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Account Deletion</Text>
            <Text style={styles.modalText}>
              In compliance with GDPR, your request will be reviewed. Once approved, all your personal data including risk reports, mood entries, and wellness plans will be permanently purged from our servers.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Why are you leaving? (Required)"
              placeholderTextColor={colors.gray}
              value={deleteReason}
              onChangeText={setDeleteReason}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.gray3 }]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deleteLoading}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#E57373' }]}
                onPress={requestDeletion}
                disabled={deleteLoading}>
                {deleteLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.modalBtnText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Institution Join Modal */}
      <Modal visible={instModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Organization</Text>
            <Text style={styles.modalText}>
              Enter the access code provided by your school or workplace to join their private wellness community.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. COLLEGE2026"
              placeholderTextColor={colors.gray}
              value={accessCode}
              onChangeText={setAccessCode}
              autoCapitalize="characters"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.gray3 }]}
                onPress={() => setInstModalVisible(false)}
                disabled={instLoading}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleJoinInstitution}
                disabled={instLoading}>
                {instLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.modalBtnText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
const mapStateToProps = state => ({
  auth: state.auth,
});

export default connect(mapStateToProps, { logout })(ProfileScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffff',
  },
  background: {
    backgroundColor: colors.primary,
    width: '100%',
    height: 150,
    display: 'flex',
    flexDirection: 'column',
    //   borderBottomEndRadius:100
  },
  top: {
    padding: 20,
    paddingTop: 30,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileText: {
    position: 'relative',
    color: colors.white,
    fontSize: fonts.h1.fontSize,
    fontWeight: '700',
  },
  dpCover: {
    width: 110,
    height: 110,
    position: 'relative',
    alignSelf: 'center',
    top: 10,
    borderRadius: 62,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  info: {
    position: 'relative',
    top: 55,
    display: 'flex',
    alignItems: 'center',
  },
  infoBox: {
    display: 'flex',
    flexDirection: 'row',
  },
  name: {
    paddingBottom: 5,
    fontSize: fonts.title.fontSize,
    fontWeight: 'bold',
    color: 'black',
  },
  otherInfo: {
    paddingBottom: 5,
    paddingLeft: 5,
    // fontStyle:'italic'
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.accent,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  historyText: {
    fontSize: sizes.header,
    fontWeight: '600',
    color: colors.secondary,
  },
  historySubtext: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  concernContainer: {
    margin: 10,
    paddingBottom: 10,
    position: 'relative',
    top: 70,
    borderTopWidth: 2,
    borderTopColor: colors.accent,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  concernTitle: {
    textAlign: 'center',
    padding: 10,
    fontSize: fonts.title.fontSize,
    color: colors.secondary,
  },
  chip: {
    margin: 5,
    backgroundColor: colors.accent,
  },
  deleteBtn: {
    marginHorizontal: 30,
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E57373',
    alignItems: 'center'
  },
  deleteBtnText: {
    color: '#E57373',
    fontWeight: '700',
    fontSize: 16
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 12
  },
  modalText: {
    fontSize: 14,
    color: colors.secondary,
    lineHeight: 20,
    marginBottom: 16
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.gray3,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
    color: colors.secondary
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  modalBtnText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16
  }
});
