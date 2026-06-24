import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, Image, ScrollView, ActivityIndicator,
  TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { colors, fonts } from '../../../constants/theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../../utils/apiClient';
import { Button } from 'react-native-paper';
import useTranslation from '../../../utils/i18n';

const TherapistProfileScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const [therapist, setTherapist] = useState(route?.params?.therapist || null);
  const [loading, setLoading] = useState(!route?.params?.therapist);

  // Edit fields
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSpec, setEditSpec] = useState('');
  const [editTiming, setEditTiming] = useState('');
  const [editFee, setEditFee] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editImg, setEditImg] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editContact, setEditContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!therapist) {
      fetchMyProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMyProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/therapists/me');
      setTherapist(res.data);
      setEditName(res.data.name || '');
      setEditSpec(res.data.specialisation || '');
      setEditTiming(res.data.timing || '');
      setEditFee(res.data.fee || '');
      setEditBio(res.data.bio || '');
      setEditImg(res.data.img || '');
      setEditEmail(res.data.email || '');
      setEditContact(res.data.contact_no || '');
    } catch (err) {
      console.error('Error fetching therapist self profile:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitEdit = async () => {
    if (!editName.trim() || !editSpec.trim()) {
      return Alert.alert(t('common.required'), t('therapy.name_spec_required'));
    }
    try {
      setSubmitting(true);
      const res = await api.put('/api/therapists/me', {
        name: editName.trim(),
        specialisation: editSpec.trim(),
        timing: editTiming.trim(),
        fee: editFee.trim(),
        bio: editBio.trim(),
        img: editImg.trim(),
        email: editEmail.trim(),
        contact_no: editContact.trim(),
      });
      setTherapist(res.data);
      setEditModalVisible(false);
      Alert.alert(t('common.success'), t('therapy.profile_updated'));
    } catch (err) {
      Alert.alert(t('common.error'), err.response?.data?.error || t('therapy.update_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!therapist) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.cream }}>
        <Text style={{ color: colors.secondary, fontSize: 16, fontWeight: '700' }}>{t('therapy.profile_not_found')}</Text>
      </View>
    );
  }

  var starsCount = [];
  for (var i = 0; i < 5; i++) {
    if (i < (therapist.stars || 0)) starsCount.push(true);
    else starsCount.push(false);
  }

  const stars = (count, index) => {
    return count ? (
      <AntDesign key={index} name="star" size={15} color="#f0de59" />
    ) : (
      <AntDesign key={index} name="star" size={15} color={colors.gray} />
    );
  };

  const isSelf = !route?.params?.therapist;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.background}>
        <AntDesign
          name="arrowleft"
          size={32}
          color="white"
          style={{ position: 'absolute', top: 25, left: 20 }}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.profileText}>{isSelf ? t('therapy.my_clinician_profile') : t('therapy.therapist_profile')}</Text>
        {isSelf && (
          <FontAwesome5
            name="edit"
            size={24}
            color="white"
            style={{ position: 'absolute', top: 25, right: 20 }}
            onPress={() => setEditModalVisible(true)}
          />
        )}
        <View style={styles.dpCover}>
          <Image
            style={{ width: 100, height: 100, borderRadius: 62 }}
            source={{ uri: therapist.img || 'https://www.allsmilesdentist.com/wp-content/uploads/2017/08/Doctors-circle.png' }}
          />
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{therapist.name}</Text>
        <Text style={styles.spec}>{therapist.specialisation}</Text>
        <View style={styles.starsBox}>
          {starsCount.map((item, index) => {
            return stars(item, index);
          })}
        </View>
      </View>
      <View style={styles.info2}>
        <View style={styles.partContainer}>
          <Text style={styles.partText}>{t('therapy.timing')}</Text>
          <Text style={styles.part}>{therapist.timing}</Text>
        </View>
        <View style={styles.partContainer}>
          <Text style={styles.partText}>{t('therapy.fee')}</Text>
          <Text style={styles.part}>{therapist.fee}</Text>
        </View>
      </View>
      <View style={styles.info3}>
        <Text style={styles.aboutText}>{t('therapy.about_therapist')}</Text>
        <Text style={styles.about}>{therapist.bio || t('therapy.bio_placeholder')}</Text>
      </View>
      <View style={styles.info4}>
        <View style={styles.contactBox}>
          <Text style={styles.contact}>{therapist.email}</Text>
          <MaterialCommunityIcons
            name="email"
            size={24}
            color={colors.primary}
          />
        </View>
        <View style={styles.contactBox}>
          <Text style={styles.contact}>{therapist.contact_no}</Text>
          <MaterialCommunityIcons
            name="phone"
            size={24}
            color={colors.primary}
          />
        </View>
      </View>

      {!isSelf && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 30, gap: 12 }}>
          <Button
            mode="contained"
            color={colors.secondary}
            style={{ borderRadius: 12 }}
            onPress={() => navigation.navigate('BookAppointment', { therapist })}
          >
            <Text style={{ color: colors.white, fontWeight: '700' }}>{t('therapy.book_appointment')}</Text>
          </Button>
          <Button
            mode="outlined"
            color={colors.secondary}
            style={{ borderRadius: 12 }}
            onPress={() => navigation.navigate('Appointments')}
          >
            <Text style={{ color: colors.secondary, fontWeight: '600' }}>{t('therapy.my_appointments')}</Text>
          </Button>
        </View>
      )}

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('therapy.edit_profile')}</Text>
            
            <Text style={styles.label}>{t('therapy.full_name')}</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder={t('therapy.full_name')}
            />

            <Text style={styles.label}>{t('therapy.photo_url')}</Text>
            <TextInput
              style={styles.input}
              value={editImg}
              onChangeText={setEditImg}
              placeholder={t('therapy.photo_placeholder')}
            />

            <Text style={styles.label}>{t('therapy.specialisation')}</Text>
            <TextInput
              style={styles.input}
              value={editSpec}
              onChangeText={setEditSpec}
              placeholder={t('therapy.spec_placeholder')}
            />

            <Text style={styles.label}>{t('therapy.bio')}</Text>
            <TextInput
              style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder={t('therapy.bio_input_placeholder')}
              multiline
            />

            <Text style={styles.label}>{t('therapy.work_timings')}</Text>
            <TextInput
              style={styles.input}
              value={editTiming}
              onChangeText={setEditTiming}
              placeholder={t('therapy.timing_placeholder')}
            />

            <Text style={styles.label}>{t('therapy.consultation_fee')}</Text>
            <TextInput
              style={styles.input}
              value={editFee}
              onChangeText={setEditFee}
              placeholder={t('therapy.fee_placeholder')}
            />

            <Text style={styles.label}>{t('therapy.contact_email')}</Text>
            <TextInput
              style={styles.input}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder={t('therapy.email_placeholder')}
            />

            <Text style={styles.label}>{t('therapy.contact_phone')}</Text>
            <TextInput
              style={styles.input}
              value={editContact}
              onChangeText={setEditContact}
              placeholder={t('therapy.phone_placeholder')}
              keyboardType="phone-pad"
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.gray3 }]}
                onPress={() => setEditModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.modalBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={submitEdit}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.modalBtnText}>{t('common.save')}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default TherapistProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  background: {
    backgroundColor: colors.primary,
    borderBottomEndRadius: 180,
    width: '100%',
    height: 150,
    marginBottom: 30,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  profileText: {
    position: 'relative',
    top: 10,
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
  },
  dpCover: {
    width: 110,
    height: 110,
    position: 'relative',
    top: '25%',
    borderRadius: 62,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  info: {
    width: '100%',
    marginTop: 15,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  name: {
    paddingBottom: 2,
    fontSize: fonts.title.fontSize,
    fontWeight: 'bold',
    color: 'black',
  },
  spec: {
    paddingBottom: 5,
    fontStyle: 'italic',
  },
  starsBox: {
    display: 'flex',
    flexDirection: 'row',
  },
  info2: {
    display: 'flex',
    flexDirection: 'row',
    marginHorizontal: 15,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: colors.gray3,
    backgroundColor: colors.lightGrey,
  },
  partContainer: {
    width: '50%',
    padding: 15,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray3,
  },
  partText: {
    paddingBottom: 5,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  info3: {
    marginHorizontal: 15,
  },
  aboutText: {
    textAlign: 'center',
    paddingVertical: 10,
    color: colors.tertiary,
    fontWeight: '700',
    fontSize: fonts.header.fontSize,
  },
  about: {
    textAlign: 'center',
    fontSize: fonts.body.fontSize,
  },
  info4: {
    marginHorizontal: 25,
    marginVertical: 15,
  },
  contactBox: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.accent,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray3,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
    color: colors.secondary,
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
