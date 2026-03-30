import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { connect } from 'react-redux';
import api from '../utils/apiClient';
import { colors } from '../constants/theme';

const RELATIONSHIPS = ['Parent', 'Sibling', 'Partner', 'Friend', 'Roommate', 'Relative', 'Other'];
const REACH_OPTIONS = [
  { id: 'call', label: '📞 Call', hint: 'Phone call only' },
  { id: 'whatsapp', label: '💬 WhatsApp', hint: 'WhatsApp message' },
  { id: 'both', label: '📞💬 Both', hint: 'Call or WhatsApp' },
];

const STATUS_CONFIG = {
  awaiting_admin: { color: '#FFB74D', icon: '⏳', label: 'Pending Verification', hint: 'Admin is reviewing your submission.' },
  verified:       { color: '#81C784', icon: '✅', label: 'Verified & Active', hint: 'Your contact will be reached in a life-threatening emergency.' },
  rejected:       { color: '#E57373', icon: '❌', label: 'Not Approved', hint: 'Admin could not verify this contact. Please update and resubmit.' },
};

const EmergencyContactScreen = ({ navigation }) => {
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [reachVia, setReachVia] = useState('call');
  const [userMessage, setUserMessage] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

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
        setEditing(true); // no contact yet — show form
      }
    } catch (e) {
      Alert.alert('Error', 'Could not load emergency contact info.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchContact(); }, [fetchContact]);

  const submit = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Please enter your contact\'s name.'); return; }
    if (!relationship) { Alert.alert('Required', 'Please select a relationship.'); return; }
    if (!phone.trim()) { Alert.alert('Required', 'Please enter a phone number.'); return; }
    if (!consentGiven) { Alert.alert('Consent Required', 'You must give consent before saving an emergency contact.'); return; }

    Alert.alert(
      '🛡️ Save Emergency Contact',
      `You're submitting ${name} (${relationship}) as your emergency contact.\n\nAdmin will verify this and they will ONLY be contacted in a life-threatening emergency. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Submit', onPress: async () => {
            setSubmitting(true);
            try {
              await api.post('/api/emergency-contact', {
                name: name.trim(), relationship, phone: phone.trim(),
                reachVia, userMessage: userMessage.trim(), consentGiven,
              });
              setEditing(false);
              fetchContact();
            } catch (e) {
              Alert.alert('Error', e.response?.data?.error || 'Could not save contact.');
            }
            setSubmitting(false);
          },
        },
      ]
    );
  };

  const removeContact = () => {
    Alert.alert(
      'Remove Emergency Contact',
      'This will permanently remove your emergency contact and revoke consent. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive', onPress: async () => {
            setDeleting(true);
            try {
              await api.delete('/api/emergency-contact');
              setExisting(null);
              setName(''); setRelationship(''); setPhone('');
              setReachVia('call'); setUserMessage(''); setConsentGiven(false);
              setEditing(true);
            } catch (e) {
              Alert.alert('Error', 'Could not remove contact.');
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
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Contact</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* How it works */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🆘 How this works</Text>
          <Text style={styles.infoText}>
            Add a trusted person's contact. If you're ever in a life-threatening crisis, our admin team can reach out to them directly — with your consent. This is a human-reviewed safety net.
          </Text>
        </View>

        {/* Status card for existing contact */}
        {existing && !editing && (() => {
          const cfg = STATUS_CONFIG[existing.status] || STATUS_CONFIG.awaiting_admin;
          return (
            <View style={[styles.statusCard, { borderLeftColor: cfg.color }]}>
              <View style={styles.statusRow}>
                <Text style={styles.statusIcon}>{cfg.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={styles.statusHint}>{cfg.hint}</Text>
                </View>
              </View>

              <View style={styles.contactPreview}>
                <Text style={styles.contactName}>{existing.name}</Text>
                <Text style={styles.contactRel}>{existing.relationship}</Text>
                <Text style={styles.contactPhone}>📞 {existing.phoneMasked}</Text>
                <Text style={styles.contactReach}>Preferred: {existing.reachVia}</Text>
                {existing.callLogCount > 0 && (
                  <Text style={styles.callLogText}>📋 Used {existing.callLogCount} time{existing.callLogCount !== 1 ? 's' : ''}</Text>
                )}
              </View>

              {existing.status === 'rejected' && existing.rejectionReason ? (
                <View style={styles.rejectionCard}>
                  <Text style={styles.rejectionText}>Reason: {existing.rejectionReason}</Text>
                </View>
              ) : null}

              {existing.status === 'rejected' && (
                <Text style={styles.resubmitHint}>Please update and resubmit below.</Text>
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                  <Text style={styles.editBtnText}>✏️ Update Contact</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtn} onPress={removeContact} disabled={deleting}>
                  {deleting ? <ActivityIndicator size="small" color="#E57373" /> : <Text style={styles.removeBtnText}>🗑️ Remove</Text>}
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

        {/* Form */}
        {editing && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>{existing ? 'Update Contact' : 'Add Emergency Contact'}</Text>

            <Text style={styles.fieldLabel}>Contact Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Mom / Rahul Sharma" placeholderTextColor={colors.gray} value={name} onChangeText={setName} />

            <Text style={styles.fieldLabel}>Relationship *</Text>
            <View style={styles.chipsWrap}>
              {RELATIONSHIPS.map(r => (
                <TouchableOpacity key={r} style={[styles.chip, relationship === r && styles.chipActive]} onPress={() => setRelationship(r)}>
                  <Text style={[styles.chipText, relationship === r && styles.chipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="+91-XXXXXXXXXX"
              placeholderTextColor={colors.gray}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.fieldLabel}>How to reach them</Text>
            <View style={styles.reachRow}>
              {REACH_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.reachCard, reachVia === opt.id && styles.reachCardActive]}
                  onPress={() => setReachVia(opt.id)}
                >
                  <Text style={[styles.reachLabel, reachVia === opt.id && styles.reachLabelActive]}>{opt.label}</Text>
                  <Text style={[styles.reachHint, reachVia === opt.id && { color: 'rgba(255,255,255,0.8)' }]}>{opt.hint}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Context note for admin (optional)</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              placeholder="e.g. My mom knows about my anxiety. Please mention MindCare when calling."
              placeholderTextColor={colors.gray}
              value={userMessage}
              onChangeText={setUserMessage}
              multiline
              textAlignVertical="top"
              maxLength={300}
            />
            <Text style={styles.charCount}>{userMessage.length}/300</Text>

            {/* Consent switch */}
            <View style={styles.consentBox}>
              <View style={styles.consentLeft}>
                <Text style={styles.consentTitle}>I give consent *</Text>
                <Text style={styles.consentText}>
                  I authorize MindCare admins to contact this person ONLY in a life-threatening emergency situation, in accordance with MindCare's safety policy.
                </Text>
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
                <Text style={styles.cancelEditBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, (!consentGiven || submitting) && styles.submitBtnDisabled]}
              onPress={submit}
              disabled={!consentGiven || submitting}
            >
              {submitting
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.submitBtnText}>Submit for Admin Verification</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Privacy note */}
        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>🔒 Privacy</Text>
          <Text style={styles.privacyText}>
            Your contact's full phone number is{' '}
            <Text style={{ fontWeight: '700' }}>never stored in plaintext accessible to any user</Text>.
            Only authorized MindCare admins can view it during a verified crisis. You can revoke consent at any time.
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
  // Status
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
  // Form
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
  // Privacy
  privacyCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, elevation: 1 },
  privacyTitle: { fontSize: 14, fontWeight: '700', color: colors.secondary, marginBottom: 6 },
  privacyText: { fontSize: 13, color: colors.gray, lineHeight: 20 },
});
