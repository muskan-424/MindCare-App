/**
 * Web admin dashboard strings — merge web.* into all 16 languages.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import translations from '../src/localization/translations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../src/localization/translations.js');
const LANGS = ['en', 'hi', 'pa', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'es', 'fr', 'de', 'pt', 'ar', 'zh'];

const WEB = {
  header_title: 'MindCare Admin',
  header_sub: 'Platform oversight & clinical review',
  theme_dark: 'Dark',
  theme_light: 'Light',
  admin_token: 'Admin token:',
  token_placeholder: 'Paste ADMIN_TOKEN…',
  save_load: 'Save & Load',
  tab_pending: 'Pending review',
  tab_appointments: 'Appointments',
  overview_hint: 'Use Pending review for risk verification, emergency contacts, and deletion requests. Open Appointments to assign therapists.',
  save_token_analytics: 'Save admin token to load analytics.',
  save_token_appointments: 'Save admin token to manage appointments.',
  users_sidebar: 'Users ({count})',
  select_user_hint: 'Select a user to view assessments, risk reports, and mood history.',
  loading: 'Loading…',
  full_clinical_profile: 'Full clinical profile',
  ai_intake_assessments: 'AI Intake Assessments',
  no_ai_intake: 'No completed AI intake assessments yet.',
  col_date: 'Date',
  col_risk: 'Risk',
  col_score: 'Score',
  col_emotions: 'Emotions',
  col_category: 'Category',
  col_status: 'Status',
  col_rating: 'Rating',
  col_note: 'Note',
  no_risk_reports: 'No risk reports yet.',
  ai_intake_label: 'AI Intake',
  status_pending: 'Pending',
  status_verified: 'Verified · {action}',
  verify_btn: 'Verify',
  failed_load_dashboard: 'Failed to load dashboard',
  failed_load_user: 'Failed to load user data',
  failed_load_profile: 'Failed to load profile',
  stat_total_users: 'Total users',
  stat_assessments: 'Assessments',
  stat_critical_today: 'Critical today',
  stat_high_risk_week: 'High risk (7d)',
  stat_avg_mood_week: 'Avg mood (7d)',
  stat_pending_review: 'Pending review',
  broadcast_title_label: 'Title',
  broadcast_audience: 'Audience',
  broadcast_body: 'Message',
  broadcast_all_users: 'All users',
  broadcast_therapists: 'Therapists only',
  broadcast_title_ph: 'MindCare update',
  broadcast_body_ph: 'Your wellness tip or announcement…',
  broadcast_sending: 'Sending…',
  broadcast_send: 'Send broadcast',
  broadcast_required: 'Title and message are required.',
  broadcast_sent: 'Sent to {count} recipients.',
  analytics_total_users: 'Total users',
  analytics_escalated: 'Escalated reports',
  analytics_active_therapists: 'Active therapists',
  analytics_pending_appts: 'Pending appts',
  analytics_risk_trend: 'Risk trend (14d)',
  analytics_mood_heatmap: 'Mood heatmap',
  analytics_loading: 'Loading analytics…',
  appt_filter: 'Filter by status',
  appt_awaiting: 'Awaiting admin',
  appt_pending: 'Pending',
  appt_confirmed: 'Confirmed',
  appt_refresh: 'Refresh',
  appt_none: 'No appointments found.',
  appt_assign: 'Assign therapist',
  appt_requested: 'requested {speciality}',
  appt_pref: '{speciality} · Pref: {dates} · {time}',
  appt_general: 'General',
  appt_any_time: 'any time',
  pending_risk_title: 'Escalated risk reports',
  pending_risk_empty: 'No unverified high/critical reports.',
  pending_appt_title: 'Appointment requests',
  pending_appt_empty: 'No appointments awaiting admin.',
  pending_ec_title: 'Emergency contacts',
  pending_ec_empty: 'No emergency contacts pending.',
  pending_del_title: 'Deletion requests',
  pending_del_empty: 'No pending deletion requests.',
  pending_view_user: 'View user',
  pending_assign: 'Assign',
  pending_verify: 'Verify',
  pending_reject: 'Reject',
  pending_approve_wipe: 'Approve wipe',
  pending_user_fallback: 'User',
  pending_requested_therapy: 'requested therapy',
  modal_verify_ec: 'Verify emergency contact',
  modal_reject_ec: 'Reject emergency contact',
  modal_reject_ec_desc: 'User will be notified to update their contact.',
  modal_approve_deletion: 'Approve account deletion',
  modal_reject_deletion: 'Reject deletion request',
  modal_note_optional: 'Admin note (optional)',
  modal_reason_rejection: 'Reason for rejection',
  modal_audit_note: 'Audit note (optional)',
  modal_reason_optional: 'Reason (optional)',
  modal_confirm_verify_ec: 'Verify contact',
  modal_confirm_reject: 'Reject',
  modal_confirm_delete: 'Delete all data',
  modal_confirm_reject_req: 'Reject request',
  modal_verify_report: 'Verify risk report',
  modal_action: 'Action',
  modal_admin_note: 'Admin note',
  modal_note_ph: 'Optional clinical note…',
  modal_saving: 'Saving…',
  modal_mark_verified: 'Mark verified',
  modal_verify_failed: 'Verify failed',
  modal_note_required: 'A note is required.',
  modal_action_failed: 'Action failed',
  modal_assign_title: 'Assign appointment',
  modal_select_therapist: 'Therapist',
  modal_select_date: 'Date',
  modal_time_slot: 'Time slot',
  modal_admin_note_short: 'Admin note',
  modal_assigning: 'Assigning…',
  modal_confirm_assignment: 'Confirm assignment',
  modal_assign_incomplete: 'Select therapist, date, and time slot.',
  modal_assign_failed: 'Assign failed',
  modal_select: 'Select…',
  action_reviewed: 'Reviewed only',
  action_contacted_user: 'Contacted user',
  action_referred_care: 'Referred to care',
  action_resolved: 'Resolved',
  clinical_ai_intake: 'AI intake ({count})',
  clinical_none: 'None',
  clinical_score: 'Score',
  clinical_risk_reports: 'Risk reports ({count})',
  clinical_severity: 'severity',
  clinical_recent_moods: 'Recent moods ({count})',
  clinical_rating: 'Rating',
  clinical_journals: 'Journals ({count})',
  clinical_untitled: 'Untitled',
  language: 'Language',
};

const HI_WEB = {
  header_title: 'MindCare एडमिन',
  header_sub: 'प्लेटफ़ॉर्म निरीक्षण और clinical review',
  save_load: 'सहेजें और लोड करें',
  tab_pending: 'लंबित समीक्षा',
  tab_appointments: 'अपॉइंटमेंट',
  users_sidebar: 'उपयोगकर्ता ({count})',
  verify_btn: 'सत्यापित करें',
  pending_verify: 'सत्यापित करें',
  pending_reject: 'अस्वीकार',
  language: 'भाषा',
};

for (const lang of LANGS) {
  if (!translations[lang]) continue;
  translations[lang].web = { ...WEB, ...(lang === 'hi' ? HI_WEB : {}) };
}

function serializeSection(obj, depth) {
  const pad = '  '.repeat(depth);
  return Object.entries(obj)
    .map(([key, val]) => {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        return `${pad}${key}: {\n${serializeSection(val, depth + 1)}\n${pad}},`;
      }
      return `${pad}${key}: ${JSON.stringify(val)},`;
    })
    .join('\n');
}

const header = fs.readFileSync(outPath, 'utf8').split('const translations')[0];
const body = LANGS.map((lang) => `  ${lang}: {\n${serializeSection(translations[lang], 2)}\n  },`).join('\n\n');
fs.writeFileSync(outPath, `${header}const translations = {\n${body}\n};\n\nexport default translations;\n`);
console.log(`patched web.* keys (${Object.keys(WEB).length}) across ${LANGS.length} languages`);

import { spawnSync } from 'child_process';
const sync = spawnSync('node', ['admin/scripts/sync-translations.mjs'], { stdio: 'inherit', cwd: path.join(__dirname, '..') });
if (sync.status !== 0) process.exit(sync.status ?? 1);
