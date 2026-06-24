import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { connect } from 'react-redux';
import api from '../../../utils/apiClient';
import { colors } from '../../../constants/theme';
import useTranslation from '../../../utils/i18n';

const RELATIONSHIP_KEYS = [
  'Parent', 'Sibling', 'Partner', 'Friend', 'Roommate', 'Relative', 'Other',
].map((r) => ({ id: r, key: `emergency.relationship_${r.toLowerCase()}` }));

const REACH_OPTIONS = [
  { id: 'call', labelKey: 'emergency.reach_call', hintKey: 'emergency.reach_call_hint' },
  { id: 'whatsapp', labelKey: 'emergency.reach_whatsapp', hintKey: 'emergency.reach_whatsapp_hint' },
  { id: 'both', labelKey: 'emergency.reach_both', hintKey: 'emergency.reach_both_hint' },
];

const EmergencyContactScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [reachVia, setReachVia] = useState('call');
  const [userMessage, setUserMessage] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  const statusConfig = {
    awaiting_admin: { color: '#FFB74D', icon: 'Pending', labelKey: 'emergency.status_pending', hintKey: 'emergency.hint_pending' },
    verified: { color: '#81C784', icon: 'Verified', labelKey: 'emergency.status_verified', hintKey: 'emergency.hint_verified' },
    rejected: { color: '#E57373', icon: 'Rejected', labelKey: 'emergency.status_rejected', hintKey: 'emergency.hint_rejected' },
  };

  const relationshipLabel = (rel) => {
    const match = RELATIONSHIP_KEYS.find((r) => r.id === rel);
    return match ? t(match.key) : rel;
  };

  const fetchContact = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/emergency-contact');
      if (res.data.exists) {
        setExisting(res.data);
        setName(res.data.name);
        setRelationship(res.data.relationship);
        setReachVia(res.data.reachVia);
        setUserMessage(res.data.userMessage || '');
      } else {
        setExisting(null);
        setEditing(true);
      }
    } catch (e) {
      Alert.alert(t('common.error'), t('emergency.load_error'));
    }
    setLoading(false);
  }, [t]);

  useEffect(() => { fetchContact(); }, [fetchContact]);

  const submit = async () => {
    if (!name.trim()) { Alert.alert(t('common.required'), t('emergency.name_required')); return; }
    if (!relationship) { Alert.alert(t('common.required'), t('emergency.relationship_required')); return; }
    if (!phone.trim()) { Alert.alert(t('common.required'), t('emergency.phone_required')); return; }
    if (!consentGiven) { Alert.alert(t('emergency.consent_title'), t('emergency.consent_required')); return; }

    Alert.alert(
      t('emergency.save_title'),
      t('emergency.save_message', { name: name.trim(), relationship: relationshipLabel(relationship) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('emergency.confirm_submit'), onPress: async () => {
            setSubmitting(true);
            try {
              await api.post('/api/emergency-contact', {
                name: name.trim(), relationship, phone: phone.trim(),
                reachVia, userMessage: userMessage.trim(), consentGiven,
              });
              setEditing(false);
              fetchContact();
            } catch (e) {
              Alert.alert(t('common.error'), e.response?.data?.error || t('emergency.save_error'));
            }
            setSubmitting(false);
          },
        },
      ]
    );
  };

  const removeContact = () => {
    Alert.alert(
      t('emergency.remove_title'),
      t('emergency.remove_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('emergency.remove'), style: 'destructive', onPress: async () => {
            setDeleting(true);
            try {
              await api.delete('/api/emergency-contact');
              setExisting(null);
              setName(''); setRelationship(''); setPhone('');
              setReachVia('call'); setUserMessage(''); setConsentGiven(false);
              setEditing(true);
            } catch (e) {
              Alert.alert(t('common.error'), t('emergency.remove_error'));
            }
            setDeleting(false);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('emergency.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('emergency.how_it_works')}</Text>
          <Text style={styles.infoText}>{t('emergency.how_it_works_text')}</Text>
        </View>

        {existing && !editing && (() => {
          const cfg = statusConfig[existing.status] || statusConfig.awaiting_admin;
          return (
            <View style={[styles.statusCard, { borderLeftColor: cfg.color }]}>
              <View style={styles.statusRow}>
                <Text style={styles.statusIcon}>{cfg.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusLabel, { color: cfg.color }]}>{t(cfg.labelKey)}</Text>
                  <Text style={styles.statusHint}>{t(cfg.hintKey)}</Text>
                </View>
              </View>

              <View style={styles.contactPreview}>
                <Text style={styles.contactName}>{existing.name}</Text>
                <Text style={styles.contactRel}>{relationshipLabel(existing.relationship)}</Text>
                <Text style={styles.contactPhone}>{t('emergency.phone_label', { phone: existing.phoneMasked })}</Text>
                <Text style={styles.contactReach}>{t('emergency.preferred', { via: existing.reachVia })}</Text>
                {existing.callLogCount > 0 && (
                  <Text style={styles.callLogText}>
                    {existing.callLogCount === 1
                      ? t('emergency.used_times_one', { count: existing.callLogCount })
                      : t('emergency.used_times_other', { count: existing.callLogCount })}
                  </Text>
                )}

              </View>

              {existing.status === 'rejected' && existing.rejectionReason ? (
                <View style={styles.rejectionCard}>
                  <Text style={styles.rejectionText}>{t('emergency.reason', { reason: existing.rejectionReason })}</Text>
                </View>
              ) : null}

              {existing.status === 'rejected' && (
                <Text style={styles.resubmitHint}>{t('emergency.resubmit_hint')}</Text>
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                  <Text style={styles.editBtnText}>{t('emergency.update_contact')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtn} onPress={removeContact} disabled={deleting}>
                  {deleting ? <ActivityIndicator size="small" color="#E57373" /> : <Text style={styles.removeBtnText}>{t('emergency.remove')}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

        {editing && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>{existing ? t('emergency.update_contact') : t('emergency.add_title')}</Text>

            <Text style={styles.fieldLabel}>{t('emergency.contact_name')}</Text>
            <TextInput style={styles.input} placeholder={t('emergency.name_placeholder')} placeholderTextColor={colors.gray} value={name} onChangeText={setName} />

            <Text style={styles.fieldLabel}>{t('emergency.relationship')}</Text>
            <View style={styles.chipsWrap}>
              {RELATIONSHIP_KEYS.map((r) => (
                <TouchableOpacity key={r.id} style={[styles.chip, relationship === r.id && styles.chipActive]} onPress={() => setRelationship(r.id)}>
                  <Text style={[styles.chipText, relationship === r.id && styles.chipTextActive]}>{t(r.key)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>{t('emergency.phone_number')}</Text>
            <TextInput
              style={styles.input}
              placeholder="+91-XXXXXXXXXX"
              placeholderTextColor={colors.gray}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.fieldLabel}>{t('emergency.reach_label')}</Text>
            <View style={styles.reachRow}>
              {REACH_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.reachCard, reachVia === opt.id && styles.reachCardActive]}
                  onPress={() => setReachVia(opt.id)}
                >
                  <Text style={[styles.reachLabel, reachVia === opt.id && styles.reachLabelActive]}>{t(opt.labelKey)}</Text>
                  <Text style={[styles.reachHint, reachVia === opt.id && { color: 'rgba(255,255,255,0.8)' }]}>{t(opt.hintKey)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>{t('emergency.context_note')}</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              placeholder={t('emergency.context_placeholder')}
              placeholderTextColor={colors.gray}
              value={userMessage}
              onChangeText={setUserMessage}
              multiline
              textAlignVertical="top"
              maxLength={300}
            />
            <Text style={styles.charCount}>{userMessage.length}/300</Text>

            <View style={styles.consentBox}>
              <View style={styles.consentLeft}>
                <Text style={styles.consentTitle}>{t('emergency.consent_title')}</Text>
                <Text style={styles.consentText}>{t('emergency.consent_text')}</Text>
              </View>
              <Switch
                value={consentGiven}
                onValueChange={setConsentGiven}
                trackColor={{ false: colors.gray3, true: colors.primary }}
                thumbColor={consentGiven ? colors.white : colors.gray}
              />
            </View>

            {existing && (
              <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelEditBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, (!consentGiven || submitting) && styles.submitBtnDisabled]}
              onPress={submit}
              disabled={!consentGiven || submitting}
            >
              {submitting
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.submitBtnText}>{t('emergency.submit_verification')}</Text>}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>{t('emergency.privacy_title')}</Text>
          <Text style={styles.privacyText}>
            {t('emergency.privacy_text')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const mapStateToProps = state => ({ auth: state.auth });
export default connect(mapStateToProps)(EmergencyContactScreen);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#C62828', paddingTop: 48, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 16 },
  backText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.white },
  scroll: { padding: 20, paddingBottom: 60 },
  infoCard: { backgroundColor: '#C62828', borderRadius: 14, padding: 16, marginBottom: 20 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: colors.white, marginBottom: 6 },
  infoText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  statusCard: { backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 20, elevation: 2, borderLeftWidth: 5 },
  statusRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  statusIcon: { fontSize: 22 },
  statusLabel: { fontSize: 15, fontWeight: '700' },
  statusHint: { fontSize: 12, color: colors.gray, marginTop: 2 },
  contactPreview: { backgroundColor: colors.cream, borderRadius: 10, padding: 14, marginBottom: 12 },
  contactName: { fontSize: 18, fontWeight: '800', color: colors.secondary },
  contactRel: { fontSize: 13, color: colors.gray, fontStyle: 'italic', marginBottom: 6 },
  contactPhone: { fontSize: 14, color: colors.secondary, marginBottom: 2 },
  contactReach: { fontSize: 12, color: colors.gray },
  callLogText: { fontSize: 12, color: colors.primary, marginTop: 6, fontWeight: '600' },
  rejectionCard: { backgroundColor: '#FFEBEE', borderRadius: 8, padding: 10, marginBottom: 10 },
  rejectionText: { fontSize: 13, color: '#C62828' },
  resubmitHint: { fontSize: 12, color: colors.gray, marginBottom: 10, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 10 },
  editBtn: { flex: 1, backgroundColor: colors.secondary, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  editBtnText: { color: colors.white, fontWeight: '600', fontSize: 13 },
  removeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#E57373', borderRadius: 12, alignItems: 'center' },
  removeBtnText: { color: '#E57373', fontWeight: '600', fontSize: 13 },
  form: { backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 20, elevation: 1 },
  formTitle: { fontSize: 17, fontWeight: '800', color: colors.secondary, marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: colors.secondary, marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderColor: colors.gray3, borderRadius: 10, padding: 12, fontSize: 15 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.cream, borderRadius: 20 },
  chipActive: { backgroundColor: '#C62828' },
  chipText: { fontSize: 13, color: colors.secondary, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  reachRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  reachCard: { flex: 1, minWidth: '30%', backgroundColor: colors.cream, borderRadius: 10, padding: 12 },
  reachCardActive: { backgroundColor: colors.secondary },
  reachLabel: { fontSize: 13, fontWeight: '700', color: colors.secondary },
  reachLabelActive: { color: colors.white },
  reachHint: { fontSize: 11, color: colors.gray, marginTop: 2 },
  charCount: { fontSize: 11, color: colors.gray, textAlign: 'right', marginTop: 4 },
  consentBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF3E0', borderRadius: 12, padding: 14, marginTop: 16, gap: 12 },
  consentLeft: { flex: 1 },
  consentTitle: { fontSize: 14, fontWeight: '700', color: '#E65100', marginBottom: 4 },
  consentText: { fontSize: 12, color: '#BF360C', lineHeight: 18 },
  cancelEditBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  cancelEditBtnText: { color: colors.gray, fontSize: 14 },
  submitBtn: { backgroundColor: '#C62828', borderRadius: 24, paddingVertical: 16, alignItems: 'center', marginTop: 16, elevation: 2 },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  privacyCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, elevation: 1 },
  privacyTitle: { fontSize: 14, fontWeight: '700', color: colors.secondary, marginBottom: 6 },
  privacyText: { fontSize: 13, color: colors.gray, lineHeight: 20 },
});
