import React, { useEffect, useState, useCallback, useMemo, createContext, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ScrollView, ActivityIndicator, TextInput, Alert, Modal, Linking, Dimensions, StatusBar, Image
} from 'react-native';
import api from '../../../utils/apiClient';
import { colors } from '../../../constants/theme';
import { LineChart, ContributionGraph } from 'react-native-chart-kit';
import { useDispatch } from 'react-redux';
import { logout } from '../../../redux/actions/auth';
import { useNavigation } from '@react-navigation/native';
import { ADMIN_TOKEN } from '@env';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import useTranslation from '../../../utils/i18n';

const H = { headers: { 'x-admin-token': ADMIN_TOKEN } };

// ─── Design Themes ────────────────────────────────────────────────────────────
const DARK_THEME = {
  bg: '#0F1117',
  surface: '#1A1D27',
  surfaceElevated: '#22263A',
  surfaceBorder: '#2A2E45',
  primary: '#6C9B4A',
  primaryLight: '#8CC063',
  accent: '#4C78C4',
  accentLight: '#6B9BE2',
  danger: '#E05A5A',
  dangerDeep: '#A33030',
  warning: '#E8A249',
  success: '#5BAD7C',
  textPrimary: '#EAEDF4',
  textSecondary: '#8891AB',
  textMuted: '#545B76',
  borderColor: '#2A2E45',
  cardRadius: 16,
  tabRadius: 10,
};

const LIGHT_THEME = {
  bg: '#F4F6F9',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F3F5',
  surfaceBorder: '#E5E9F0',
  primary: '#6C9B4A',
  primaryLight: '#8CC063',
  accent: '#4C78C4',
  accentLight: '#6B9BE2',
  danger: '#E05A5A',
  dangerDeep: '#A33030',
  warning: '#E8A249',
  success: '#5BAD7C',
  textPrimary: '#111111',
  textSecondary: '#555555',
  textMuted: '#777777',
  borderColor: '#D8DEE9',
  cardRadius: 16,
  tabRadius: 10,
};

const ThemeContext = createContext({ D: DARK_THEME, ss: {} });
const D = DARK_THEME;

const RISK_COLORS = {
  LOW: DARK_THEME.success,
  MEDIUM: DARK_THEME.warning,
  HIGH: DARK_THEME.danger,
  CRITICAL: DARK_THEME.dangerDeep,
};

const ACTION_COLORS = {
  none: DARK_THEME.textMuted,
  contacted: DARK_THEME.accent,
  referred: DARK_THEME.warning,
  resolved: DARK_THEME.success,
};

const PREDEFINED_RESOURCES = [
  { id: 'r1', title: 'Managing Severe Anxiety Patterns', type: 'article', url: 'https://mindcare.example.com/r/anxiety-patterns' },
  { id: 'r2', title: 'Guided Grounding Meditation (10 mins)', type: 'video', url: 'https://mindcare.example.com/r/grounding-meditation' },
  { id: 'r3', title: 'Crisis Coping Worksheet', type: 'exercise', url: 'https://mindcare.example.com/r/crisis-worksheet' },
  { id: 'r4', title: 'Sleep Hygiene Refresher', type: 'article', url: 'https://mindcare.example.com/r/sleep-hygiene' },
];

// ─── Shared Micro-components ──────────────────────────────────────────────────
const SectionHeader = ({ icon, title, count }) => {
  const { D, ss } = useContext(ThemeContext);
  return (
    <View style={ss.sectionHeader}>
      <MaterialIcons name={icon} size={18} color={D.primary} />
      <Text style={ss.sectionHeaderText}>{title}</Text>
      {count !== undefined && (
        <View style={ss.sectionBadge}>
          <Text style={ss.sectionBadgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
};

const EmptyState = ({ icon, message }) => {
  const { D, ss } = useContext(ThemeContext);
  return (
    <View style={ss.emptyState}>
      <MaterialIcons name={icon} size={36} color={D.textMuted} />
      <Text style={ss.emptyStateText}>{message}</Text>
    </View>
  );
};

const PillBadge = ({ label, color, textColor }) => {
  const { ss } = useContext(ThemeContext);
  return (
    <View style={[ss.pillBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <Text style={[ss.pillBadgeText, { color: textColor || color }]}>{label}</Text>
    </View>
  );
};

const ActionButton = ({ label, icon, color, onPress, style }) => {
  const { ss } = useContext(ThemeContext);
  return (
    <TouchableOpacity style={[ss.actionButton, { backgroundColor: color }, style]} onPress={onPress} activeOpacity={0.8}>
      {icon && <MaterialIcons name={icon} size={15} color="#fff" style={{ marginRight: 6 }} />}
      <Text style={ss.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );
};

// ─── Pending Tab ──────────────────────────────────────────────────────────────
const PendingTab = () => {
  const { t } = useTranslation();
  const { D, ss } = useContext(ThemeContext);
  const [data, setData] = useState({ appointmentRequests: [], riskReports: [], pendingContacts: [], wellnessPlans: [], deletionRequests: [], totalPending: 0, escalatedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [therapists, setTherapists] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [cmsResources, setCmsResources] = useState([]);

  const [assignModal, setAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignTherapist, setAssignTherapist] = useState(null);
  const [assignDate, setAssignDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [assignSlot, setAssignSlot] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [verifyModal, setVerifyModal] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [verifyNote, setVerifyNote] = useState('');
  const [verifyAction, setVerifyAction] = useState('contacted');
  const [verifyResources, setVerifyResources] = useState([]);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [ecModal, setEcModal] = useState(false);
  const [ecTarget, setEcTarget] = useState(null);
  const [ecNote, setEcNote] = useState('');
  const [ecLoading, setEcLoading] = useState(false);

  const [callModal, setCallModal] = useState(false);
  const [callTarget, setCallTarget] = useState(null);
  const [callOutcome, setCallOutcome] = useState('reached');
  const [callNote, setCallNote] = useState('');
  const [callLoading, setCallLoading] = useState(false);

  const [planModal, setPlanModal] = useState(false);
  const [planTarget, setPlanTarget] = useState(null);
  const [planFocus, setPlanFocus] = useState('');
  const [planNote, setPlanNote] = useState('');
  const defaultPlanTasks = () => ([{ dayNumber: 1, title: t('admin.default_plan_task_title'), type: 'breathing', description: t('admin.default_plan_task_desc') }]);
  const [planTasks, setPlanTasks] = useState(defaultPlanTasks());
  const [planLoading, setPlanLoading] = useState(false);

  const [delModal, setDelModal] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [delNote, setDelNote] = useState('');
  const [delLoading, setDelLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendRes, therapistsRes, resourcesRes] = await Promise.all([
        api.get('/api/admin/pending-verification', H),
        api.get('/api/therapists'),
        api.get('/api/admin/resources', H),
      ]);
      setData(pendRes.data);
      setTherapists(therapistsRes.data || []);
      setCmsResources((resourcesRes.data || []).filter(r => r.active !== false));
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.load_pending_failed'));
    }
    setLoading(false);
  }, []);

  const runSLACheck = async () => {
    try {
      await api.post('/api/admin/sla/run', {}, H);
      Alert.alert(t('admin.alert_sla_complete'), t('admin.sla_escalated'));
      load();
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.sla_check_failed'));
    }
  };

  useEffect(() => { load(); }, [load]);

  const checkSlots = async () => {
    if (!assignTherapist || !assignDate) return;
    setSlotsLoading(true);
    setAvailableSlots([]);
    setAssignSlot('');
    try {
      const res = await api.get('/api/admin/therapist-availability', {
        ...H,
        params: {
          therapistId: assignTherapist.id,
          date: assignDate,
          appointmentId: assignTarget?.id || assignTarget?._id
        },
      });
      setAvailableSlots(res.data.available || []);
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.availability_failed'));
    }
    setSlotsLoading(false);
  };

  const confirmAssign = async () => {
    if (!assignTherapist || !assignDate || !assignSlot) {
      Alert.alert(t('admin.alert_incomplete'), t('admin.assign_incomplete'));
      return;
    }
    setAssignLoading(true);
    try {
      await api.post(`/api/admin/appointments/${assignTarget.id}/assign`, {
        therapistId: assignTherapist.id,
        date: assignDate,
        timeSlot: assignSlot,
        adminNote: assignNote,
      }, H);
      Alert.alert(t('admin.alert_assigned'), t('admin.session_confirmed', { name: assignTarget.userName }));
      setAssignModal(false);
      load();
    } catch (e) {
      Alert.alert(t('admin.alert_failed'), e.response?.data?.error || t('admin.assign_failed'));
    }
    setAssignLoading(false);
  };

  const confirmVerify = async () => {
    setVerifyLoading(true);
    try {
      await api.patch(`/api/admin/issues/${verifyTarget.id}/verify`, {
        adminNote: verifyNote.trim(),
        adminAction: verifyAction,
        assignedResources: verifyResources
      }, H);
      Alert.alert(t('admin.alert_verified'), t('admin.report_marked', { action: verifyAction }));
      setVerifyModal(false);
      load();
    } catch (e) {
      Alert.alert(t('admin.alert_failed'), t('admin.verify_report_failed'));
    }
    setVerifyLoading(false);
  };

  const confirmVerifyEC = async (action) => {
    setEcLoading(true);
    try {
      const endpoint = action === 'verify'
        ? `/api/admin/emergency-contacts/${ecTarget.id}/verify`
        : `/api/admin/emergency-contacts/${ecTarget.id}/reject`;
      const body = action === 'verify' ? { adminNote: ecNote } : { rejectionReason: ecNote };
      await api.patch(endpoint, body, H);
      Alert.alert(action === 'verify' ? t('admin.alert_verified') : t('admin.alert_rejected'), action === 'verify' ? t('admin.ec_verified') : t('admin.ec_rejected'));
      setEcModal(false);
      load();
    } catch (e) {
      Alert.alert(t('admin.alert_failed'), t('admin.ec_verify_failed'));
    }
    setEcLoading(false);
  };

  const openCallModal = async (userId) => {
    try {
      const res = await api.get(`/api/admin/emergency-contacts/${userId}`, H);
      if (res.data.exists) {
        setCallTarget({ ...res.data, userId });
        setCallOutcome('reached');
        setCallNote('');
        setCallModal(true);
      } else {
        Alert.alert(t('admin.alert_no_contact'), t('admin.no_ec_on_file'));
      }
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.load_ec_failed'));
    }
  };

  const logCall = async () => {
    setCallLoading(true);
    try {
      await api.post(`/api/admin/emergency-contacts/${callTarget.userId}/log-call`, {
        outcome: callOutcome, adminNote: callNote, triggeredBy: verifyTarget?.id || '',
      }, H);
      Alert.alert(t('admin.alert_logged'), t('admin.call_logged'));
      setCallModal(false);
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.log_call_failed'));
    }
    setCallLoading(false);
  };

  const assignPlan = async () => {
    if (!planFocus) return Alert.alert(t('admin.alert_error'), t('admin.plan_focus_required'));
    setPlanLoading(true);
    try {
      const grouped = {};
      planTasks.forEach(task => {
        if (!grouped[task.dayNumber]) grouped[task.dayNumber] = [];
        grouped[task.dayNumber].push(task);
      });
      const dailyPlans = Object.keys(grouped).map(dayStr => ({
        dayNumber: parseInt(dayStr, 10),
        tasks: grouped[dayStr]
      }));
      await api.post(`/api/admin/wellness-plans/${planTarget.id}/assign`, {
        planFocus,
        adminNote: planNote,
        dailyPlans
      }, H);
      Alert.alert(t('admin.alert_plan_assigned'), t('admin.plan_sent', { name: planTarget.userName }));
      setPlanModal(false);
      load();
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.assign_plan_failed'));
    }
    setPlanLoading(false);
  };

  const updateTask = (index, field, value) => {
    const updated = [...planTasks];
    updated[index][field] = value;
    setPlanTasks(updated);
  };

  const reviewDeletion = async (action) => {
    setDelLoading(true);
    try {
      await api.patch(`/api/admin/deletion-requests/${delTarget.id}/review`, {
        action,
        adminNote: delNote
      }, H);
      Alert.alert(action === 'approve' ? t('admin.alert_approved') : t('admin.alert_rejected'), t('admin.deletion_reviewed', { action: action === 'approve' ? t('admin.action_approved_word') : t('admin.action_rejected_word') }));
      setDelModal(false);
      load();
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.deletion_failed'));
    }
    setDelLoading(false);
  };

  if (loading) return (
    <View style={ss.loadingContainer}>
      <ActivityIndicator color={D.primary} size="large" />
      <Text style={ss.loadingText}>{t('admin.loading_pending')}</Text>
    </View>
  );

  const STATS = [
    {
      id: 'consultations',
      labelKey: 'admin.stat_consultations',
      value: data.appointmentRequests.length,
      icon: 'event-note',
      color: D.accent,
    },
    {
      id: 'risk_reports',
      labelKey: 'admin.stat_risk_reports',
      value: data.riskReports.length,
      icon: 'warning',
      color: D.danger,
    },
    {
      id: 'emergency_contacts',
      labelKey: 'admin.stat_emergency_contacts',
      value: (data.pendingContacts || []).length,
      icon: 'contact-emergency',
      color: D.warning,
    },
    {
      id: 'wellness_plans',
      labelKey: 'admin.stat_wellness_plans',
      value: (data.wellnessPlans || []).length,
      icon: 'self-improvement',
      color: D.success,
    },
    {
      id: 'deletion_requests',
      labelKey: 'admin.stat_deletion_requests',
      value: (data.deletionRequests || []).length,
      icon: 'delete-forever',
      color: D.dangerDeep,
    },
    {
      id: 'total_pending',
      labelKey: 'admin.stat_total_pending',
      value: data.totalPending,
      icon: 'pending-actions',
      color: D.primaryLight,
    },
  ];

  return (
    <ScrollView contentContainerStyle={ss.tabScroll} showsVerticalScrollIndicator={false}>

      {/* SLA Breach Banner */}
      {data.escalatedCount > 0 && (
        <View style={ss.slaBanner}>
          <View style={ss.slaBannerLeft}>
            <MaterialIcons name="warning" size={20} color="#fff" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={ss.slaBannerTitle}>{t('admin.sla_breach_title', { count: data.escalatedCount, suffix: data.escalatedCount !== 1 ? 'S' : '' })}</Text>
              <Text style={ss.slaBannerSub}>{t('admin.sla_breach_sub')}</Text>
            </View>
          </View>
          <TouchableOpacity style={ss.slaBtn} onPress={runSLACheck}>
            <MaterialIcons name="refresh" size={14} color={D.danger} />
            <Text style={ss.slaBtnText}>{t('admin.rerun_sla')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Overview Stats Grid ── */}
      <View style={ss.overviewHeader}>
        <Text style={ss.overviewTitle}>{t('admin.overview')}</Text>
        <View style={[ss.overviewBadge, data.totalPending > 0 && { backgroundColor: D.danger + '22', borderColor: D.danger + '55' }]}>
          <View style={[ss.overviewBadgeDot, { backgroundColor: data.totalPending > 0 ? D.danger : D.success }]} />
          <Text style={[ss.overviewBadgeText, { color: data.totalPending > 0 ? D.danger : D.success }]}>
            {data.totalPending > 0 ? t('admin.pending_count', { count: data.totalPending }) : t('admin.all_clear')}
          </Text>
        </View>
      </View>

      <View style={ss.statsGrid}>
        {STATS.map((s, i) => (
          <TouchableOpacity 
            key={i} 
            activeOpacity={0.7}
            onPress={() => setActiveFilter(activeFilter === s.id || s.id === 'total_pending' ? null : s.id)}
            style={[
              ss.statTile, 
              { borderTopColor: s.color },
              activeFilter === s.id && { backgroundColor: s.color + '22', transform: [{ scale: 1.02 }] }
            ]}
          >
            <View style={[ss.statIconWrap, { backgroundColor: s.color + '1A' }]}>
              <MaterialIcons name={s.icon} size={18} color={s.color} />
            </View>
            <Text style={ss.statValue}>{s.value}</Text>
            <Text style={ss.statLabel}>{t(s.labelKey)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Divider heading into work queue ── */}
      <View style={ss.workQueueHeader}>
        <View style={ss.workQueueLine} />
        <Text style={ss.workQueueLabel}>{t('admin.work_queue')}</Text>
        <View style={ss.workQueueLine} />
      </View>

      {(!activeFilter || activeFilter === 'consultations') && (
      <View>
      {/* Appointment Requests */}
      <SectionHeader icon="event-note" title={t('admin.section_consultations')} count={data.appointmentRequests.length} />
      {data.appointmentRequests.length === 0
        ? <EmptyState icon="check-circle" message={t('admin.empty_consultations')} />
        : data.appointmentRequests.map(req => (
          <View key={req.id} style={[ss.card, { borderLeftColor: D.accent }]}>
            <View style={ss.cardRow}>
              <View style={ss.cardAvatarCircle}>
                <Text style={ss.cardAvatarText}>{req.userName?.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={ss.cardName}>{req.userName}</Text>
                <Text style={ss.cardMeta}>{new Date(req.createdAt).toLocaleDateString()}</Text>
              </View>
              <PillBadge label={req.requestedSpeciality || t('admin.speciality_any')} color={D.accent} />
            </View>
            <View style={ss.cardDivider} />
            <View style={ss.metaRow}>
              <MaterialIcons name="schedule" size={13} color={D.textMuted} style={{ marginRight: 4 }} />
              <Text style={ss.metaText}>{req.preferredTime || t('admin.no_time_pref')}</Text>
            </View>
            {req.preferredDates?.length > 0 && (
              <View style={ss.metaRow}>
                <MaterialIcons name="date-range" size={13} color={D.textMuted} style={{ marginRight: 4 }} />
                <Text style={ss.metaText}>{req.preferredDates.join(', ')}</Text>
              </View>
            )}
            {req.userNote ? (
              <View style={ss.quoteBox}>
                <MaterialIcons name="format-quote" size={14} color={D.textMuted} />
                <Text style={ss.quoteText}>{req.userNote}</Text>
              </View>
            ) : null}
            <ActionButton
              label={t('admin.assign_therapist')}
              icon="person-add"
              color={D.accent}
              style={{ marginTop: 14 }}
              onPress={() => {
                setAssignTarget(req);
                setAssignModal(true);
                setAssignTherapist(null);
                const prefilledDate = req.preferredDates?.length > 0 ? req.preferredDates[0] : '';
                const prefilledTime = req.preferredTime && req.preferredTime !== t('admin.no_time_pref') ? req.preferredTime : '';
                setAssignDate(prefilledDate);
                setAvailableSlots(prefilledTime ? [prefilledTime] : []);
                setAssignSlot(prefilledTime);
                setAssignNote('');
              }}
            />
          </View>
        ))}
      </View>
      )}

      {(!activeFilter || activeFilter === 'risk_reports') && (
      <View>
      {/* Risk Reports */}
      <SectionHeader icon="warning" title={t('admin.section_risk_reports')} count={data.riskReports.length} />
      {data.riskReports.length === 0
        ? <EmptyState icon="verified-user" message={t('admin.empty_risk_reports')} />
        : data.riskReports.map(rep => (
          <View key={rep.id} style={[ss.card, { borderLeftColor: RISK_COLORS[rep.riskLevel], borderLeftWidth: rep.escalated ? 5 : 3 }]}>
            {rep.escalated && (
              <View style={ss.escalatedBadge}>
                <MaterialIcons name="access-time" size={12} color={D.danger} />
                <Text style={ss.escalatedBadgeText}>{t('admin.sla_breached_min', { minutes: rep.slaBreachMinutes })}</Text>
              </View>
            )}
            <View style={ss.cardRow}>
              <View style={[ss.riskDot, { backgroundColor: RISK_COLORS[rep.riskLevel] }]} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={ss.cardName}>{rep.userName}</Text>
                <Text style={ss.cardMeta}>{rep.userEmail}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <PillBadge label={rep.riskLevel} color={RISK_COLORS[rep.riskLevel]} />
                <Text style={[ss.cardMeta, { marginTop: 4 }]}>{new Date(rep.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>
            <View style={ss.cardDivider} />
            <View style={ss.metaRow}>
              <Text style={ss.metaLabel}>{t('admin.category_label')}</Text>
              <Text style={ss.metaValue}>{rep.category?.replace(/_/g, ' ')}</Text>
              <Text style={[ss.metaLabel, { marginLeft: 16 }]}>{t('admin.severity_label')}</Text>
              <Text style={ss.metaValue}>{rep.severity}/5</Text>
            </View>
            {rep.emotionTags?.length > 0 && (
              <View style={ss.tagRow}>
                {rep.emotionTags.map(tag => (
                  <View key={tag} style={ss.tag}>
                    <Text style={ss.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            {rep.safetyTriggered && (
              <View style={ss.safetyAlert}>
                <MaterialIcons name="crisis-alert" size={13} color={D.danger} />
                <Text style={ss.safetyAlertText}>{t('admin.safety_triggered')}</Text>
              </View>
            )}
            {rep.description ? (
              <View style={ss.quoteBox}>
                <Text style={ss.quoteText}>{rep.description}</Text>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <TouchableOpacity
                style={[ss.actionButton, { flex: 1, backgroundColor: rep.escalated ? D.danger : D.surfaceElevated, borderWidth: 1, borderColor: rep.escalated ? D.danger : D.borderColor }]}
                onPress={() => { setVerifyTarget(rep); setVerifyNote(''); setVerifyAction('contacted'); setVerifyResources([]); setVerifyModal(true); }}
                activeOpacity={0.8}
              >
                <MaterialIcons name="rate-review" size={14} color={rep.escalated ? '#fff' : D.textPrimary} style={{ marginRight: 5 }} />
                <Text style={[ss.actionButtonText, { color: rep.escalated ? '#fff' : D.textPrimary }]}>{rep.escalated ? t('admin.urgent_review') : t('admin.review_action')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ss.actionButton, { flex: 1, backgroundColor: D.dangerDeep }]}
                onPress={() => { setVerifyTarget(rep); openCallModal(rep.userId); }}
                activeOpacity={0.8}
              >
                <MaterialIcons name="phone" size={14} color="#fff" style={{ marginRight: 5 }} />
                <Text style={ss.actionButtonText}>{t('admin.emergency_call')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
      )}

      {(!activeFilter || activeFilter === 'emergency_contacts') && (
      <View>
      {/* Emergency Contacts */}
      <SectionHeader icon="contact-emergency" title={t('admin.section_emergency_contacts')} count={(data.pendingContacts || []).length} />
      {(data.pendingContacts || []).length === 0
        ? <EmptyState icon="check-circle" message={t('admin.empty_emergency_contacts')} />
        : (data.pendingContacts || []).map(ec => (
          <View key={ec.id} style={[ss.card, { borderLeftColor: D.danger }]}>
            <View style={ss.cardRow}>
              <View style={[ss.cardAvatarCircle, { backgroundColor: D.dangerDeep + '33' }]}>
                <MaterialIcons name="emergency" size={18} color={D.danger} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={ss.cardName}>{ec.userName}</Text>
                <Text style={ss.cardMeta}>{ec.userEmail}</Text>
              </View>
              <Text style={ss.cardMeta}>{new Date(ec.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={ss.cardDivider} />
            <View style={ss.metaRow}>
              <Text style={ss.metaLabel}>{t('admin.contact_label')}</Text>
              <Text style={ss.metaValue}>{ec.contactName} ({ec.relationship})</Text>
            </View>
            <View style={ss.metaRow}>
              <MaterialIcons name="phone" size={13} color={D.textMuted} style={{ marginRight: 4 }} />
              <Text style={ss.metaText}>{ec.phone} · via {ec.reachVia}</Text>
            </View>
            {ec.userMessage ? (
              <View style={ss.quoteBox}>
                <Text style={ss.quoteText}>{ec.userMessage}</Text>
              </View>
            ) : null}
            <ActionButton
              label={t('admin.verify_reject_contact')}
              icon="verified"
              color={D.success}
              style={{ marginTop: 14 }}
              onPress={() => { setEcTarget(ec); setEcNote(''); setEcModal(true); }}
            />
          </View>
        ))}
      </View>
      )}

      {(!activeFilter || activeFilter === 'wellness_plans') && (
      <View>
      {/* Wellness Plans */}
      <SectionHeader icon="self-improvement" title={t('admin.section_wellness_plans')} count={(data.wellnessPlans || []).length} />
      {(data.wellnessPlans || []).length === 0
        ? <EmptyState icon="spa" message={t('admin.empty_wellness_plans')} />
        : (data.wellnessPlans || []).map(wp => (
          <View key={wp.id} style={[ss.card, { borderLeftColor: D.success }]}>
            <View style={ss.cardRow}>
              <View style={[ss.cardAvatarCircle, { backgroundColor: D.success + '22' }]}>
                <MaterialIcons name="spa" size={18} color={D.success} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={ss.cardName}>{wp.userName}</Text>
                <Text style={ss.cardMeta}>{wp.userEmail}</Text>
              </View>
              <Text style={ss.cardMeta}>{new Date(wp.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={ss.cardDivider} />
            <View style={ss.metaRow}>
              <Text style={ss.metaLabel}>{t('admin.goals_label')}</Text>
              <Text style={ss.metaValue}>{(wp.goals || []).join(', ')}</Text>
            </View>
            <View style={ss.metaRow}>
              <Text style={ss.metaLabel}>{t('admin.pace_label')}</Text>
              <Text style={ss.metaValue}>{wp.preferredPace}</Text>
            </View>
            {wp.currentStruggles ? (
              <View style={ss.quoteBox}>
                <Text style={ss.quoteText}>{wp.currentStruggles}</Text>
              </View>
            ) : null}
            <ActionButton
              label={t('admin.build_assign_plan')}
              icon="build"
              color={D.success}
              style={{ marginTop: 14 }}
              onPress={() => {
                setPlanTarget(wp);
                setPlanFocus(t('admin.plan_30_day', { goal: (wp.goals || [])[0] || t('admin.default_wellness') }));
                setPlanNote(t('admin.plan_note_template', { name: wp.userName }));
                setPlanTasks(defaultPlanTasks());
                setPlanModal(true);
              }}
            />
          </View>
        ))}
      </View>
      )}

      {(!activeFilter || activeFilter === 'deletion_requests') && (
      <View>
      {/* Deletion Requests */}
      <SectionHeader icon="delete-forever" title={t('admin.section_deletion')} count={(data.deletionRequests || []).length} />
      {(data.deletionRequests || []).length === 0
        ? <EmptyState icon="check-circle" message={t('admin.empty_deletion')} />
        : (data.deletionRequests || []).map(del => (
          <View key={del.id} style={[ss.card, { borderLeftColor: D.danger }]}>
            <View style={ss.cardRow}>
              <View style={[ss.cardAvatarCircle, { backgroundColor: D.danger + '22' }]}>
                <MaterialIcons name="person-remove" size={18} color={D.danger} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={ss.cardName}>{del.userName}</Text>
                <Text style={ss.cardMeta}>{del.userEmail}</Text>
              </View>
              <Text style={ss.cardMeta}>{new Date(del.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={ss.cardDivider} />
            <View style={ss.metaRow}>
              <Text style={ss.metaLabel}>{t('admin.reason_label')}</Text>
              <Text style={ss.metaValue}>{del.reason}</Text>
            </View>
            <ActionButton
              label={t('admin.review_deletion')}
              icon="gavel"
              color={D.danger}
              style={{ marginTop: 14 }}
              onPress={() => { setDelTarget(del); setDelNote(''); setDelModal(true); }}
            />
          </View>
        ))}
      </View>
      )}

      {/* ── Assign Modal ── */}
      <Modal visible={assignModal} transparent animationType="slide">
        <View style={ss.modalOverlay}>
          <ScrollView contentContainerStyle={ss.modalSheet}>
            <View style={ss.modalHandle} />
            <View style={ss.modalHeaderRow}>
              <Text style={ss.modalTitle}>{t('admin.modal_assign_therapist')}</Text>
              <TouchableOpacity onPress={() => setAssignModal(false)} style={ss.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={D.textSecondary} />
              </TouchableOpacity>
            </View>
            {assignTarget && (
              <View style={ss.modalInfoBox}>
                <Text style={ss.modalInfoText}>{t('admin.modal_for_user', { name: assignTarget.userName, speciality: assignTarget.requestedSpeciality || t('admin.any_specialist') })}</Text>
              </View>
            )}

            <Text style={ss.modalLabel}>{t('admin.select_therapist')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {therapists
                .filter(th => !assignTarget?.requestedSpeciality || assignTarget.requestedSpeciality === 'Any' || th.specialisation === assignTarget.requestedSpeciality)
                .map(th => (
                  <TouchableOpacity
                    key={th.id}
                    style={[ss.therapistChip, assignTherapist?.id === th.id && ss.therapistChipActive]}
                    onPress={() => { setAssignTherapist(th); setAvailableSlots([]); setAssignSlot(''); }}
                  >
                    <Text style={[ss.therapistChipName, assignTherapist?.id === th.id && { color: '#fff' }]}>{th.name}</Text>
                    <Text style={[ss.therapistChipSpec, assignTherapist?.id === th.id && { color: 'rgba(255,255,255,0.7)' }]}>{th.specialisation}</Text>
                  </TouchableOpacity>
                ))
              }
            </ScrollView>

            <Text style={ss.modalLabel}>{t('admin.choose_date')}</Text>
            <TextInput
              style={ss.modalInput}
              placeholder={t('admin.placeholder_date')}
              value={assignDate}
              onChangeText={setAssignDate}
              placeholderTextColor={D.textMuted}
            />

            <TouchableOpacity style={ss.modalPrimaryBtn} onPress={checkSlots} disabled={!assignTherapist || !assignDate}>
              {slotsLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <MaterialIcons name="search" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={ss.modalPrimaryBtnText}>{t('admin.check_slots')}</Text>
                </>
              )}
            </TouchableOpacity>

            {availableSlots.length > 0 && (
              <>
                <Text style={ss.modalLabel}>{t('admin.pick_time_slot')}</Text>
                <View style={ss.slotGrid}>
                  {availableSlots.map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[ss.slotChip, assignSlot === s && ss.slotChipActive]}
                      onPress={() => setAssignSlot(s)}
                    >
                      <Text style={[ss.slotChipText, assignSlot === s && { color: '#fff' }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            {assignTherapist && assignDate && availableSlots.length === 0 && !slotsLoading && (
              <Text style={ss.noSlotsText}>{t('admin.no_slots')}</Text>
            )}

            <Text style={ss.modalLabel}>{t('admin.note_for_user')}</Text>
            <TextInput
              style={[ss.modalInput, { minHeight: 70 }]}
              placeholder={t('admin.placeholder_join_early')}
              value={assignNote}
              onChangeText={setAssignNote}
              multiline
              placeholderTextColor={D.textMuted}
            />

            <TouchableOpacity style={ss.modalConfirmBtn} onPress={confirmAssign} disabled={assignLoading}>
              {assignLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <MaterialIcons name="check-circle" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={ss.modalPrimaryBtnText}>{t('admin.confirm_assign')}</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={ss.modalCancelBtn} onPress={() => setAssignModal(false)}>
              <Text style={ss.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Verify Report Modal ── */}
      <Modal visible={verifyModal} transparent animationType="slide">
        <View style={ss.modalOverlay}>
          <ScrollView contentContainerStyle={ss.modalSheet}>
            <View style={ss.modalHandle} />
            <View style={ss.modalHeaderRow}>
              <Text style={ss.modalTitle}>{t('admin.modal_review_report')}</Text>
              <TouchableOpacity onPress={() => setVerifyModal(false)} style={ss.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={D.textSecondary} />
              </TouchableOpacity>
            </View>
            {verifyTarget && (
              <View style={[ss.modalInfoBox, { borderLeftColor: RISK_COLORS[verifyTarget.riskLevel], borderLeftWidth: 3 }]}>
                <Text style={ss.modalInfoText}><Text style={{ color: D.textPrimary, fontWeight: '700' }}>{verifyTarget.userName}</Text> · <Text style={{ color: RISK_COLORS[verifyTarget.riskLevel], fontWeight: '700' }}>{verifyTarget.riskLevel} RISK</Text></Text>
                {verifyTarget.description ? <Text style={[ss.modalInfoText, { marginTop: 6, fontStyle: 'italic' }]}>{verifyTarget.description}</Text> : null}
              </View>
            )}

            <Text style={ss.modalLabel}>{t('admin.admin_action')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {[
                { key: 'contacted', labelKey: 'admin.action_contacted' },
                { key: 'referred', labelKey: 'admin.action_referred' },
                { key: 'resolved', labelKey: 'admin.action_resolved' },
              ].map(act => (
                <TouchableOpacity
                  key={act.key}
                  style={[ss.segmentChip, verifyAction === act.key && { backgroundColor: ACTION_COLORS[act.key], borderColor: ACTION_COLORS[act.key] }]}
                  onPress={() => setVerifyAction(act.key)}
                >
                  <Text style={[ss.segmentChipText, verifyAction === act.key && { color: '#fff' }]}>
                    {t(act.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={ss.modalLabel}>{t('admin.add_resource')}</Text>
            <View style={{ marginBottom: 12 }}>
              {cmsResources.length === 0 ? (
                <Text style={[ss.emptyStateText, { textAlign: 'left', padding: 0, marginBottom: 8 }]}>{t('admin.no_resources')}</Text>
              ) : cmsResources.map(res => {
                const isSelected = verifyResources.some(vr => vr.id === res.id);
                return (
                  <TouchableOpacity
                    key={res.id}
                    style={[ss.resourceItem, isSelected && { borderColor: D.success, backgroundColor: D.success + '11' }]}
                    onPress={() => {
                      if (isSelected) setVerifyResources(verifyResources.filter(vr => vr.id !== res.id));
                      else setVerifyResources([...verifyResources, res]);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={ss.resourceType}>{res.type.toUpperCase()}</Text>
                      <Text style={[ss.resourceTitle, isSelected && { color: D.textPrimary }]}>{res.title}</Text>
                    </View>
                    <MaterialIcons name={isSelected ? 'check-circle' : 'add-circle-outline'} size={20} color={isSelected ? D.success : D.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={ss.modalLabel}>{t('admin.action_note')}</Text>
            <TextInput
              style={[ss.modalInput, { minHeight: 80 }]}
              placeholder={t('admin.placeholder_action_note')}
              value={verifyNote}
              onChangeText={setVerifyNote}
              multiline
              placeholderTextColor={D.textMuted}
            />

            <TouchableOpacity style={ss.modalConfirmBtn} onPress={confirmVerify} disabled={verifyLoading}>
              {verifyLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={ss.modalPrimaryBtnText}>{t('admin.confirm_action')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={ss.modalCancelBtn} onPress={() => setVerifyModal(false)}>
              <Text style={ss.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── EC Verify Modal ── */}
      <Modal visible={ecModal} transparent animationType="slide">
        <View style={ss.modalOverlay}>
          <ScrollView contentContainerStyle={ss.modalSheet}>
            <View style={ss.modalHandle} />
            <View style={ss.modalHeaderRow}>
              <Text style={ss.modalTitle}>{t('admin.modal_verify_ec')}</Text>
              <TouchableOpacity onPress={() => setEcModal(false)} style={ss.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={D.textSecondary} />
              </TouchableOpacity>
            </View>
            {ecTarget && (
              <View style={ss.modalInfoBox}>
                <Text style={ss.modalInfoText}>{ecTarget.userName}</Text>
                <View style={{ marginTop: 10 }}>
                  <View style={ss.metaRow}>
                    <Text style={ss.metaLabel}>{t('admin.contact_label')}</Text>
                    <Text style={ss.metaValue}>{ecTarget.contactName} ({ecTarget.relationship})</Text>
                  </View>
                  <View style={ss.metaRow}>
                    <MaterialIcons name="phone" size={13} color={D.textMuted} style={{ marginRight: 4 }} />
                    <Text style={ss.metaText}>{ecTarget.phone}</Text>
                  </View>
                  <View style={ss.metaRow}>
                    <Text style={ss.metaLabel}>{ecTarget.reachVia}</Text>
                  </View>
                  {ecTarget.userMessage ? <Text style={[ss.metaText, { fontStyle: 'italic', marginTop: 6 }]}>"{ecTarget.userMessage}"</Text> : null}
                </View>
              </View>
            )}
            <Text style={ss.modalLabel}>{t('admin.verify_note')}</Text>
            <TextInput
              style={[ss.modalInput, { minHeight: 70 }]}
              placeholder={t('admin.placeholder_verify_note')}
              value={ecNote}
              onChangeText={setEcNote}
              multiline
              placeholderTextColor={D.textMuted}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={[ss.modalConfirmBtn, { flex: 1, backgroundColor: D.success }]}
                onPress={() => confirmVerifyEC('verify')}
                disabled={ecLoading}
              >
                {ecLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                  <>
                    <MaterialIcons name="verified" size={15} color="#fff" style={{ marginRight: 5 }} />
                    <Text style={ss.modalPrimaryBtnText}>{t('admin.approve_contact')}</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[ss.modalConfirmBtn, { flex: 1, backgroundColor: D.danger }]}
                onPress={() => confirmVerifyEC('reject')}
                disabled={ecLoading}
              >
                <MaterialIcons name="block" size={15} color="#fff" style={{ marginRight: 5 }} />
                <Text style={ss.modalPrimaryBtnText}>{t('admin.reject_contact')}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={ss.modalCancelBtn} onPress={() => setEcModal(false)}>
              <Text style={ss.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Crisis Call Modal ── */}
      <Modal visible={callModal} transparent animationType="slide">
        <View style={ss.modalOverlay}>
          <ScrollView contentContainerStyle={ss.modalSheet}>
            <View style={ss.modalHandle} />
            <View style={ss.modalHeaderRow}>
              <Text style={[ss.modalTitle, { color: D.danger }]}>{t('admin.modal_emergency_call')}</Text>
              <TouchableOpacity onPress={() => setCallModal(false)} style={ss.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={D.textSecondary} />
              </TouchableOpacity>
            </View>
            {callTarget && (
              <>
                <View style={[ss.modalInfoBox, { backgroundColor: D.danger + '14', borderColor: D.danger + '44', borderWidth: 1 }]}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: D.textPrimary }}>{callTarget.contactName}</Text>
                  <Text style={{ fontSize: 13, color: D.danger, fontWeight: '600', marginTop: 2 }}>{callTarget.relationship}</Text>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: D.textPrimary, marginTop: 6 }}>{callTarget.phone}</Text>
                  {callTarget.userMessage ? (
                    <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: D.borderColor, paddingTop: 8 }}>
                      <Text style={{ fontSize: 13, color: D.textSecondary, fontStyle: 'italic' }}>"{callTarget.userMessage}"</Text>
                    </View>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={[ss.modalConfirmBtn, { backgroundColor: D.dangerDeep, marginTop: 16 }]}
                  onPress={() => Linking.openURL(`tel:${callTarget.phone}`).catch(() => Alert.alert(t('admin.alert_error'), t('admin.dialer_error')))}
                >
                  <MaterialIcons name="phone" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={ss.modalPrimaryBtnText}>{t('admin.emergency_call')}</Text>
                </TouchableOpacity>

                <Text style={ss.modalLabel}>{t('admin.call_outcome')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {[
                    { key: 'reached', labelKey: 'admin.call_outcome_reached' },
                    { key: 'no_answer', labelKey: 'admin.call_outcome_no_answer' },
                    { key: 'voicemail', labelKey: 'admin.call_outcome_voicemail' },
                    { key: 'referred', labelKey: 'admin.call_outcome_referred' },
                  ].map(o => (
                    <TouchableOpacity
                      key={o.key}
                      style={[ss.segmentChip, callOutcome === o.key && { backgroundColor: D.danger, borderColor: D.danger }]}
                      onPress={() => setCallOutcome(o.key)}
                    >
                      <Text style={[ss.segmentChipText, callOutcome === o.key && { color: '#fff' }]}>
                        {t(o.labelKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={ss.modalLabel}>{t('admin.call_note')}</Text>
                <TextInput
                  style={[ss.modalInput, { minHeight: 70 }]}
                  placeholder={t('admin.placeholder_call_note')}
                  value={callNote}
                  onChangeText={setCallNote}
                  multiline
                  placeholderTextColor={D.textMuted}
                />
                <TouchableOpacity style={ss.modalConfirmBtn} onPress={logCall} disabled={callLoading}>
                  {callLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                    <>
                      <MaterialIcons name="save" size={15} color="#fff" style={{ marginRight: 5 }} />
                      <Text style={ss.modalPrimaryBtnText}>{t('admin.log_call')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={ss.modalCancelBtn} onPress={() => setCallModal(false)}>
              <Text style={ss.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Wellness Plan Builder Modal ── */}
      <Modal visible={planModal} transparent animationType="slide">
        <View style={ss.modalOverlay}>
          <ScrollView contentContainerStyle={ss.modalSheet}>
            <View style={ss.modalHandle} />
            <View style={ss.modalHeaderRow}>
              <Text style={[ss.modalTitle, { color: D.success }]}>{t('admin.modal_wellness_plan')}</Text>
              <TouchableOpacity onPress={() => setPlanModal(false)} style={ss.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={D.textSecondary} />
              </TouchableOpacity>
            </View>
            {planTarget && (
              <>
                <View style={ss.modalInfoBox}>
                  <Text style={ss.modalInfoText}><Text style={{ color: D.textPrimary, fontWeight: '700' }}>{planTarget.userName}</Text></Text>
                </View>
                <Text style={ss.modalLabel}>{t('admin.plan_focus')}</Text>
                <TextInput style={ss.modalInput} value={planFocus} onChangeText={setPlanFocus} placeholderTextColor={D.textMuted} />

                <Text style={ss.modalLabel}>{t('admin.action_note')}</Text>
                <TextInput style={[ss.modalInput, { minHeight: 70 }]} value={planNote} onChangeText={setPlanNote} multiline placeholderTextColor={D.textMuted} />

                <Text style={ss.modalLabel}>{t('admin.plan_tasks')}</Text>
                {planTasks.map((task, i) => (
                  <View key={i} style={ss.planTaskCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <View style={ss.dayChip}>
                        <Text style={ss.dayChipText}>{t('admin.day_chip', { n: task.dayNumber })}</Text>
                      </View>
                      <TouchableOpacity onPress={() => setPlanTasks(planTasks.filter((_, idx) => idx !== i))}>
                        <MaterialIcons name="delete-outline" size={18} color={D.danger} />
                      </TouchableOpacity>
                    </View>
                    <TextInput style={[ss.modalInput, { marginBottom: 8 }]} placeholder={t('admin.task_title')} value={task.title} onChangeText={(val) => updateTask(i, 'title', val)} placeholderTextColor={D.textMuted} />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput style={[ss.modalInput, { flex: 1, marginBottom: 8 }]} placeholder={t('admin.task_type')} value={task.type} onChangeText={(val) => updateTask(i, 'type', val)} placeholderTextColor={D.textMuted} />
                      <TextInput style={[ss.modalInput, { flex: 1, marginBottom: 8 }]} placeholder={t('admin.task_day')} keyboardType="numeric" value={String(task.dayNumber)} onChangeText={(val) => updateTask(i, 'dayNumber', parseInt(val || '1', 10))} placeholderTextColor={D.textMuted} />
                    </View>
                    <TextInput style={[ss.modalInput, { minHeight: 50 }]} placeholder={t('admin.task_description')} value={task.description} onChangeText={(val) => updateTask(i, 'description', val)} multiline placeholderTextColor={D.textMuted} />
                  </View>
                ))}
                <TouchableOpacity
                  style={ss.addTaskBtn}
                  onPress={() => {
                    const nextDay = planTasks.length > 0 ? planTasks[planTasks.length - 1].dayNumber + 1 : 1;
                    setPlanTasks([...planTasks, { dayNumber: nextDay, title: '', type: 'journal', description: '' }]);
                  }}
                >
                  <MaterialIcons name="add" size={16} color={D.primary} style={{ marginRight: 4 }} />
                  <Text style={ss.addTaskBtnText}>{t('admin.add_task')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[ss.modalConfirmBtn, { backgroundColor: D.success, marginTop: 20 }]} onPress={assignPlan} disabled={planLoading}>
                  {planLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                    <>
                      <MaterialIcons name="send" size={15} color="#fff" style={{ marginRight: 5 }} />
                      <Text style={ss.modalPrimaryBtnText}>{t('admin.send_plan')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={ss.modalCancelBtn} onPress={() => setPlanModal(false)}>
              <Text style={ss.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Delete Request Modal ── */}
      <Modal visible={delModal} transparent animationType="slide">
        <View style={ss.modalOverlay}>
          <ScrollView contentContainerStyle={ss.modalSheet}>
            <View style={ss.modalHandle} />
            <View style={ss.modalHeaderRow}>
              <Text style={ss.modalTitle}>{t('admin.modal_deletion_review')}</Text>
              <TouchableOpacity onPress={() => setDelModal(false)} style={ss.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={D.textSecondary} />
              </TouchableOpacity>
            </View>
            {delTarget && (
              <>
                <View style={[ss.modalInfoBox, { borderLeftColor: D.danger, borderLeftWidth: 3 }]}>
                  <Text style={ss.modalInfoText}><Text style={{ color: D.textPrimary, fontWeight: '700' }}>{delTarget.userName}</Text></Text>
                  <View style={ss.metaRow}>
                    <Text style={ss.metaValue}>{delTarget.reason}</Text>
                  </View>
                </View>
                <Text style={ss.modalLabel}>{t('admin.deletion_note')}</Text>
                <TextInput
                  style={[ss.modalInput, { minHeight: 70 }]}
                  placeholder={t('admin.placeholder_audit_note')}
                  value={delNote}
                  onChangeText={setDelNote}
                  multiline
                  placeholderTextColor={D.textMuted}
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[ss.modalConfirmBtn, { flex: 1, backgroundColor: D.danger }]}
                    onPress={() => reviewDeletion('approve')}
                    disabled={delLoading}
                  >
                    {delLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                      <>
                        <MaterialIcons name="delete-forever" size={15} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={ss.modalPrimaryBtnText}>{t('admin.approve_deletion')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[ss.modalConfirmBtn, { flex: 1, backgroundColor: D.surfaceElevated, borderWidth: 1, borderColor: D.borderColor }]}
                    onPress={() => reviewDeletion('reject')}
                    disabled={delLoading}
                  >
                    <MaterialIcons name="cancel" size={15} color={D.textPrimary} style={{ marginRight: 4 }} />
                    <Text style={[ss.modalPrimaryBtnText, { color: D.textPrimary }]}>{t('admin.reject_deletion')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            <TouchableOpacity style={ss.modalCancelBtn} onPress={() => setDelModal(false)}>
              <Text style={ss.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

// ─── Groups Tab ───────────────────────────────────────────────────────────────
const GroupsTab = () => {
  const { t } = useTranslation();
  const { D, ss } = useContext(ThemeContext);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', scheduledDate: '', meetingLink: '', maxParticipants: '10' });
  const [saving, setSaving] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [targetGroup, setTargetGroup] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const gRes = await api.get('/api/groups/admin', H);
      setGroups(gRes.data || []);
      const uRes = await api.get('/api/admin/users', H);
      setUsers(uRes.data || []);
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.load_groups_failed'));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.scheduledDate) {
      return Alert.alert(t('admin.alert_error'), t('admin.missing_fields'));
    }
    setSaving(true);
    try {
      await api.post('/api/groups', { ...form, maxParticipants: parseInt(form.maxParticipants, 10) || 10 }, H);
      setCreateModal(false);
      setForm({ title: '', description: '', scheduledDate: '', meetingLink: '', maxParticipants: '10' });
      load();
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.create_group_failed'));
    }
    setSaving(false);
  };

  const handleAssign = async () => {
    if (!selectedUser || !targetGroup) return;
    try {
      const id = targetGroup._id || targetGroup.id;
      await api.patch(`/api/groups/${id}/assign`, { userId: selectedUser.id }, H);
      Alert.alert(t('common.success'), t('admin.assign_user_success'));
      setAssignModal(false);
      load();
    } catch (e) {
      Alert.alert(t('admin.alert_error'), e.response?.data?.error || t('admin.assign_user_failed'));
    }
  };

  if (loading) return (
    <View style={ss.loadingContainer}>
      <ActivityIndicator color={D.primary} size="large" />
      <Text style={ss.loadingText}>{t('admin.loading_sessions')}</Text>
    </View>
  );

  const FORM_FIELDS = [
    { labelKey: 'admin.session_title', key: 'title' },
    { labelKey: 'admin.description', key: 'description', multiline: true },
    { labelKey: 'admin.scheduled_date', key: 'scheduledDate' },
    { labelKey: 'admin.meeting_link', key: 'meetingLink' },
    { labelKey: 'admin.max_participants', key: 'maxParticipants', numeric: true },
  ];

  return (
    <ScrollView contentContainerStyle={ss.tabScroll} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={ss.tabPageTitle}>{t('admin.group_sessions_title')}</Text>
        <TouchableOpacity style={ss.createBtn} onPress={() => setCreateModal(true)}>
          <MaterialIcons name="add" size={16} color="#fff" style={{ marginRight: 4 }} />
          <Text style={ss.createBtnText}>{t('admin.new_session')}</Text>
        </TouchableOpacity>
      </View>

      {groups.length === 0
        ? <EmptyState icon="group" message={t('admin.no_group_sessions')} />
        : groups.map(g => (
          <View key={g._id || g.id} style={[ss.card, { borderLeftColor: D.accentLight }]}>
            <Text style={ss.cardName}>{g.title}</Text>
            <Text style={[ss.cardMeta, { marginTop: 2, marginBottom: 10 }]}>{g.description}</Text>
            <View style={ss.cardDivider} />
            <View style={ss.metaRow}>
              <MaterialIcons name="event" size={13} color={D.textMuted} style={{ marginRight: 4 }} />
              <Text style={ss.metaText}>{new Date(g.scheduledDate).toLocaleString()}</Text>
            </View>
            <View style={ss.metaRow}>
              <MaterialIcons name="group" size={13} color={D.textMuted} style={{ marginRight: 4 }} />
              <Text style={ss.metaText}>{t('admin.participants_count', { current: g.participants?.length || 0, max: g.maxParticipants })}</Text>
            </View>
            <ActionButton
              label={t('admin.assign_user')}
              icon="person-add"
              color={D.accent}
              style={{ marginTop: 14 }}
              onPress={() => { setTargetGroup(g); setSelectedUser(null); setAssignModal(true); }}
            />
          </View>
        ))}

      {/* Create Modal */}
      <Modal visible={createModal} transparent animationType="slide">
        <View style={ss.modalOverlay}>
          <ScrollView contentContainerStyle={ss.modalSheet}>
            <View style={ss.modalHandle} />
            <View style={ss.modalHeaderRow}>
              <Text style={ss.modalTitle}>{t('admin.create_group_session')}</Text>
              <TouchableOpacity onPress={() => setCreateModal(false)} style={ss.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={D.textSecondary} />
              </TouchableOpacity>
            </View>
            {FORM_FIELDS.map(f => (
              <View key={f.key}>
                <Text style={ss.modalLabel}>{t(f.labelKey)}</Text>
                <TextInput
                  style={[ss.modalInput, f.multiline && { minHeight: 70 }]}
                  placeholder={t(f.labelKey)}
                  placeholderTextColor={D.textMuted}
                  keyboardType={f.numeric ? 'numeric' : 'default'}
                  multiline={f.multiline}
                  value={form[f.key]}
                  onChangeText={val => setForm({ ...form, [f.key]: val })}
                />
              </View>
            ))}
            <TouchableOpacity style={ss.modalConfirmBtn} onPress={handleCreate} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : (
                <>
                  <MaterialIcons name="add-circle" size={15} color="#fff" style={{ marginRight: 5 }} />
                  <Text style={ss.modalPrimaryBtnText}>{t('admin.create_group')}</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={ss.modalCancelBtn} onPress={() => setCreateModal(false)}>
              <Text style={ss.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Assign Modal */}
      <Modal visible={assignModal} transparent animationType="slide">
        <View style={ss.modalOverlay}>
          <ScrollView contentContainerStyle={ss.modalSheet}>
            <View style={ss.modalHandle} />
            <View style={ss.modalHeaderRow}>
              <Text style={ss.modalTitle}>{t('admin.assign_user_to_group')}</Text>
              <TouchableOpacity onPress={() => setAssignModal(false)} style={ss.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={D.textSecondary} />
              </TouchableOpacity>
            </View>
            {targetGroup && (
              <View style={ss.modalInfoBox}>
                <Text style={ss.modalInfoText}>{targetGroup.title}</Text>
              </View>
            )}
            <Text style={ss.modalLabel}>{t('admin.select_user')}</Text>
            <ScrollView style={{ maxHeight: 240, marginBottom: 16 }}>
              {users.map(u => (
                <TouchableOpacity
                  key={u.id}
                  style={[ss.userSelectItem, selectedUser?.id === u.id && ss.userSelectItemActive]}
                  onPress={() => setSelectedUser(u)}
                >
                  <View style={ss.userSelectAvatar}>
                    <Text style={ss.userSelectAvatarText}>{u.name?.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[ss.userSelectName, selectedUser?.id === u.id && { color: D.textPrimary }]}>{u.name}</Text>
                    <Text style={ss.userSelectEmail}>{u.email}</Text>
                  </View>
                  {selectedUser?.id === u.id && <MaterialIcons name="check-circle" size={18} color={D.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={ss.modalConfirmBtn} onPress={handleAssign} disabled={!selectedUser}>
              <Text style={ss.modalPrimaryBtnText}>{t('admin.confirm_assignment')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ss.modalCancelBtn} onPress={() => setAssignModal(false)}>
              <Text style={ss.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

// ─── Therapists Tab ──────────────────────────────────────────────────────────
const TherapistsTab = () => {
  const { t } = useTranslation();
  const { D, ss } = useContext(ThemeContext);
  const [therapists, setTherapists] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = add new
  const [form, setForm] = useState({ name: '', specialisation: '', timing: '', about: '' });
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [linkModal, setLinkModal] = useState(false);
  const [linkTarget, setLinkTarget] = useState(null);
  const [clinicians, setClinicians] = useState([]);
  const [selectedClinician, setSelectedClinician] = useState(null);
  const [linking, setLinking] = useState(false);

  const SPECIALISATIONS = [
    { key: 'Anxiety', labelKey: 'admin.spec_anxiety' },
    { key: 'Depression', labelKey: 'admin.spec_depression' },
    { key: 'Trauma', labelKey: 'admin.spec_trauma' },
    { key: 'Relationships', labelKey: 'admin.spec_relationships' },
    { key: 'Addiction', labelKey: 'admin.spec_addiction' },
    { key: 'Child Therapy', labelKey: 'admin.spec_child_therapy' },
    { key: 'Career', labelKey: 'admin.spec_career' },
    { key: 'General', labelKey: 'admin.spec_general' },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/therapists');
      setTherapists(res.data || []);
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.load_therapists_failed'));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ name: '', specialisation: '', timing: '', about: '' });
    setModal(true);
  };

  const openEdit = (t) => {
    setEditTarget(t);
    setForm({ name: t.name || '', specialisation: t.specialisation || '', timing: t.timing || '', about: t.about || '' });
    setModal(true);
  };

  const openLink = async (t) => {
    setLinkTarget(t);
    setSelectedClinician(t.userId ? { id: typeof t.userId === 'string' ? t.userId : t.userId._id } : null);
    setLinkModal(true);
    setLinking(true);
    try {
      const res = await api.get('/api/admin/users', H);
      setClinicians((res.data || []).filter(u => u.role === 'clinician'));
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.load_clinicians_failed'));
    }
    setLinking(false);
  };

  const confirmLink = async () => {
    setLinking(true);
    try {
      await api.post(`/api/admin/therapists/${linkTarget.id}/link-user`, { userId: selectedClinician?.id || null }, H);
      Alert.alert(t('common.success'), t('admin.link_updated'));
      setLinkModal(false);
      load();
    } catch (e) {
      Alert.alert(t('admin.alert_error'), e.response?.data?.error || t('admin.link_failed'));
    }
    setLinking(false);
  };

  const save = async () => {
    if (!form.name.trim() || !form.specialisation.trim()) {
      return Alert.alert(t('admin.alert_validation'), t('admin.name_spec_required'));
    }
    setSaving(true);
    try {
      if (editTarget) {
        await api.put(`/api/admin/therapists/${editTarget.id}`, form, H);
        Alert.alert(t('admin.alert_updated'), t('admin.therapist_updated', { name: form.name }));
      } else {
        await api.post('/api/admin/therapists', form, H);
        Alert.alert(t('admin.alert_added'), t('admin.therapist_added', { name: form.name }));
      }
      setModal(false);
      load();
    } catch (e) {
      Alert.alert(t('admin.alert_error'), e.response?.data?.error || t('admin.save_therapist_failed'));
    }
    setSaving(false);
  };

  const toggleActive = async (therapist) => {
    try {
      await api.put(`/api/admin/therapists/${therapist.id}`, { active: !therapist.active }, H);
      load();
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.update_status_failed'));
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/admin/therapists/${deleteTarget.id}`, H);
      Alert.alert(t('admin.alert_deleted'), t('admin.therapist_removed', { name: deleteTarget.name }));
      setDeleteModal(false);
      load();
    } catch (e) {
      Alert.alert(t('admin.alert_error'), e.response?.data?.error || t('admin.delete_therapist_failed'));
    }
  };

  if (loading) return (
    <View style={ss.loadingContainer}>
      <ActivityIndicator color={D.primary} size="large" />
      <Text style={ss.loadingText}>{t('admin.loading_therapists')}</Text>
    </View>
  );

  const STATS = [
    { filterKey: 'All Therapists', labelKey: 'admin.stat_all_therapists', value: therapists.length, icon: 'groups', color: D.primaryLight },
    { filterKey: 'Active', labelKey: 'admin.stat_active', value: therapists.filter(th => th.active !== false).length, icon: 'check-circle', color: D.success },
    { filterKey: 'Inactive', labelKey: 'admin.stat_inactive', value: therapists.filter(th => th.active === false).length, icon: 'block', color: D.dangerDeep },
  ];

  return (
    <ScrollView contentContainerStyle={ss.tabScroll} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={ss.tabPageTitle}>{t('admin.therapist_hub')}</Text>
        <TouchableOpacity style={ss.createBtn} onPress={openAdd}>
          <MaterialIcons name="person-add" size={15} color="#fff" style={{ marginRight: 4 }} />
          <Text style={ss.createBtnText}>{t('admin.add_therapist')}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Overview Stats Grid ── */}
      <View style={ss.overviewHeader}>
        <Text style={ss.overviewTitle}>{t('admin.overview')}</Text>
      </View>
      <View style={ss.statsGrid}>
        {STATS.map((s, i) => (
          <TouchableOpacity 
            key={i} 
            activeOpacity={0.7}
            onPress={() => setActiveFilter(activeFilter === s.filterKey || s.filterKey.includes('Total') || s.filterKey.includes('All') ? null : s.filterKey)}
            style={[
              ss.statTile, 
              { borderTopColor: s.color },
              activeFilter === s.filterKey && { backgroundColor: s.color + '22', transform: [{ scale: 1.02 }] }
            ]}
          >
            <View style={[ss.statIconWrap, { backgroundColor: s.color + '1A' }]}>
              <MaterialIcons name={s.icon} size={18} color={s.color} />
            </View>
            <Text style={ss.statValue}>{s.value}</Text>
            <Text style={ss.statLabel}>{t(s.labelKey)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={ss.workQueueHeader}>
        <View style={ss.workQueueLine} />
        <Text style={ss.workQueueLabel}>{t('admin.filtered_results')}</Text>
        <View style={ss.workQueueLine} />
      </View>

      {therapists.length === 0
        ? <EmptyState icon="person-off" message={t('admin.no_therapists')} />
        : therapists.filter(th => {
          if (!activeFilter || activeFilter === 'All Therapists') return true;
          if (activeFilter === 'Active') return th.active !== false;
          if (activeFilter === 'Inactive') return th.active === false;
          return true;
        }).map(th => (
          <View key={th.id || th._id} style={[ss.card, { borderLeftColor: th.active !== false ? D.success : D.textMuted }]}>
            <View style={ss.cardRow}>
              <View style={[ss.cardAvatarCircle, { backgroundColor: (th.active !== false ? D.success : D.textMuted) + '22' }]}>
                <MaterialIcons name="psychology" size={18} color={th.active !== false ? D.success : D.textMuted} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={ss.cardName}>{th.name}</Text>
                <Text style={ss.cardMeta}>{th.specialisation}</Text>
                {th.linkedUserEmail && (
                  <Text style={[ss.cardMeta, { color: D.accentLight, marginTop: 4 }]}>
                    <MaterialIcons name="link" size={11} color={D.accentLight} /> {t('admin.linked_email', { email: th.linkedUserEmail })}
                  </Text>
                )}
              </View>
              <PillBadge
                label={th.active !== false ? t('admin.status_active') : t('admin.status_inactive')}
                color={th.active !== false ? D.success : D.textMuted}
              />
            </View>
            {th.timing ? (
              <View style={[ss.metaRow, { marginTop: 10 }]}>
                <MaterialIcons name="schedule" size={13} color={D.textMuted} style={{ marginRight: 4 }} />
                <Text style={ss.metaText}>{th.timing}</Text>
              </View>
            ) : null}
            {th.about ? (
              <View style={ss.quoteBox}>
                <Text style={ss.quoteText}>{th.about}</Text>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <TouchableOpacity
                style={[ss.actionButton, { flex: 1, backgroundColor: D.surfaceElevated, borderWidth: 1, borderColor: D.borderColor }]}
                onPress={() => openEdit(th)} activeOpacity={0.8}
              >
                <MaterialIcons name="edit" size={14} color={D.textPrimary} style={{ marginRight: 5 }} />
                <Text style={[ss.actionButtonText, { color: D.textPrimary }]}>{t('admin.edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ss.actionButton, { flex: 1, backgroundColor: D.accent + '22', borderWidth: 1, borderColor: D.accent + '55' }]}
                onPress={() => openLink(th)} activeOpacity={0.8}
              >
                <MaterialIcons name="link" size={14} color={D.accent} style={{ marginRight: 5 }} />
                <Text style={[ss.actionButtonText, { color: D.accent }]}>{t('admin.link')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ss.actionButton, { flex: 1, backgroundColor: th.active !== false ? D.warning + '22' : D.success + '22', borderWidth: 1, borderColor: th.active !== false ? D.warning + '55' : D.success + '55' }]}
                onPress={() => toggleActive(th)} activeOpacity={0.8}
              >
                <MaterialIcons name={th.active !== false ? 'pause-circle' : 'play-circle'} size={14} color={th.active !== false ? D.warning : D.success} style={{ marginRight: 5 }} />
                <Text style={[ss.actionButtonText, { color: th.active !== false ? D.warning : D.success }]}>{th.active !== false ? t('admin.deactivate') : t('admin.activate')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ss.actionButton, { backgroundColor: D.danger + '22', borderWidth: 1, borderColor: D.danger + '55', paddingHorizontal: 12 }]}
                onPress={() => { setDeleteTarget(th); setDeleteModal(true); }} activeOpacity={0.8}
              >
                <MaterialIcons name="delete" size={16} color={D.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

      {/* Add/Edit Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={ss.modalOverlay}>
          <ScrollView contentContainerStyle={ss.modalSheet} keyboardShouldPersistTaps="handled">
            <View style={ss.modalHandle} />
            <View style={ss.modalHeaderRow}>
              <Text style={ss.modalTitle}>{editTarget ? t('admin.edit_therapist') : t('admin.add_edit_therapist')}</Text>
              <TouchableOpacity onPress={() => setModal(false)} style={ss.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={D.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={ss.modalLabel}>{t('admin.therapist_name')} *</Text>
            <TextInput style={ss.modalInput} value={form.name} onChangeText={val => setForm({ ...form, name: val })} placeholder={t('admin.placeholder_therapist_name')} placeholderTextColor={D.textMuted} />

            <Text style={ss.modalLabel}>{t('admin.specialisation')} *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {SPECIALISATIONS.map(s => (
                <TouchableOpacity
                  key={s.key}
                  style={[ss.segmentChip, { marginRight: 8 }, form.specialisation === s.key && { backgroundColor: D.primary, borderColor: D.primary }]}
                  onPress={() => setForm({ ...form, specialisation: s.key })}
                >
                  <Text style={[ss.segmentChipText, form.specialisation === s.key && { color: '#fff' }]}>{t(s.labelKey)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput style={ss.modalInput} value={form.specialisation} onChangeText={val => setForm({ ...form, specialisation: val })} placeholder={t('admin.placeholder_specialisation')} placeholderTextColor={D.textMuted} />

            <Text style={ss.modalLabel}>{t('admin.timing')}</Text>
            <TextInput style={ss.modalInput} value={form.timing} onChangeText={val => setForm({ ...form, timing: val })} placeholder={t('admin.placeholder_timing')} placeholderTextColor={D.textMuted} />

            <Text style={ss.modalLabel}>{t('admin.about')}</Text>
            <TextInput style={[ss.modalInput, { minHeight: 80 }]} value={form.about} onChangeText={val => setForm({ ...form, about: val })} placeholder={t('admin.placeholder_about')} placeholderTextColor={D.textMuted} multiline />

            <TouchableOpacity style={ss.modalConfirmBtn} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <MaterialIcons name={editTarget ? 'save' : 'person-add'} size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={ss.modalPrimaryBtnText}>{editTarget ? t('admin.save_changes') : t('admin.save_therapist')}</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={ss.modalCancelBtn} onPress={() => setModal(false)}>
              <Text style={ss.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Confirm */}
      <Modal visible={deleteModal} transparent animationType="fade">
        <View style={[ss.modalOverlay, { justifyContent: 'center', padding: 24 }]}>
          <View style={[ss.modalSheet, { borderRadius: 20 }]}>
            <MaterialIcons name="warning" size={32} color={D.danger} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[ss.modalTitle, { textAlign: 'center' }]}>{t('admin.delete_therapist_title')}</Text>
            <Text style={[ss.modalInfoText, { textAlign: 'center', marginTop: 8, marginBottom: 20 }]}>
              {t('admin.delete_therapist_msg', { name: deleteTarget?.name })}
            </Text>
            <TouchableOpacity style={[ss.modalConfirmBtn, { backgroundColor: D.danger }]} onPress={confirmDelete}>
              <Text style={ss.modalPrimaryBtnText}>{t('common.delete')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ss.modalCancelBtn} onPress={() => setDeleteModal(false)}>
              <Text style={ss.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Link Account Modal */}
      <Modal visible={linkModal} transparent animationType="slide">
        <View style={ss.modalOverlay}>
          <ScrollView contentContainerStyle={ss.modalSheet}>
            <View style={ss.modalHandle} />
            <View style={ss.modalHeaderRow}>
              <Text style={ss.modalTitle}>{t('admin.link_clinician')}</Text>
              <TouchableOpacity onPress={() => setLinkModal(false)} style={ss.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={D.textSecondary} />
              </TouchableOpacity>
            </View>

            {linkTarget && (
              <View style={ss.modalInfoBox}>
                <Text style={ss.modalInfoText}>{linkTarget.name}</Text>
              </View>
            )}

            <Text style={ss.modalLabel}>{t('admin.select_clinician')}</Text>
            {linking && clinicians.length === 0 ? <ActivityIndicator color={D.primary} /> : (
              <ScrollView style={{ maxHeight: 240, marginBottom: 16 }}>
                <TouchableOpacity
                  style={[ss.userSelectItem, selectedClinician === null && ss.userSelectItemActive]}
                  onPress={() => setSelectedClinician(null)}
                >
                  <Text style={[ss.userSelectName, selectedClinician === null && { color: D.textPrimary }]}>{t('admin.unlink_account')}</Text>
                  {selectedClinician === null && <MaterialIcons name="check-circle" size={18} color={D.primary} />}
                </TouchableOpacity>
                {clinicians.map(u => (
                  <TouchableOpacity
                    key={u.id}
                    style={[ss.userSelectItem, selectedClinician?.id === u.id && ss.userSelectItemActive]}
                    onPress={() => setSelectedClinician(u)}
                  >
                    <View style={ss.userSelectAvatar}>
                      <Text style={ss.userSelectAvatarText}>{u.name?.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[ss.userSelectName, selectedClinician?.id === u.id && { color: D.textPrimary }]}>{u.name}</Text>
                      <Text style={ss.userSelectEmail}>{u.email}</Text>
                    </View>
                    {selectedClinician?.id === u.id && <MaterialIcons name="check-circle" size={18} color={D.primary} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity style={ss.modalConfirmBtn} onPress={confirmLink} disabled={linking}>
              {linking ? <ActivityIndicator color="#fff" size="small" /> : (
                <Text style={ss.modalPrimaryBtnText}>{t('admin.confirm_link')}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={ss.modalCancelBtn} onPress={() => setLinkModal(false)}>
              <Text style={ss.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

// ─── Resource CMS Tab ─────────────────────────────────────────────────────────
const ResourcesTab = () => {
  const { t } = useTranslation();
  const { D, ss } = useContext(ThemeContext);
  const [resources, setResources] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'article', url: '', description: '' });
  const [saving, setSaving] = useState(false);

  const TYPES = ['article', 'video', 'exercise'];
  const TYPE_ICONS = { article: 'article', video: 'play-circle', exercise: 'fitness-center' };
  const TYPE_COLORS = { article: D.accent, video: D.danger, exercise: D.success };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/resources', H);
      setResources(res.data || []);
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.load_resources_failed'));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ title: '', type: 'article', url: '', description: '' });
    setModal(true);
  };

  const openEdit = (r) => {
    setEditTarget(r);
    setForm({ title: r.title, type: r.type, url: r.url, description: r.description || '' });
    setModal(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      return Alert.alert(t('admin.alert_validation'), t('admin.title_url_required'));
    }
    setSaving(true);
    try {
      if (editTarget) {
        await api.put(`/api/admin/resources/${editTarget.id}`, form, H);
        Alert.alert(t('admin.alert_updated'), t('admin.resource_updated'));
      } else {
        await api.post('/api/admin/resources', form, H);
        Alert.alert(t('admin.alert_added'), t('admin.resource_created'));
      }
      setModal(false);
      load();
    } catch (e) {
      Alert.alert(t('admin.alert_error'), e.response?.data?.error || t('admin.save_resource_failed'));
    }
    setSaving(false);
  };

  const toggleActive = async (r) => {
    try {
      await api.put(`/api/admin/resources/${r.id}`, { active: !r.active }, H);
      load();
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.toggle_resource_failed'));
    }
  };

  const deleteResource = (r) => {
    Alert.alert(t('admin.delete_resource_title'), t('admin.delete_resource_msg', { title: r.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/api/admin/resources/${r.id}`, H);
            load();
          } catch (e) {
            Alert.alert(t('admin.alert_error'), t('admin.delete_resource_failed'));
          }
        },
      },
    ]);
  };

  if (loading) return (
    <View style={ss.loadingContainer}>
      <ActivityIndicator color={D.primary} size="large" />
      <Text style={ss.loadingText}>{t('admin.loading_resources')}</Text>
    </View>
  );

  const STATS = [
    { filterKey: 'total_resources', labelKey: 'admin.stat_total_resources', value: resources.length, icon: 'library-books', color: D.primaryLight },
    { filterKey: 'articles', labelKey: 'admin.stat_articles', value: resources.filter(r => r.type === 'article').length, icon: 'article', color: D.accent },
    { filterKey: 'videos', labelKey: 'admin.stat_videos', value: resources.filter(r => r.type === 'video').length, icon: 'play-circle', color: D.danger },
    { filterKey: 'exercises', labelKey: 'admin.stat_exercises', value: resources.filter(r => r.type === 'exercise').length, icon: 'fitness-center', color: D.success },
  ];

  return (
    <ScrollView contentContainerStyle={ss.tabScroll} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={ss.tabPageTitle}>{t('admin.resources_cms')}</Text>
        <TouchableOpacity style={ss.createBtn} onPress={openAdd}>
          <MaterialIcons name="add" size={16} color="#fff" style={{ marginRight: 4 }} />
          <Text style={ss.createBtnText}>{t('admin.add_resource')}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Overview Stats Grid ── */}
      <View style={ss.overviewHeader}>
        <Text style={ss.overviewTitle}>{t('admin.overview')}</Text>
      </View>
      <View style={ss.statsGrid}>
        {STATS.map((s, i) => (
          <TouchableOpacity 
            key={i} 
            activeOpacity={0.7}
            onPress={() => setActiveFilter(activeFilter === s.filterKey ? null : s.filterKey)}
            style={[
              ss.statTile, 
              { borderTopColor: s.color },
              activeFilter === s.filterKey && { backgroundColor: s.color + '22', transform: [{ scale: 1.02 }] }
            ]}
          >
            <View style={[ss.statIconWrap, { backgroundColor: s.color + '1A' }]}>
              <MaterialIcons name={s.icon} size={18} color={s.color} />
            </View>
            <Text style={ss.statValue}>{s.value}</Text>
            <Text style={ss.statLabel}>{t(s.labelKey)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={ss.workQueueHeader}>
        <View style={ss.workQueueLine} />
        <Text style={ss.workQueueLabel}>{t('admin.filtered_results')}</Text>
        <View style={ss.workQueueLine} />
      </View>

      {/* Type filter legend */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        {TYPES.map(typeKey => (
          <View key={typeKey} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name={TYPE_ICONS[typeKey]} size={14} color={TYPE_COLORS[typeKey]} />
            <Text style={[ss.cardMeta, { marginLeft: 4, color: TYPE_COLORS[typeKey], textTransform: 'capitalize' }]}>{typeKey}</Text>
          </View>
        ))}
      </View>

      {resources.length === 0
        ? <EmptyState icon="library-books" message={t('admin.no_resources')} />
        : resources.filter(r => {
          if (!activeFilter || activeFilter === 'total_resources') return true;
          if (activeFilter === 'articles') return r.type === 'article';
          if (activeFilter === 'videos') return r.type === 'video';
          if (activeFilter === 'exercises') return r.type === 'exercise';
          return true;
        }).map(r => (
          <View key={r.id} style={[ss.card, { borderLeftColor: TYPE_COLORS[r.type], opacity: r.active === false ? 0.55 : 1 }]}>
            <View style={ss.cardRow}>
              <View style={[ss.cardAvatarCircle, { backgroundColor: TYPE_COLORS[r.type] + '22' }]}>
                <MaterialIcons name={TYPE_ICONS[r.type]} size={18} color={TYPE_COLORS[r.type]} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={ss.cardName} numberOfLines={2}>{r.title}</Text>
                <Text style={ss.cardMeta}>{r.type.toUpperCase()} · {r.active === false ? t('admin.resource_hidden') : t('admin.resource_visible')}</Text>
              </View>
            </View>
            {r.description ? (
              <View style={ss.quoteBox}>
                <Text style={ss.quoteText}>{r.description}</Text>
              </View>
            ) : null}
            <View style={[ss.metaRow, { marginTop: 10 }]}>
              <MaterialIcons name="link" size={13} color={D.textMuted} style={{ marginRight: 4 }} />
              <Text style={[ss.metaText, { color: D.accentLight }]} numberOfLines={1}>{r.url}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <TouchableOpacity
                style={[ss.actionButton, { flex: 1, backgroundColor: D.surfaceElevated, borderWidth: 1, borderColor: D.borderColor }]}
                onPress={() => openEdit(r)} activeOpacity={0.8}
              >
                <MaterialIcons name="edit" size={14} color={D.textPrimary} style={{ marginRight: 5 }} />
                <Text style={[ss.actionButtonText, { color: D.textPrimary }]}>{t('admin.edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ss.actionButton, { flex: 1, backgroundColor: r.active === false ? D.success + '22' : D.warning + '22', borderWidth: 1, borderColor: r.active === false ? D.success + '55' : D.warning + '55' }]}
                onPress={() => toggleActive(r)} activeOpacity={0.8}
              >
                <MaterialIcons name={r.active === false ? 'visibility' : 'visibility-off'} size={14} color={r.active === false ? D.success : D.warning} style={{ marginRight: 5 }} />
                <Text style={[ss.actionButtonText, { color: r.active === false ? D.success : D.warning }]}>{r.active === false ? t('admin.show_resource') : t('admin.hide_resource')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ss.actionButton, { backgroundColor: D.danger + '22', borderWidth: 1, borderColor: D.danger + '55' }]}
                onPress={() => deleteResource(r)} activeOpacity={0.8}
              >
                <MaterialIcons name="delete" size={16} color={D.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

      {/* Add / Edit Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={ss.modalOverlay}>
          <ScrollView contentContainerStyle={ss.modalSheet} keyboardShouldPersistTaps="handled">
            <View style={ss.modalHandle} />
            <View style={ss.modalHeaderRow}>
              <Text style={ss.modalTitle}>{editTarget ? t('admin.edit') : t('admin.add_resource')}</Text>
              <TouchableOpacity onPress={() => setModal(false)} style={ss.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={D.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={ss.modalLabel}>{t('admin.resource_title')} *</Text>
            <TextInput style={ss.modalInput} value={form.title} onChangeText={val => setForm({ ...form, title: val })} placeholder={t('admin.placeholder_resource_title')} placeholderTextColor={D.textMuted} />

            <Text style={ss.modalLabel}>{t('admin.resource_type')} *</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {TYPES.map(typeKey => (
                <TouchableOpacity
                  key={typeKey}
                  style={[ss.segmentChip, form.type === typeKey && { backgroundColor: TYPE_COLORS[typeKey], borderColor: TYPE_COLORS[typeKey] }]}
                  onPress={() => setForm({ ...form, type: typeKey })}
                >
                  <MaterialIcons name={TYPE_ICONS[typeKey]} size={14} color={form.type === typeKey ? '#fff' : TYPE_COLORS[typeKey]} style={{ marginRight: 4 }} />
                  <Text style={[ss.segmentChipText, form.type === typeKey && { color: '#fff' }]}>{typeKey.charAt(0).toUpperCase() + typeKey.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={ss.modalLabel}>{t('admin.resource_url')} *</Text>
            <TextInput style={ss.modalInput} value={form.url} onChangeText={val => setForm({ ...form, url: val })} placeholder={t('admin.placeholder_resource_url')} placeholderTextColor={D.textMuted} autoCapitalize="none" keyboardType="url" />

            <Text style={ss.modalLabel}>{t('admin.resource_description')}</Text>
            <TextInput style={[ss.modalInput, { minHeight: 70 }]} value={form.description} onChangeText={val => setForm({ ...form, description: val })} placeholder={t('admin.placeholder_resource_desc')} placeholderTextColor={D.textMuted} multiline />

            <TouchableOpacity style={ss.modalConfirmBtn} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <MaterialIcons name="save" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={ss.modalPrimaryBtnText}>{editTarget ? t('admin.save_resource') : t('admin.save_resource')}</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={ss.modalCancelBtn} onPress={() => setModal(false)}>
              <Text style={ss.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

// ─── Audit Trail Tab ──────────────────────────────────────────────────────────
const AuditTab = () => {
  const { t } = useTranslation();
  const { D, ss } = useContext(ThemeContext);
  const [logs, setLogs] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE = 25;

  const ACTION_META = {
    verify_risk_report:       { icon: 'rate-review',        color: D.warning,   labelKey: 'admin.audit_verify_risk_report' },
    assign_appointment:       { icon: 'event-available',    color: D.accent,    labelKey: 'admin.audit_assign_appointment' },
    verify_emergency_contact: { icon: 'verified-user',      color: D.success,   labelKey: 'admin.audit_verify_emergency_contact' },
    reject_emergency_contact: { icon: 'cancel',             color: D.danger,    labelKey: 'admin.audit_reject_emergency_contact' },
    assign_wellness_plan:     { icon: 'self-improvement',   color: D.primary,   labelKey: 'admin.audit_assign_wellness_plan' },
    add_therapist:            { icon: 'person-add',         color: D.accent,    labelKey: 'admin.audit_add_therapist' },
    update_therapist:         { icon: 'edit',               color: D.textMuted, labelKey: 'admin.audit_update_therapist' },
    delete_therapist:         { icon: 'person-remove',      color: D.danger,    labelKey: 'admin.audit_delete_therapist' },
    create_resource:          { icon: 'add-circle',         color: D.primary,   labelKey: 'admin.audit_create_resource' },
    update_resource:          { icon: 'edit',               color: D.textMuted, labelKey: 'admin.audit_update_resource' },
    delete_resource:          { icon: 'delete',             color: D.danger,    labelKey: 'admin.audit_delete_resource' },
    change_user_role:         { icon: 'manage-accounts',    color: D.accent,    labelKey: 'admin.audit_change_user_role' },
    suspend_user:             { icon: 'lock',               color: D.danger,    labelKey: 'admin.audit_suspend_user' },
    reinstate_user:           { icon: 'lock-open',          color: D.success,   labelKey: 'admin.audit_reinstate_user' },
    broadcast_notification:   { icon: 'campaign',           color: D.primary,   labelKey: 'admin.audit_broadcast' },
    export_audit_logs:        { icon: 'receipt-long',       color: D.warning,   labelKey: 'admin.audit_export_logs' },
    export_patients:          { icon: 'download',           color: D.warning,   labelKey: 'admin.audit_export_patients' },
  };

  const load = async (skip = 0, append = false) => {
    if (skip === 0) setLoading(true); else setLoadingMore(true);
    try {
      const res = await api.get('/api/admin/audit-logs', { ...H, params: { limit: PAGE, skip } });
      setTotal(res.data.total || 0);
      if (append) setLogs(prev => [...prev, ...(res.data.logs || [])]);
      else setLogs(res.data.logs || []);
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.load_audit_failed'));
    }
    if (skip === 0) setLoading(false); else setLoadingMore(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <View style={ss.loadingContainer}>
      <ActivityIndicator color={D.primary} size="large" />
      <Text style={ss.loadingText}>{t('admin.loading_audit')}</Text>
    </View>
  );

  const STATS = [
    { filterKey: 'all_logs', labelKey: 'admin.stat_all_logs', value: logs.length, icon: 'history', color: D.primaryLight },
    { filterKey: 'auth_events', labelKey: 'admin.stat_auth_events', value: logs.filter(l => ['login','register'].includes(l.actionType)).length, icon: 'login', color: D.accent },
    { filterKey: 'admin_actions', labelKey: 'admin.stat_admin_actions', value: logs.filter(l => ['create','delete','update'].includes(l.actionType) || l.performedByModel === 'Admin').length, icon: 'gavel', color: D.danger },
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="security" size={18} color={D.primary} style={{ marginRight: 8 }} />
          <Text style={ss.tabPageTitle}>{t('admin.audit_trail')}</Text>
        </View>
        <Text style={ss.cardMeta}>{total}</Text>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {/* ── Overview Stats Grid ── */}
        <View style={ss.overviewHeader}>
          <Text style={ss.overviewTitle}>{t('admin.overview')}</Text>
        </View>
        <View style={ss.statsGrid}>
          {STATS.map((s, i) => (
            <TouchableOpacity 
              key={i} 
              activeOpacity={0.7}
              onPress={() => setActiveFilter(activeFilter === s.filterKey ? null : s.filterKey)}
              style={[
                ss.statTile, 
                { borderTopColor: s.color },
                activeFilter === s.filterKey && { backgroundColor: s.color + '22', transform: [{ scale: 1.02 }] }
              ]}
            >
              <View style={[ss.statIconWrap, { backgroundColor: s.color + '1A' }]}>
                <MaterialIcons name={s.icon} size={18} color={s.color} />
              </View>
              <Text style={ss.statValue}>{s.value}</Text>
              <Text style={ss.statLabel}>{t(s.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={ss.workQueueHeader}>
          <View style={ss.workQueueLine} />
          <Text style={ss.workQueueLabel}>{t('admin.filtered_results')}</Text>
          <View style={ss.workQueueLine} />
        </View>
      </View>

      <FlatList
        data={logs.filter(l => {
          if (!activeFilter || activeFilter === 'all_logs') return true;
          if (activeFilter === 'auth_events') return ['login','register'].includes(l.actionType);
          if (activeFilter === 'admin_actions') return ['create','delete','update'].includes(l.actionType) || l.performedByModel === 'Admin';
          return true;
        })}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon="history" message={t('admin.no_audit')} />}
        onEndReached={() => { if (!loadingMore && logs.length < total) load(logs.length, true); }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={D.primary} style={{ marginVertical: 16 }} /> : null}
        renderItem={({ item, index }) => {
          const meta = ACTION_META[item.action] || { icon: 'info', color: D.textMuted, labelKey: null };
          const actionLabel = meta.labelKey ? t(meta.labelKey) : item.action.replace(/_/g, ' ');
          const isFirst = index === 0;
          return (
            <View style={ss.auditRow}>
              {/* Timeline spine */}
              <View style={ss.auditSpineCol}>
                {!isFirst && <View style={ss.auditSpineLineTop} />}
                <View style={[ss.auditDot, { backgroundColor: meta.color }]}>
                  <MaterialIcons name={meta.icon} size={12} color="#fff" />
                </View>
                <View style={ss.auditSpineLineBottom} />
              </View>
              {/* Content */}
              <View style={ss.auditContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={[ss.auditAction, { color: meta.color }]}>{actionLabel}</Text>
                  <Text style={ss.auditTime}>{new Date(item.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                {item.targetUserName && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                    <MaterialIcons name="person" size={12} color={D.textMuted} style={{ marginRight: 4 }} />
                    <Text style={ss.auditMeta}>{item.targetUserName} · {item.targetUserEmail}</Text>
                  </View>
                )}
                {item.metadata && Object.keys(item.metadata).length > 0 && (
                  <View style={ss.auditMetaBox}>
                    {Object.entries(item.metadata).filter(([k]) => !['reportId','contactId','planId','appointmentId','therapistId','resourceId'].includes(k)).map(([k, v]) => (
                      <Text key={k} style={ss.auditMetaText}>
                        <Text style={{ color: D.textSecondary }}>{k.replace(/([A-Z])/g, ' $1').toLowerCase()}: </Text>
                        {String(v)}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

// ─── Analytics Tab ────────────────────────────────────────────────────────────
const AnalyticsTab = () => {
  const { t } = useTranslation();
  const { D, ss } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ riskTrend: [], moodHeatmap: [], kpis: {} });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/admin/analytics', H);
        setData(res.data || { riskTrend: [], moodHeatmap: [], kpis: {} });
      } catch (e) {
        Alert.alert(t('admin.alert_error'), t('admin.load_analytics_failed'));
      }
      setLoading(false);
    };
    load();
  }, []);

  const exportCSV = async (type) => {
    setExporting(true);
    try {
      const res = await api.get(`/api/admin/export/${type}`, { ...H, responseType: 'text' });
      const { Share } = require('react-native');
      await Share.share({
        title: t('admin.export_share_title', { type }),
        message: typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2),
      });
    } catch (e) {
      Alert.alert(t('admin.alert_export_failed'), e.response?.data?.error || t('admin.export_failed'));
    }
    setExporting(false);
  };

  if (loading) return (
    <View style={ss.loadingContainer}>
      <ActivityIndicator color={D.primary} size="large" />
      <Text style={ss.loadingText}>{t('admin.loading_analytics')}</Text>
    </View>
  );

  const kpis = data.kpis || {};
  const KPI_CARDS = [
    { labelKey: 'admin.kpi_total_users',        value: kpis.totalUsers ?? '—',        icon: 'group',          color: D.accent },
    { labelKey: 'admin.kpi_active_therapists',  value: kpis.activeTherapists ?? '—',  icon: 'psychology',     color: D.primary },
    { labelKey: 'admin.kpi_escalated_reports',  value: kpis.escalatedReports ?? '—',  icon: 'crisis-alert',   color: D.danger },
    { labelKey: 'admin.kpi_pending_queue',      value: kpis.pendingAppointments ?? '—', icon: 'pending-actions', color: D.warning },
  ];

  const screenWidth = Dimensions.get('window').width - 32;
  const riskLabels = data.riskTrend.map(d => new Date(d._id.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })).slice(-10);
  const riskCounts = data.riskTrend.map(d => d.count).slice(-10);
  const heatmapValues = data.moodHeatmap.map(d => ({ date: d._id, count: d.avgRating }));

  const chartConfig = {
    backgroundColor: D.surface,
    backgroundGradientFrom: D.surface,
    backgroundGradientTo: D.surfaceElevated,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(108, 155, 74, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(136, 145, 171, ${opacity})`,
    propsForDots: { r: '4', strokeWidth: '2', stroke: D.primaryLight },
    propsForBackgroundLines: { stroke: D.surfaceBorder },
  };

  return (
    <ScrollView contentContainerStyle={ss.tabScroll} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={ss.tabPageTitle}>{t('admin.analytics_title')}</Text>
      </View>

      {/* ── KPI Cards ── */}
      <View style={ss.kpiGrid}>
        {KPI_CARDS.map((k, i) => (
          <View key={i} style={[ss.kpiCard, { borderTopColor: k.color }]}>
            <View style={[ss.kpiIconWrap, { backgroundColor: k.color + '1A' }]}>
              <MaterialIcons name={k.icon} size={18} color={k.color} />
            </View>
            <Text style={ss.kpiValue}>{k.value}</Text>
            <Text style={ss.kpiLabel}>{t(k.labelKey)}</Text>
          </View>
        ))}
      </View>

      {/* ── Export Buttons ── */}
      <View style={ss.exportRow}>
        <View style={{ flex: 1, marginRight: 6 }}>
          <TouchableOpacity
            style={[ss.exportBtn, { backgroundColor: D.surfaceElevated }]}
            onPress={() => exportCSV('patients')}
            disabled={exporting}
            activeOpacity={0.8}
          >
            <MaterialIcons name="download" size={15} color={D.accent} style={{ marginRight: 6 }} />
            <Text style={[ss.exportBtnText, { color: D.accent }]}>{t('admin.export_data')}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, marginLeft: 6 }}>
          <TouchableOpacity
            style={[ss.exportBtn, { backgroundColor: D.surfaceElevated }]}
            onPress={() => exportCSV('audit')}
            disabled={exporting}
            activeOpacity={0.8}
          >
            <MaterialIcons name="receipt-long" size={15} color={D.warning} style={{ marginRight: 6 }} />
            <Text style={[ss.exportBtnText, { color: D.warning }]}>{t('admin.export_data')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {exporting && <ActivityIndicator color={D.primary} style={{ marginBottom: 12 }} />}

      {/* Risk Trend */}
      <View style={ss.analyticsCard}>
        <View style={ss.analyticsCardHeader}>
          <MaterialIcons name="trending-up" size={18} color={D.danger} />
          <Text style={ss.analyticsCardTitle}>{t('admin.chart_risk_trend')}</Text>
          <Text style={ss.analyticsCardSub}>{t('admin.chart_last_30_days')}</Text>
        </View>
        {riskCounts.length > 0 ? (
          <LineChart
            data={{ labels: riskLabels.length ? riskLabels : [t('admin.chart_no_data')], datasets: [{ data: riskCounts.length ? riskCounts : [0] }] }}
            width={screenWidth - 32}
            height={200}
            fromZero
            chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(224, 90, 90, ${opacity})`, propsForDots: { r: '4', strokeWidth: '2', stroke: D.danger } }}
            bezier
            style={{ borderRadius: 10, marginTop: 10 }}
          />
        ) : (
          <EmptyState icon="bar-chart" message={t('admin.no_risk_data')} />
        )}
      </View>

      {/* Mood Heatmap */}
      <View style={ss.analyticsCard}>
        <View style={ss.analyticsCardHeader}>
          <MaterialIcons name="mood" size={18} color={D.success} />
          <Text style={ss.analyticsCardTitle}>{t('admin.chart_mood_heatmap')}</Text>
          <Text style={ss.analyticsCardSub}>{t('admin.chart_last_90_days')}</Text>
        </View>
        {heatmapValues.length > 0 ? (
          <ContributionGraph
            values={heatmapValues}
            endDate={new Date()}
            numDays={90}
            width={screenWidth - 32}
            height={200}
            chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(91, 173, 124, ${opacity})` }}
            style={{ borderRadius: 10, marginTop: 10 }}
          />
        ) : (
          <EmptyState icon="wb-sunny" message={t('admin.no_mood_data')} />
        )}
      </View>
    </ScrollView>
  );
};

// ─── Notes Tab ────────────────────────────────────────────────────────────────
const NotesTab = () => {
  const { t } = useTranslation();
  const { D, ss } = useContext(ThemeContext);
  const navigation = useNavigation();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users', H);
      setUsers(res.data || []);
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.load_notes_users_failed'));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <View style={ss.loadingContainer}>
      <ActivityIndicator color={D.primary} size="large" />
      <Text style={ss.loadingText}>{t('admin.loading_notes')}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={ss.searchBar}>
        <MaterialIcons name="search" size={18} color={D.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={ss.searchInput}
          placeholder={t('admin.search_patient')}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={D.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialIcons name="close" size={16} color={D.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={ss.noteUserRow}
            onPress={() => navigation.navigate('PatientHistory', { patientId: item.id, patientName: item.name })}
            activeOpacity={0.75}
          >
            <View style={ss.noteAvatar}>
              <Text style={ss.noteAvatarText}>{item.name?.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={ss.noteUserName}>{item.name}</Text>
              <Text style={ss.noteUserEmail}>{item.email}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={D.textMuted} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState icon="person-search" message={search ? t('admin.no_patients_search') : t('admin.no_patients_found')} />}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: D.borderColor }} />}
      />
    </View>
  );
};

// ─── Users Tab ────────────────────────────────────────────────────────────────
const UsersTab = () => {
  const { t } = useTranslation();
  const { D, ss } = useContext(ThemeContext);
  const [users, setUsers] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [selected, setSelected] = useState(null);
  const [issues, setIssues] = useState([]);
  const [moods, setMoods] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [roleModal, setRoleModal] = useState(false);
  const [roleTarget, setRoleTarget] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [fullProfile, setFullProfile] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const ROLES = [
    { key: 'user',        labelKey: 'admin.role_standard_user',    color: D.textMuted,  icon: 'person' },
    { key: 'clinician',   labelKey: 'admin.role_clinician',         color: D.accent,     icon: 'medical-services' },
    { key: 'super_admin', labelKey: 'admin.role_super_admin',       color: D.warning,    icon: 'admin-panel-settings' },
  ];

  const load = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/api/admin/users', H);
      setUsers(res.data || []);
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.load_users_failed'));
    }
    setLoadingUsers(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectUser = async (user) => {
    setSelected(user);
    setLoadingDetails(true);
    try {
      const [issuesRes, moodsRes] = await Promise.all([
        api.get('/api/admin/issues', { params: { userId: user.id }, ...H }),
        api.get('/api/admin/mood', { params: { userId: user.id }, ...H }),
      ]);
      setIssues(issuesRes.data || []);
      setMoods(moodsRes.data || []);
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.load_user_details_failed'));
    }
    setLoadingDetails(false);
  };

  const changeRole = async (userId, newRole) => {
    setRoleLoading(true);
    try {
      await api.patch(`/api/admin/users/${userId}/role`, { role: newRole }, H);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      if (selected?.id === userId) setSelected(prev => ({ ...prev, role: newRole }));
      setRoleModal(false);
    } catch (e) {
      Alert.alert(t('admin.alert_error'), e.response?.data?.error || t('admin.change_role_failed'));
    }
    setRoleLoading(false);
  };

  const fetchFullProfile = async () => {
    if (!selected) return;
    setProfileLoading(true);
    setProfileModalVisible(true);
    try {
      const res = await api.get(`/api/admin/users/${selected.id}/full-profile`, H);
      setFullProfile(res.data);
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.load_profile_failed'));
      setProfileModalVisible(false);
    }
    setProfileLoading(false);
  };

  const toggleSuspend = async (user) => {
    const newState = !user.suspended;
    Alert.alert(
      newState ? t('admin.suspend_account_title') : t('admin.reinstate_account_title'),
      newState
        ? t('admin.suspend_confirm', { name: user.name })
        : t('admin.reinstate_confirm', { name: user.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: newState ? t('admin.suspend') : t('admin.reinstate'),
          style: newState ? 'destructive' : 'default',
          onPress: async () => {
            setSuspendLoading(true);
            try {
              await api.patch(`/api/admin/users/${user.id}/suspend`, { suspended: newState }, H);
              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, suspended: newState } : u));
              if (selected?.id === user.id) setSelected(prev => ({ ...prev, suspended: newState }));
            } catch (e) {
              Alert.alert(t('admin.alert_error'), t('admin.update_status_failed'));
            }
            setSuspendLoading(false);
          },
        },
      ]
    );
  };

  const roleInfo = (role) => ROLES.find(r => r.key === role) || ROLES[0];

  if (loadingUsers) return (
    <View style={ss.loadingContainer}>
      <ActivityIndicator color={D.primary} size="large" />
      <Text style={ss.loadingText}>{t('admin.loading_users')}</Text>
    </View>
  );

  const STATS = [
    { filterKey: 'total_accounts', labelKey: 'admin.stat_total_accounts', value: users.length, icon: 'people', color: D.primaryLight },
    { filterKey: 'patients', labelKey: 'admin.stat_patients', value: users.filter(u => u.role === 'user').length, icon: 'person', color: D.accent },
    { filterKey: 'clinicians', labelKey: 'admin.stat_clinicians', value: users.filter(u => u.role === 'clinician').length, icon: 'medical-services', color: D.success },
    { filterKey: 'suspended', labelKey: 'admin.stat_suspended', value: users.filter(u => u.suspended).length, icon: 'gavel', color: D.dangerDeep },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      {/* ── Overview Stats Section ── */}
      <View style={{ padding: 20, backgroundColor: D.surface, borderBottomWidth: 1, borderBottomColor: D.borderColor }}>
        <View style={ss.overviewHeader}>
          <Text style={ss.overviewTitle}>{t('admin.overview')}</Text>
          <View style={ss.overviewBadge}>
            <View style={[ss.overviewBadgeDot, { backgroundColor: D.success }]} />
            <Text style={[ss.overviewBadgeText, { color: D.success }]}>{t('admin.live_system')}</Text>
          </View>
        </View>
        
        <View style={ss.statsGrid}>
          {STATS.map((s, i) => (
            <TouchableOpacity 
              key={i} 
              activeOpacity={0.7}
              onPress={() => setActiveFilter(activeFilter === s.filterKey ? null : s.filterKey)}
              style={[
                ss.statTile, 
                { borderTopColor: s.color },
                activeFilter === s.filterKey && { backgroundColor: s.color + '1A', transform: [{ scale: 1.02 }] }
              ]}
            >
              <View style={[ss.statIconWrap, { backgroundColor: s.color + '1A' }]}>
                <MaterialIcons name={s.icon} size={20} color={s.color} />
              </View>
              <View>
                <Text style={ss.statValue}>{s.value}</Text>
                <Text style={ss.statLabel}>{t(s.labelKey)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ backgroundColor: D.bg, flex: 1, padding: 20 }}>
        <View style={[ss.workQueueHeader, { marginTop: 0, marginBottom: 20 }]}>
          <View style={ss.workQueueLine} />
          <Text style={ss.workQueueLabel}>{t('admin.filtered_results')}</Text>
          <View style={ss.workQueueLine} />
        </View>

      <View style={ss.usersLayout}>
        {/* User List Panel (Full Width if No User Selected) */}
        {!selected ? (
          <View style={[ss.userListPanel, { width: '100%', borderRightWidth: 0 }]}>
            <Text style={ss.userListTitle}>{t('admin.users_count', { count: users.length })}</Text>
            <FlatList
              data={users.filter(u => {
                if (!activeFilter || activeFilter === 'total_accounts') return true;
                if (activeFilter === 'patients') return u.role === 'user';
                if (activeFilter === 'clinicians') return u.role === 'clinician';
                if (activeFilter === 'suspended') return !!u.suspended;
                return true;
              })}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[ss.userListItem, selected?.id === item.id && ss.userListItemActive]}
                  onPress={() => selectUser(item)}
                  activeOpacity={0.8}
                >
                  <View style={ss.userListAvatar}>
                    <Text style={ss.userListAvatarText}>{item.name?.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[ss.userListName, selected?.id === item.id && { color: D.textPrimary }]}>{item.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      {item.suspended && (
                        <View style={[ss.miniTag, { backgroundColor: D.danger + '22', borderColor: D.danger + '55', marginRight: 4 }]}>
                          <Text style={[ss.miniTagText, { color: D.danger }]}>{t('admin.status_suspended_badge')}</Text>
                        </View>
                      )}
                      <View style={[ss.miniTag, { backgroundColor: roleInfo(item.role).color + '22', borderColor: roleInfo(item.role).color + '44' }]}>
                        <Text style={[ss.miniTagText, { color: roleInfo(item.role).color }]}>{item.role || 'user'}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: D.borderColor }} />}
            />
          </View>
        ) : (
          /* Detail Panel (Full Width when User Selected) */
          <View style={[ss.detailPanel, { flex: 1 }]}>
            <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 30 }}>
              {/* Back Button */}
              <TouchableOpacity onPress={() => setSelected(null)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <MaterialIcons name="arrow-back" size={18} color={D.textSecondary} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: D.textSecondary }}>{t('admin.back_to_users')}</Text>
              </TouchableOpacity>

              {/* User Header */}
              <View style={ss.userDetailHeader}>
                <View style={ss.userDetailAvatar}>
                  <Text style={ss.userDetailAvatarText}>{selected.name?.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={ss.detailName}>{selected.name}</Text>
                  <Text style={ss.detailEmail}>{selected.email}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    <View style={[ss.miniTag, { backgroundColor: roleInfo(selected.role).color + '22', borderColor: roleInfo(selected.role).color + '55' }]}>
                      <MaterialIcons name={roleInfo(selected.role).icon} size={10} color={roleInfo(selected.role).color} style={{ marginRight: 3 }} />
                      <Text style={[ss.miniTagText, { color: roleInfo(selected.role).color }]}>{t(roleInfo(selected.role).labelKey)}</Text>
                    </View>
                    {selected.suspended && (
                      <View style={[ss.miniTag, { backgroundColor: D.danger + '22', borderColor: D.danger + '55' }]}>
                        <Text style={[ss.miniTagText, { color: D.danger }]}>{t('admin.status_suspended_badge')}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                <TouchableOpacity
                  style={[ss.actionButton, { flex: 1, backgroundColor: D.surfaceElevated, borderWidth: 1, borderColor: D.borderColor }]}
                  onPress={() => { setRoleTarget(selected); setRoleModal(true); }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="manage-accounts" size={14} color={D.accent} style={{ marginRight: 5 }} />
                  <Text style={[ss.actionButtonText, { color: D.accent }]}>{t('admin.change_role')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[ss.actionButton, { flex: 1, backgroundColor: selected.suspended ? D.success + '22' : D.danger + '22', borderWidth: 1, borderColor: selected.suspended ? D.success + '55' : D.danger + '55' }]}
                  onPress={() => toggleSuspend(selected)}
                  disabled={suspendLoading}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name={selected.suspended ? 'lock-open' : 'lock'} size={14} color={selected.suspended ? D.success : D.danger} style={{ marginRight: 5 }} />
                  <Text style={[ss.actionButtonText, { color: selected.suspended ? D.success : D.danger }]}>
                    {selected.suspended ? t('admin.reinstate') : t('admin.suspend')}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[ss.actionButton, { backgroundColor: '#3498DB', marginBottom: 14 }]}
                onPress={fetchFullProfile}
                activeOpacity={0.8}
              >
                <MaterialIcons name="analytics" size={14} color="#fff" style={{ marginRight: 5 }} />
                <Text style={[ss.actionButtonText, { color: '#fff' }]}>{t('admin.view_full_profile')}</Text>
              </TouchableOpacity>

              <Text style={ss.detailSectionLabel}>{t('admin.ai_assessments')}</Text>
              {loadingDetails ? <ActivityIndicator color={D.primary} style={{ marginTop: 8 }} /> :
                issues.length === 0 ? <Text style={ss.emptyStateText}>{t('admin.no_assessments')}</Text> :
                  issues.map(r => (
                    <View key={r.id} style={[ss.detailCard, r.riskLevel && { borderLeftWidth: 3, borderLeftColor: RISK_COLORS[r.riskLevel] }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={ss.detailCardDate}>{new Date(r.createdAt).toLocaleString()}</Text>
                        {r.adminVerified && <Text style={{ fontSize: 10, color: D.success, fontWeight: '700' }}>{t('admin.status_verified_badge')}</Text>}
                      </View>
                      <Text style={ss.detailCardMeta}>{t('admin.category_risk_line', { category: r.category, risk: r.riskLevel })}</Text>
                      {r.adminNote ? <Text style={[ss.detailCardMeta, { color: D.primary, marginTop: 4 }]}>{t('admin.note_prefix', { note: r.adminNote })}</Text> : null}
                    </View>
                  ))
              }

              <Text style={ss.detailSectionLabel}>{t('admin.mood_history')}</Text>
              {loadingDetails ? <ActivityIndicator color={D.primary} style={{ marginTop: 8 }} /> :
                moods.length === 0 ? <Text style={ss.emptyStateText}>{t('admin.no_mood_entries')}</Text> :
                  moods.map(m => (
                    <View key={m.id} style={ss.detailCard}>
                      <Text style={ss.detailCardDate}>{new Date(m.date).toLocaleDateString()}</Text>
                      <Text style={ss.detailCardMeta}>{t('admin.rating_label', { rating: m.rating })}</Text>
                      {m.note ? <Text style={ss.detailCardMeta}>{t('admin.note_prefix', { note: m.note })}</Text> : null}
                    </View>
                  ))
              }
            </ScrollView>
          </View>
        )}
      </View>

    {/* Role Change Modal */}
    <Modal visible={roleModal} transparent animationType="slide">
      <View style={ss.modalOverlay}>
        <View style={ss.modalSheet}>
            <View style={ss.modalHandle} />
            <View style={ss.modalHeaderRow}>
              <Text style={ss.modalTitle}>{t('admin.change_role')}</Text>
              <TouchableOpacity onPress={() => setRoleModal(false)} style={ss.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={D.textSecondary} />
              </TouchableOpacity>
            </View>
            {roleTarget && (
              <View style={ss.modalInfoBox}>
                <Text style={ss.modalInfoText}>{t('admin.changing_role_for', { name: roleTarget.name })}</Text>
              </View>
            )}
            {ROLES.map(r => (
              <TouchableOpacity
                key={r.key}
                style={[ss.roleOption, roleTarget?.role === r.key && { borderColor: r.color, backgroundColor: r.color + '11' }]}
                onPress={() => changeRole(roleTarget.id, r.key)}
                disabled={roleLoading}
                activeOpacity={0.8}
              >
                <View style={[ss.roleIconWrap, { backgroundColor: r.color + '22' }]}>
                  <MaterialIcons name={r.icon} size={18} color={r.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[ss.roleName, { color: roleTarget?.role === r.key ? r.color : D.textPrimary }]}>{t(r.labelKey)}</Text>
                </View>
                {roleTarget?.role === r.key && <MaterialIcons name="check-circle" size={18} color={r.color} />}
              </TouchableOpacity>
            ))}
            {roleLoading && <ActivityIndicator color={D.primary} style={{ marginTop: 12 }} />}
            <TouchableOpacity style={ss.modalCancelBtn} onPress={() => setRoleModal(false)}>
              <Text style={ss.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full Profile Modal */}
      <Modal visible={profileModalVisible} transparent animationType="slide">
        <View style={ss.modalOverlay}>
          <View style={ss.modalSheet}>
            <View style={ss.modalHeaderRow}>
              <Text style={ss.modalTitle}>{t('admin.clinical_profile')}</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)} style={ss.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={D.textSecondary} />
              </TouchableOpacity>
            </View>
            {profileLoading ? (
              <ActivityIndicator color={D.primary} size="large" style={{ marginVertical: 20 }} />
            ) : fullProfile ? (
              <ScrollView style={{ maxHeight: '85%' }} showsVerticalScrollIndicator={false}>
                <View style={{ marginBottom: 25 }}>
                  <Text style={ss.detailSectionLabel}>{t('admin.ai_assessments')}</Text>
                  {fullProfile.fusions?.length === 0 && <Text style={ss.emptyStateText}>{t('admin.no_ai_assessments')}</Text>}
                  {fullProfile.fusions?.map(f => (
                    <View key={f.id} style={ss.detailCard}>
                      <Text style={[ss.detailCardDate, { color: D.textPrimary, fontWeight: 'bold' }]}>{t('admin.risk_level_label', { level: f.riskLevel })}</Text>
                      <Text style={ss.detailCardMeta}>{t('admin.score_label', { score: (f.riskScore * 100).toFixed(0) })}</Text>
                      <Text style={ss.detailCardMeta}>{t('admin.markers_label', { markers: (f.aiMarkers || []).join(', ') })}</Text>
                      <Text style={[ss.detailCardDate, { marginTop: 4 }]}>{new Date(f.createdAt).toLocaleDateString()}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ marginBottom: 25 }}>
                  <Text style={ss.detailSectionLabel}>{t('admin.risk_reports_section')}</Text>
                  {fullProfile.issues?.length === 0 && <Text style={ss.emptyStateText}>{t('admin.no_risk_reports')}</Text>}
                  {fullProfile.issues?.map(i => (
                    <View key={i.id} style={ss.detailCard}>
                      <Text style={[ss.detailCardDate, { color: D.textPrimary, fontWeight: 'bold' }]}>{t('admin.severity_risk_line', { category: i.category, severity: i.severity })}</Text>
                      <Text style={ss.detailCardMeta}>{t('admin.risk_colon', { level: i.riskLevel })}</Text>
                      <Text style={[ss.detailCardDate, { marginTop: 4 }]}>{new Date(i.createdAt).toLocaleDateString()}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ marginBottom: 25 }}>
                  <Text style={ss.detailSectionLabel}>{t('admin.recent_moods')}</Text>
                  {fullProfile.moods?.length === 0 && <Text style={ss.emptyStateText}>{t('admin.no_moods_logged')}</Text>}
                  {fullProfile.moods?.slice(0, 5).map(m => (
                    <View key={m.id} style={ss.detailCard}>
                      <Text style={[ss.detailCardDate, { color: D.textPrimary, fontWeight: 'bold' }]}>{t('admin.rating_of_10', { rating: m.rating })}</Text>
                      {m.note ? <Text style={ss.detailCardMeta}>{t('admin.note_prefix', { note: m.note })}</Text> : null}
                      <Text style={[ss.detailCardDate, { marginTop: 4 }]}>{new Date(m.date).toLocaleDateString()}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  </View>
  );
};

// ─── Notifications Hub Tab ────────────────────────────────────────────────────
const NotificationsTab = () => {
  const { t } = useTranslation();
  const { D, ss } = useContext(ThemeContext);
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [composeModal, setComposeModal] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', audience: 'all_users' });
  const [sending, setSending] = useState(false);

  const AUDIENCES = [
    { key: 'all_users',  labelKey: 'admin.audience_all',  icon: 'group',     color: D.accent },
    { key: 'therapists', labelKey: 'admin.audience_therapists', icon: 'psychology', color: D.primary },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/notifications', { ...H, params: { limit: 50 } });
      setNotifications(res.data.notifications || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      Alert.alert(t('admin.alert_error'), t('admin.load_notifications_failed'));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const sendBroadcast = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      return Alert.alert(t('admin.alert_validation'), t('admin.broadcast_required'));
    }
    setSending(true);
    try {
      const res = await api.post('/api/admin/notifications/broadcast', form, H);
      Alert.alert(
        t('common.success'),
        t('admin.broadcast_sent', { count: res.data.recipientCount })
      );
      setComposeModal(false);
      setForm({ title: '', body: '', audience: 'all_users' });
      load();
    } catch (e) {
      Alert.alert(t('admin.alert_error'), e.response?.data?.error || t('admin.broadcast_failed'));
    }
    setSending(false);
  };

  if (loading) return (
    <View style={ss.loadingContainer}>
      <ActivityIndicator color={D.primary} size="large" />
      <Text style={ss.loadingText}>{t('admin.loading_broadcasts')}</Text>
    </View>
  );

  const audienceInfo = (key) => AUDIENCES.find(a => a.key === key) || AUDIENCES[0];

  const STATS = [
    { filterKey: 'total_broadcasts', labelKey: 'admin.stat_total_broadcasts', value: notifications.filter(n => n.active !== false).length, icon: 'campaign', color: D.primaryLight },
    { filterKey: 'all_users', labelKey: 'admin.stat_to_all_users', value: notifications.filter(n => n.audience === 'all_users').length, icon: 'people', color: D.accent },
    { filterKey: 'therapists', labelKey: 'admin.stat_to_therapists', value: notifications.filter(n => n.audience === 'therapists').length, icon: 'medical-services', color: D.success },
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="campaign" size={20} color={D.primary} style={{ marginRight: 8 }} />
          <Text style={ss.tabPageTitle}>{t('admin.broadcasts_title')}</Text>
        </View>
        <TouchableOpacity style={ss.createBtn} onPress={() => setComposeModal(true)} activeOpacity={0.8}>
          <MaterialIcons name="send" size={14} color="#fff" style={{ marginRight: 4 }} />
          <Text style={ss.createBtnText}>{t('admin.new_broadcast')}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {/* ── Overview Stats Grid ── */}
        <View style={ss.overviewHeader}>
          <Text style={ss.overviewTitle}>{t('admin.overview')}</Text>
        </View>
        <View style={ss.statsGrid}>
          {STATS.map((s, i) => (
            <TouchableOpacity 
              key={i} 
              activeOpacity={0.7}
              onPress={() => setActiveFilter(activeFilter === s.filterKey ? null : s.filterKey)}
              style={[
                ss.statTile, 
                { borderTopColor: s.color },
                activeFilter === s.filterKey && { backgroundColor: s.color + '22', transform: [{ scale: 1.02 }] }
              ]}
            >
              <View style={[ss.statIconWrap, { backgroundColor: s.color + '1A' }]}>
                <MaterialIcons name={s.icon} size={18} color={s.color} />
              </View>
              <Text style={ss.statValue}>{s.value}</Text>
              <Text style={ss.statLabel}>{t(s.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={ss.workQueueHeader}>
          <View style={ss.workQueueLine} />
          <Text style={ss.workQueueLabel}>{t('admin.filtered_results')}</Text>
          <View style={ss.workQueueLine} />
        </View>
      </View>

      <Text style={[ss.cardMeta, { paddingHorizontal: 16, marginBottom: 8 }]}>
        {total === 1 ? t('admin.broadcasts_sent_one', { count: total }) : t('admin.broadcasts_sent_other', { count: total })}
      </Text>
      
      <FlatList
        data={notifications.filter(n => {
          if (!activeFilter || activeFilter === 'total_broadcasts') return true;
          if (activeFilter === 'all_users') return n.audience === 'all_users';
          if (activeFilter === 'therapists') return n.audience === 'therapists';
          return true;
        })}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="notifications-none" message={t('admin.no_broadcasts')} />
        }
        renderItem={({ item }) => {
          const aud = audienceInfo(item.audience);
          return (
            <View style={[ss.notifCard, { borderLeftColor: aud.color }]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={ss.notifTitle}>{item.title}</Text>
                  <Text style={ss.notifBody}>{item.body}</Text>
                </View>
                <View style={[ss.miniTag, { backgroundColor: aud.color + '22', borderColor: aud.color + '44', marginLeft: 8, alignSelf: 'flex-start' }]}>
                  <MaterialIcons name={aud.icon} size={10} color={aud.color} style={{ marginRight: 3 }} />
                  <Text style={[ss.miniTagText, { color: aud.color }]}>{t(aud.labelKey)}</Text>
                </View>
              </View>
              <View style={[ss.cardDivider, { marginVertical: 10 }]} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="people" size={13} color={D.textMuted} style={{ marginRight: 4 }} />
                  <Text style={ss.cardMeta}>{t('admin.recipients_count', { count: item.recipientCount })}</Text>
                </View>
                <Text style={ss.cardMeta}>{new Date(item.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </View>
          );
        }}
      />

      {/* Compose Modal */}
      <Modal visible={composeModal} transparent animationType="slide">
        <View style={ss.modalOverlay}>
          <ScrollView contentContainerStyle={ss.modalSheet} keyboardShouldPersistTaps="handled">
            <View style={ss.modalHandle} />
            <View style={ss.modalHeaderRow}>
              <Text style={ss.modalTitle}>{t('admin.compose_broadcast')}</Text>
              <TouchableOpacity onPress={() => setComposeModal(false)} style={ss.modalCloseBtn}>
                <MaterialIcons name="close" size={20} color={D.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={ss.modalLabel}>{t('admin.audience')}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              {AUDIENCES.map(a => (
                <TouchableOpacity
                  key={a.key}
                  style={[ss.segmentChip, { flex: 1, justifyContent: 'center', flexDirection: 'row', alignItems: 'center' }, form.audience === a.key && { backgroundColor: a.color, borderColor: a.color }]}
                  onPress={() => setForm({ ...form, audience: a.key })}
                >
                  <MaterialIcons name={a.icon} size={14} color={form.audience === a.key ? '#fff' : a.color} style={{ marginRight: 5 }} />
                  <Text style={[ss.segmentChipText, form.audience === a.key && { color: '#fff' }]}>{t(a.labelKey)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={ss.modalLabel}>{t('admin.broadcast_title')} *</Text>
            <TextInput
              style={ss.modalInput}
              value={form.title}
              onChangeText={val => setForm({ ...form, title: val })}
              placeholder={t('admin.placeholder_broadcast_title')}
              placeholderTextColor={D.textMuted}
            />

            <Text style={ss.modalLabel}>{t('admin.broadcast_body')} *</Text>
            <TextInput
              style={[ss.modalInput, { minHeight: 100 }]}
              value={form.body}
              onChangeText={val => setForm({ ...form, body: val })}
              placeholder={t('admin.placeholder_broadcast_body')}
              placeholderTextColor={D.textMuted}
              multiline
            />

            <TouchableOpacity style={ss.modalConfirmBtn} onPress={sendBroadcast} disabled={sending}>
              {sending ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <MaterialIcons name="send" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={ss.modalPrimaryBtnText}>{t('admin.send_broadcast')}</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={ss.modalCancelBtn} onPress={() => setComposeModal(false)}>
              <Text style={ss.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
const AdminDashboardScreen = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('pending');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const D = isDarkMode ? DARK_THEME : LIGHT_THEME;
  const ss = useMemo(() => getStyles(D), [D]);

  // ── Profile Edit state ──
  const [profileModal, setProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('Admin');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirm, setProfileConfirm] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileShowPw, setProfileShowPw] = useState(false);


  const saveProfile = async () => {
    if (profilePassword && profilePassword !== profileConfirm) {
      return Alert.alert(t('admin.alert_mismatch'), t('admin.password_mismatch'));
    }
    setProfileSaving(true);
    try {
      const body = { name: profileName.trim(), email: profileEmail.trim(), profilePic: profilePic.trim() };
      if (profilePassword) body.password = profilePassword;
      await api.patch('/api/admin/profile', body, H);
      Alert.alert(t('admin.alert_saved'), t('admin.profile_saved'));
      setProfileModal(false);
      setProfilePassword('');
      setProfileConfirm('');
    } catch (e) {
      Alert.alert(t('admin.alert_error'), e.response?.data?.error || t('admin.profile_update_failed'));
    }
    setProfileSaving(false);
  };

  const [feed, setFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let interval;
    const loadFeed = async () => {
      setLoadingFeed(true);
      setError('');
      try {
        const res = await api.get('/api/admin/activity_feed', H);
        setFeed(res.data || []);
      } catch (e) {
        setError(e.response?.data?.error || e.message || t('admin.feed_load_failed'));
      }
      setLoadingFeed(false);
    };
    if (activeTab === 'feed') {
      loadFeed();
      interval = setInterval(loadFeed, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);



  const TABS = [
    { id: 'pending',       labelKey: 'admin.tab_actions',       icon: 'notifications-active' },
    { id: 'analytics',     labelKey: 'admin.tab_analytics',     icon: 'bar-chart' },
    { id: 'feed',          labelKey: 'admin.tab_live_feed',     icon: 'stream' },
    { id: 'users',         labelKey: 'admin.tab_users',         icon: 'group' },
    { id: 'notes',         labelKey: 'admin.tab_notes',         icon: 'description' },
    { id: 'groups',        labelKey: 'admin.tab_groups',        icon: 'people' },
    { id: 'therapists',    labelKey: 'admin.tab_therapists',    icon: 'psychology' },
    { id: 'resources',     labelKey: 'admin.tab_resources',     icon: 'library-books' },
    { id: 'audit',         labelKey: 'admin.tab_audit',         icon: 'security' },
    { id: 'notifications', labelKey: 'admin.tab_broadcasts',  icon: 'campaign' },
  ];

  return (
    <ThemeContext.Provider value={{ D, ss }}>
      <View style={ss.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={D.surface} />

      {/* Header */}
      <View style={ss.header}>
        <View style={ss.headerTop}>
          <View>
            <Text style={ss.headerTitle}>{t('admin.dashboard_title')}</Text>
            <Text style={ss.headerSub}>{t('admin.dashboard_subtitle')}</Text>
          </View>
          <View style={ss.headerActions}>
            <TouchableOpacity
              style={ss.headerIconBtn}
              onPress={() => setIsDarkMode(!isDarkMode)}
              activeOpacity={0.7}
            >
              <MaterialIcons name={isDarkMode ? 'wb-sunny' : 'brightness-2'} size={19} color={D.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={ss.headerIconBtn}
              onPress={() => setProfileModal(true)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="manage-accounts" size={19} color={D.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={ss.headerIconBtn} onPress={() => dispatch(logout())} activeOpacity={0.7}>
              <MaterialIcons name="logout" size={18} color={D.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>


        {/* Profile Edit Modal */}
        <Modal visible={profileModal} transparent animationType="slide">
          <View style={ss.modalOverlay}>
            <ScrollView contentContainerStyle={ss.modalSheet} keyboardShouldPersistTaps="handled">
              <View style={ss.modalHandle} />
              <View style={ss.modalHeaderRow}>
                <Text style={ss.modalTitle}>{t('admin.edit_profile')}</Text>
                <TouchableOpacity onPress={() => setProfileModal(false)} style={ss.modalCloseBtn}>
                  <MaterialIcons name="close" size={20} color={D.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Avatar preview */}
              <View style={ss.profileAvatarRow}>
                <View style={ss.profileAvatar}>
                  {profilePic ? (
                    <Image source={{ uri: profilePic }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                  ) : (
                    <Text style={ss.profileAvatarText}>{profileName?.charAt(0)?.toUpperCase() || 'A'}</Text>
                  )}
                </View>
                <View style={{ marginLeft: 14 }}>
                  <Text style={ss.profileAvatarName}>{profileName || 'Admin'}</Text>
                  <Text style={ss.profileAvatarRole}>{t('admin.administrator')}</Text>
                </View>
              </View>

              <Text style={ss.modalLabel}>{t('admin.profile_photo_url')}</Text>
              <TextInput
                style={ss.modalInput}
                value={profilePic}
                onChangeText={setProfilePic}
                placeholder={t('admin.placeholder_photo_url')}
                placeholderTextColor={D.textMuted}
                autoCapitalize="none"
              />

              <Text style={ss.modalLabel}>{t('admin.display_name')}</Text>
              <TextInput
                style={ss.modalInput}
                value={profileName}
                onChangeText={setProfileName}
                placeholder={t('admin.placeholder_display_name')}
                placeholderTextColor={D.textMuted}
              />


              <Text style={ss.modalLabel}>{t('admin.email_label')}</Text>
              <TextInput
                style={ss.modalInput}
                value={profileEmail}
                onChangeText={setProfileEmail}
                placeholder={t('admin.placeholder_admin_email')}
                placeholderTextColor={D.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={ss.sectionDivider}>
                <View style={ss.sectionDividerLine} />
                <Text style={ss.sectionDividerText}>{t('admin.change_password')}</Text>
                <View style={ss.sectionDividerLine} />
              </View>

              <Text style={ss.modalLabel}>{t('admin.new_password')}</Text>
              <View style={ss.passwordRow}>
                <TextInput
                  style={[ss.modalInput, { flex: 1 }]}
                  value={profilePassword}
                  onChangeText={setProfilePassword}
                  placeholder={t('admin.placeholder_keep_password')}
                  placeholderTextColor={D.textMuted}
                  secureTextEntry={!profileShowPw}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={ss.eyeBtn}
                  onPress={() => setProfileShowPw(v => !v)}
                >
                  <MaterialIcons
                    name={profileShowPw ? 'visibility-off' : 'visibility'}
                    size={18}
                    color={D.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <Text style={ss.modalLabel}>{t('admin.confirm_password')}</Text>
              <TextInput
                style={ss.modalInput}
                value={profileConfirm}
                onChangeText={setProfileConfirm}
                placeholder={t('admin.placeholder_confirm_password')}
                placeholderTextColor={D.textMuted}
                secureTextEntry={!profileShowPw}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[ss.modalConfirmBtn, { marginTop: 24 }]}
                onPress={saveProfile}
                disabled={profileSaving}
              >
                {profileSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="save" size={16} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={ss.modalPrimaryBtnText}>{t('admin.save_changes')}</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={ss.modalCancelBtn} onPress={() => setProfileModal(false)}>
                <Text style={ss.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>

        {/* Tab Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ss.tabBar} contentContainerStyle={{ paddingRight: 12 }}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[ss.tab, activeTab === tab.id && ss.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
            >
              <MaterialIcons name={tab.icon} size={14} color={activeTab === tab.id ? D.textPrimary : D.textMuted} style={{ marginRight: 5 }} />
              <Text style={[ss.tabText, activeTab === tab.id && ss.tabTextActive]}>{t(tab.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {error ? (
        <View style={ss.errorBanner}>
          <MaterialIcons name="error-outline" size={14} color={D.danger} style={{ marginRight: 6 }} />
          <Text style={ss.errorText}>{error}</Text>
        </View>
      ) : null}

      {activeTab === 'pending' && <PendingTab />}
      {activeTab === 'analytics' && <AnalyticsTab />}
      {activeTab === 'groups' && <GroupsTab />}
      {activeTab === 'notes' && <NotesTab />}
      {activeTab === 'therapists' && <TherapistsTab />}
      {activeTab === 'resources' && <ResourcesTab />}
      {activeTab === 'audit' && <AuditTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'notifications' && <NotificationsTab />}

      {activeTab === 'feed' && (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
            <View style={[ss.liveIndicator, loadingFeed && { opacity: 0.5 }]} />
            <Text style={ss.tabPageTitle}>{t('admin.live_activity_stream')}</Text>
          </View>
          {loadingFeed && feed.length === 0 ? (
            <View style={ss.loadingContainer}>
              <ActivityIndicator color={D.primary} size="large" />
              <Text style={ss.loadingText}>{t('admin.connecting_feed')}</Text>
            </View>
          ) : (
            <FlatList
              data={feed}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
              renderItem={({ item }) => (
                <View style={ss.feedRow}>
                  <View style={ss.feedDot} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <Text style={ss.feedUser}>{item.userName}</Text>
                      <Text style={ss.feedTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
                    </View>
                    <Text style={ss.feedAction}>{item.action.replace(/_/g, ' ')}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={<EmptyState icon="stream" message={t('admin.no_live_activity')} />}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: D.borderColor }} />}
            />
          )}
        </View>
      )}
      </View>
    </ThemeContext.Provider>
  );
};

export default AdminDashboardScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const getStyles = (D) => StyleSheet.create({
  container: { flex: 1, backgroundColor: D.bg },

  // Header
  header: { backgroundColor: D.surface, paddingTop: 44, borderBottomWidth: 1, borderBottomColor: D.borderColor },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingBottom: 14 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: D.textPrimary, letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: D.textMuted, marginTop: 2, fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase' },
  logoutBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surfaceElevated, borderWidth: 1, borderColor: D.borderColor, alignItems: 'center', justifyContent: 'center' },

  // Tab Bar
  tabBar: { borderBottomWidth: 0 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, marginRight: 2, borderBottomWidth: 2, borderBottomColor: 'transparent', marginLeft: 4 },
  tabActive: { borderBottomColor: D.primary },
  tabText: { fontSize: 13, color: D.textMuted, fontWeight: '600' },
  tabTextActive: { color: D.textPrimary },

  // General
  tabScroll: { padding: 16, paddingBottom: 60 },
  tabPageTitle: { fontSize: 20, fontWeight: '700', color: D.textPrimary, letterSpacing: -0.3 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { fontSize: 13, color: D.textMuted, marginTop: 10 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: D.danger + '18', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: D.danger + '33' },
  errorText: { color: D.danger, fontSize: 12, flex: 1 },

  // Banners
  slaBanner: { backgroundColor: D.danger + '18', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: D.danger + '44', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slaBannerLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  slaBannerTitle: { fontSize: 13, fontWeight: '800', color: D.textPrimary, letterSpacing: 0.3 },
  slaBannerSub: { fontSize: 11, color: D.textSecondary, marginTop: 2 },
  slaBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: D.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: D.danger + '55', marginLeft: 8 },
  slaBtnText: { fontSize: 11, fontWeight: '700', color: D.danger, marginLeft: 4 },
  attentionBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: D.primary + '18', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: D.primary + '33' },
  attentionText: { fontSize: 13, fontWeight: '600', color: D.textPrimary, marginLeft: 8 },

  // Section Headers
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 6 },
  sectionHeaderText: { fontWeight: '700', color: D.textSecondary, marginLeft: 6, flex: 1, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 11 },
  sectionBadge: { backgroundColor: D.surfaceElevated, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: D.borderColor },
  sectionBadgeText: { fontSize: 11, fontWeight: '700', color: D.textSecondary },

  // Overview Stats
  overviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  overviewTitle: { fontSize: 16, fontWeight: '800', color: D.textPrimary },
  overviewBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: D.success + '22', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: D.success + '55' },
  overviewBadgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  overviewBadgeText: { fontSize: 11, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  statTile: { width: '48%', backgroundColor: D.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: D.borderColor, borderTopWidth: 4, minHeight: 110, justifyContent: 'space-between' },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: D.textPrimary, marginTop: 8 },
  statLabel: { fontSize: 11, color: D.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  // Work Queue
  workQueueHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  workQueueLine: { flex: 1, height: 1, backgroundColor: D.borderColor },
  workQueueLabel: { marginHorizontal: 12, fontSize: 12, fontWeight: '700', color: D.textMuted, textTransform: 'uppercase', letterSpacing: 1 },

  // Cards
  card: { backgroundColor: D.surface, borderRadius: D.cardRadius, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: D.primary, borderWidth: 1, borderColor: D.borderColor },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardAvatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: D.primary + '22', alignItems: 'center', justifyContent: 'center' },
  cardAvatarText: { fontSize: 17, fontWeight: '800', color: D.primaryLight },
  cardName: { fontSize: 14, fontWeight: '700', color: D.textPrimary },
  cardMeta: { fontSize: 11, color: D.textMuted, marginTop: 1 },
  cardDivider: { height: 1, backgroundColor: D.borderColor, marginVertical: 12 },

  // Metadata rows
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  metaLabel: { fontSize: 11, fontWeight: '600', color: D.textMuted, marginRight: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 12, fontWeight: '600', color: D.textSecondary, flex: 1 },
  metaText: { fontSize: 12, color: D.textSecondary, flex: 1 },

  // Tags
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tag: { backgroundColor: D.surfaceElevated, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: D.borderColor },
  tagText: { fontSize: 11, color: D.textSecondary },

  // Quote box
  quoteBox: { backgroundColor: D.surfaceElevated, borderRadius: 10, padding: 10, marginTop: 10, borderLeftWidth: 2, borderLeftColor: D.borderColor, flexDirection: 'row' },
  quoteText: { fontSize: 12, color: D.textMuted, fontStyle: 'italic', flex: 1, marginLeft: 4 },

  // Pills
  pillBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  pillBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Risk dot
  riskDot: { width: 10, height: 10, borderRadius: 5 },

  // Escalated badge
  escalatedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: D.danger + '15', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10, borderWidth: 1, borderColor: D.danger + '33' },
  escalatedBadgeText: { fontSize: 11, fontWeight: '700', color: D.danger, marginLeft: 5 },

  // Safety alert
  safetyAlert: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  safetyAlertText: { fontSize: 12, color: D.danger, fontWeight: '600', marginLeft: 4 },

  // Action Button
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  actionButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: D.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 44, borderTopWidth: 1, borderTopColor: D.surfaceBorder },
  modalHandle: { width: 36, height: 4, backgroundColor: D.borderColor, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: D.textPrimary, letterSpacing: -0.3 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: D.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: D.borderColor },
  modalInfoBox: { backgroundColor: D.surfaceElevated, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: D.borderColor },
  modalInfoText: { fontSize: 13, color: D.textSecondary },
  modalLabel: { fontSize: 12, fontWeight: '700', color: D.textMuted, marginTop: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  modalInput: { backgroundColor: D.surfaceElevated, borderWidth: 1, borderColor: D.borderColor, borderRadius: 12, padding: 14, fontSize: 14, color: D.textPrimary, textAlignVertical: 'top' },
  modalPrimaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: D.primary, borderRadius: 12, paddingVertical: 13, marginTop: 10 },
  modalPrimaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalConfirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: D.accent, borderRadius: 12, paddingVertical: 13, marginTop: 12 },
  modalCancelBtn: { alignItems: 'center', paddingVertical: 14 },
  modalCancelText: { color: D.textMuted, fontSize: 14, fontWeight: '600' },

  // Segment chips (for action selections)
  segmentChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: D.surfaceElevated, borderRadius: 20, borderWidth: 1, borderColor: D.borderColor },
  segmentChipText: { fontSize: 13, fontWeight: '600', color: D.textSecondary },

  // Therapist chips
  therapistChip: { backgroundColor: D.surfaceElevated, borderRadius: 12, padding: 12, marginRight: 8, minWidth: 110, borderWidth: 1, borderColor: D.borderColor },
  therapistChipActive: { backgroundColor: D.accent, borderColor: D.accent },
  therapistChipName: { fontSize: 13, fontWeight: '700', color: D.textPrimary },
  therapistChipSpec: { fontSize: 11, color: D.textMuted, marginTop: 2 },

  // Slots
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 4 },
  slotChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: D.surfaceElevated, borderRadius: 8, borderWidth: 1, borderColor: D.borderColor },
  slotChipActive: { backgroundColor: D.primary, borderColor: D.primary },
  slotChipText: { fontSize: 13, color: D.textSecondary, fontWeight: '600' },
  noSlotsText: { fontSize: 12, color: D.danger, marginTop: 8 },

  // Resource Items
  resourceItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: D.surfaceElevated, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: D.borderColor },
  resourceType: { fontSize: 9, fontWeight: '800', color: D.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  resourceTitle: { fontSize: 13, color: D.textSecondary, fontWeight: '500' },

  // Plan tasks
  planTaskCard: { backgroundColor: D.surfaceElevated, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: D.borderColor },
  dayChip: { backgroundColor: D.primary + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: D.primary + '44' },
  dayChipText: { fontSize: 12, fontWeight: '700', color: D.primaryLight },
  addTaskBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: D.surfaceElevated, borderRadius: 10, paddingVertical: 12, borderWidth: 1, borderColor: D.primary + '44', borderStyle: 'dashed', marginBottom: 8 },
  addTaskBtnText: { fontSize: 13, color: D.primaryLight, fontWeight: '700' },

  // Groups tab
  createBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: D.accent, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  createBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // User select (in groups modal)
  userSelectItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 6, backgroundColor: D.surfaceElevated, borderWidth: 1, borderColor: D.borderColor },
  userSelectItemActive: { borderColor: D.primary, backgroundColor: D.primary + '14' },
  userSelectAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: D.primary + '22', alignItems: 'center', justifyContent: 'center' },
  userSelectAvatarText: { fontSize: 15, fontWeight: '800', color: D.primaryLight },
  userSelectName: { fontSize: 13, fontWeight: '600', color: D.textSecondary },
  userSelectEmail: { fontSize: 11, color: D.textMuted },

  // Analytics
  analyticsCard: { backgroundColor: D.surface, borderRadius: D.cardRadius, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: D.borderColor },
  analyticsCardHeader: { flexDirection: 'row', alignItems: 'center' },
  analyticsCardTitle: { fontSize: 15, fontWeight: '700', color: D.textPrimary, marginLeft: 8, flex: 1 },
  analyticsCardSub: { fontSize: 11, color: D.textMuted },

  // Empty states
  emptyState: { alignItems: 'center', padding: 32 },
  emptyStateText: { fontSize: 13, color: D.textMuted, marginTop: 10, textAlign: 'center' },

  // Feed
  feedRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  feedDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: D.primary, marginTop: 5, marginRight: 12 },
  feedUser: { fontSize: 13, fontWeight: '700', color: D.textPrimary },
  feedTime: { fontSize: 11, color: D.textMuted },
  feedAction: { fontSize: 12, color: D.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  liveIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: D.success, marginRight: 8 },

  // Users tab layout
  usersLayout: { flex: 1, flexDirection: 'row' },
  userListPanel: { width: '42%', backgroundColor: D.surface, borderRightWidth: 1, borderRightColor: D.borderColor },
  userListTitle: { fontSize: 13, fontWeight: '700', color: D.textMuted, padding: 12, textTransform: 'uppercase', letterSpacing: 0.8, borderBottomWidth: 1, borderBottomColor: D.borderColor },
  userListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  userListItemActive: { backgroundColor: D.primary + '14' },
  userListAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: D.primary + '22', alignItems: 'center', justifyContent: 'center' },
  userListAvatarText: { fontSize: 14, fontWeight: '800', color: D.primaryLight },
  userListName: { fontSize: 13, fontWeight: '600', color: D.textSecondary },
  userListEmail: { fontSize: 10, color: D.textMuted, marginTop: 1 },
  detailPanel: { flex: 1, backgroundColor: D.bg },
  detailName: { fontSize: 18, fontWeight: '800', color: D.textPrimary, marginBottom: 2 },
  detailEmail: { fontSize: 12, color: D.textMuted, marginBottom: 16 },
  detailSectionLabel: { fontSize: 11, fontWeight: '700', color: D.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 12, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: D.borderColor, paddingBottom: 6 },
  detailCard: { backgroundColor: D.surface, borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: D.borderColor },
  detailCardDate: { fontSize: 11, fontWeight: '600', color: D.textSecondary, marginBottom: 4 },
  detailCardMeta: { fontSize: 12, color: D.textMuted },

  // Notes tab
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: D.surface, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: D.borderColor },
  searchInput: { flex: 1, fontSize: 14, color: D.textPrimary, padding: 0 },
  noteUserRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: D.bg },
  noteAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: D.primary + '22', alignItems: 'center', justifyContent: 'center' },
  noteAvatarText: { fontSize: 18, fontWeight: '800', color: D.primaryLight },
  noteUserName: { fontSize: 14, fontWeight: '700', color: D.textPrimary },
  noteUserEmail: { fontSize: 12, color: D.textMuted, marginTop: 2 },

  // Profile modal extras
  profileAvatarRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: D.surfaceElevated, borderRadius: 14, padding: 14, marginBottom: 4, borderWidth: 1, borderColor: D.borderColor },
  profileAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: D.primary + '33', alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { fontSize: 22, fontWeight: '800', color: D.primaryLight },
  profileAvatarName: { fontSize: 15, fontWeight: '700', color: D.textPrimary },
  profileAvatarRole: { fontSize: 12, color: D.textMuted, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surfaceElevated, borderWidth: 1, borderColor: D.borderColor, alignItems: 'center', justifyContent: 'center' },
  sectionDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  sectionDividerLine: { flex: 1, height: 1, backgroundColor: D.borderColor },
  sectionDividerText: { marginHorizontal: 12, fontSize: 11, fontWeight: '700', color: D.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: D.surfaceElevated, borderWidth: 1, borderColor: D.borderColor, alignItems: 'center', justifyContent: 'center' },

  // Audit Trail
  auditRow: { flexDirection: 'row', paddingVertical: 8 },
  auditSpineCol: { width: 32, alignItems: 'center' },
  auditSpineLineTop: { width: 2, flex: 1, backgroundColor: D.borderColor, marginBottom: 2 },
  auditSpineLineBottom: { width: 2, flex: 1, backgroundColor: D.borderColor, marginTop: 2 },
  auditDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  auditContent: { flex: 1, marginLeft: 12, backgroundColor: D.surface, borderRadius: 12, padding: 12, marginBottom: 4, borderWidth: 1, borderColor: D.borderColor },
  auditAction: { fontSize: 13, fontWeight: '700' },
  auditTime: { fontSize: 11, color: D.textMuted },
  auditMeta: { fontSize: 11, color: D.textMuted },
  auditMetaBox: { backgroundColor: D.surfaceElevated, borderRadius: 8, padding: 8, marginTop: 6 },
  auditMetaText: { fontSize: 11, color: D.textMuted, lineHeight: 18 },

  // ── Phase 3: Analytics KPI grid ───────────────────────────────────────────
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  kpiCard: { width: '47%', backgroundColor: D.surface, borderRadius: D.cardRadius, padding: 14, borderWidth: 1, borderColor: D.borderColor, borderTopWidth: 3 },
  kpiIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  kpiValue: { fontSize: 26, fontWeight: '800', color: D.textPrimary, marginBottom: 2 },
  kpiLabel: { fontSize: 11, color: D.textMuted, fontWeight: '600' },

  // ── Phase 3: Export buttons ────────────────────────────────────────────────
  exportRow: { flexDirection: 'row', marginBottom: 16 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: D.borderColor },
  exportBtnText: { fontSize: 12, fontWeight: '700' },

  // ── Phase 3: Mini tags (role/status badges) ────────────────────────────────
  miniTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  miniTagText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },

  // ── Phase 3: User detail header ────────────────────────────────────────────
  userDetailHeader: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: D.surface, borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: D.borderColor },
  userDetailAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: D.primary + '33', alignItems: 'center', justifyContent: 'center' },
  userDetailAvatarText: { fontSize: 20, fontWeight: '800', color: D.primaryLight },

  // ── Phase 3: Role option items ─────────────────────────────────────────────
  roleOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: D.surfaceElevated, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: D.borderColor },
  roleIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  roleName: { fontSize: 14, fontWeight: '700' },

  // ── Phase 3: Notification cards ────────────────────────────────────────────
  notifCard: { backgroundColor: D.surface, borderRadius: D.cardRadius, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderWidth: 1, borderColor: D.borderColor },
  notifTitle: { fontSize: 15, fontWeight: '700', color: D.textPrimary, marginBottom: 4 },
  notifBody: { fontSize: 13, color: D.textSecondary, lineHeight: 19 },
});

const getSs = () => getStyles(DARK_THEME);
const ss = new Proxy({}, {
  get(target, prop) {
    return getSs()[prop];
  }
});

