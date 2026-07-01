/**
 * Remaining admin dashboard i18n keys — merge into all 16 languages.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import translations from '../src/localization/translations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../src/localization/translations.js');
const LANGS = ['en', 'hi', 'pa', 'mr', 'bn', 'te', 'ta', 'gu', 'kn', 'ml', 'es', 'fr', 'de', 'pt', 'ar', 'zh'];

const ADMIN_REMAINING = {
  goals_label: 'Goals',
  pace_label: 'Pace',
  reason_label: 'Reason',
  default_wellness: 'Wellness',
  plan_30_day: '30-Day Plan: {goal}',
  default_plan_task_title: 'Deep Breathing',
  default_plan_task_desc: 'Take 5 minutes to focus on your breath.',
  action_contacted: 'Contacted',
  action_referred: 'Referred',
  action_resolved: 'Resolved',
  action_approved_word: 'approved',
  action_rejected_word: 'rejected',
  day_chip: 'Day {n}',
  call_outcome_reached: 'Reached',
  call_outcome_no_answer: 'No Answer',
  call_outcome_voicemail: 'Voicemail',
  call_outcome_referred: 'Referred',
  deactivate: 'Deactivate',
  activate: 'Activate',
  spec_anxiety: 'Anxiety',
  spec_depression: 'Depression',
  spec_trauma: 'Trauma',
  spec_relationships: 'Relationships',
  spec_addiction: 'Addiction',
  spec_child_therapy: 'Child Therapy',
  spec_career: 'Career',
  spec_general: 'General',
  stat_total_resources: 'Total Resources',
  stat_articles: 'Articles',
  stat_videos: 'Videos',
  stat_exercises: 'Exercises',
  resource_hidden: 'Hidden',
  resource_visible: 'Visible',
  show_resource: 'Show',
  hide_resource: 'Hide',
  audit_verify_risk_report: 'Verified Risk Report',
  audit_assign_appointment: 'Assigned Appointment',
  audit_verify_emergency_contact: 'Verified Emergency Contact',
  audit_reject_emergency_contact: 'Rejected Emergency Contact',
  audit_assign_wellness_plan: 'Assigned Wellness Plan',
  audit_add_therapist: 'Added Therapist',
  audit_update_therapist: 'Updated Therapist',
  audit_delete_therapist: 'Removed Therapist',
  audit_create_resource: 'Created Resource',
  audit_update_resource: 'Updated Resource',
  audit_delete_resource: 'Deleted Resource',
  audit_change_user_role: 'Changed User Role',
  audit_suspend_user: 'Suspended User',
  audit_reinstate_user: 'Reinstated User',
  audit_broadcast: 'Sent Broadcast',
  audit_export_logs: 'Exported Audit Logs',
  audit_export_patients: 'Exported Patient Data',
  stat_all_logs: 'All Logs',
  stat_auth_events: 'Auth Events',
  stat_admin_actions: 'Admin Actions',
  kpi_total_users: 'Total Users',
  kpi_active_therapists: 'Active Therapists',
  kpi_escalated_reports: 'Escalated Reports',
  kpi_pending_queue: 'Pending Queue',
  chart_risk_trend: 'System Risk Trend',
  chart_last_30_days: 'Last 30 Days',
  chart_mood_heatmap: 'Global Mood Heatmap',
  chart_last_90_days: '90 days',
  chart_no_data: 'No Data',
  export_share_title: 'MindCare {type} export',
  no_patients_search: 'No patients match your search',
  no_patients_found: 'No patients found',
  role_standard_user: 'Standard User',
  role_clinician: 'Clinician',
  role_super_admin: 'Super Admin',
  stat_total_accounts: 'Total Accounts',
  stat_patients: 'Patients',
  stat_clinicians: 'Clinicians',
  stat_suspended: 'Suspended',
  live_system: 'Live System',
  users_count: 'Users ({count})',
  back_to_users: 'Back to users list',
  change_role: 'Change Role',
  suspend: 'Suspend',
  reinstate: 'Reinstate',
  suspend_account_title: 'Suspend Account',
  reinstate_account_title: 'Reinstate Account',
  suspend_confirm: "Suspend {name}'s account? They will not be able to log in.",
  reinstate_confirm: "Reinstate {name}'s account and restore access?",
  no_assessments: 'No assessments yet.',
  category_risk_line: 'Category: {category} · Risk: {risk}',
  note_prefix: 'Note: {note}',
  mood_history: 'Mood History',
  no_mood_entries: 'No mood entries yet.',
  rating_label: 'Rating: {rating}',
  changing_role_for: 'Changing role for {name}',
  ai_assessments: 'AI Assessments',
  no_ai_assessments: 'No AI assessments found.',
  risk_level_label: 'Risk Level: {level}',
  score_label: 'Score: {score}%',
  markers_label: 'Markers: {markers}',
  risk_reports_section: 'Risk Reports',
  no_risk_reports: 'No risk reports found.',
  severity_risk_line: '{category} (Severity: {severity}/5)',
  risk_colon: 'Risk: {level}',
  recent_moods: 'Recent Moods',
  no_moods_logged: 'No moods logged.',
  rating_of_10: 'Rating: {rating}/10',
  status_verified_badge: 'VERIFIED',
  status_suspended_badge: 'SUSPENDED',
  stat_total_broadcasts: 'Total Broadcasts',
  stat_to_all_users: 'To All Users',
  stat_to_therapists: 'To Therapists',
  broadcasts_sent_one: '{count} broadcast sent',
  broadcasts_sent_other: '{count} broadcasts sent',
  recipients_count: '{count} recipients',
};

const HI_REMAINING = {
  goals_label: 'लक्ष्य',
  pace_label: 'गति',
  reason_label: 'कारण',
  action_contacted: 'संपर्क किया',
  action_referred: 'रेफर किया',
  action_resolved: 'हल किया',
  deactivate: 'निष्क्रिय करें',
  activate: 'सक्रिय करें',
  live_system: 'लाइव सिस्टम',
  change_role: 'भूमिका बदलें',
  suspend: 'निलंबित',
  reinstate: 'पुनर्स्थापित',
  mood_history: 'मूड इतिहास',
  ai_assessments: 'AI मूल्यांकन',
  risk_reports_section: 'जोखिम रिपोर्ट',
  recent_moods: 'हाल के मूड',
  users_count: 'उपयोगकर्ता ({count})',
  back_to_users: 'उपयोगकर्ता सूची पर वापस',
};

for (const lang of LANGS) {
  if (!translations[lang]) continue;
  translations[lang].admin = { ...translations[lang].admin, ...ADMIN_REMAINING };
  if (lang === 'hi') {
    translations[lang].admin = { ...translations[lang].admin, ...HI_REMAINING };
  }
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

const header = `/**
 * MindCare App — Localization Dictionary
 * Supports: English (en), Hindi (hi), Punjabi (pa), Marathi (mr),
 *           Bengali (bn), Telugu (te), Tamil (ta), Gujarati (gu),
 *           Kannada (kn), Malayalam (ml), Spanish (es),
 *           French (fr), German (de), Portuguese (pt),
 *           Arabic (ar), Chinese – Simplified (zh)
 *
 * Note: any key missing from a given language automatically falls back
 * to English (see utils/i18n.js), so partial coverage is safe.
 */

`;

const body = LANGS.map((lang) => `  ${lang}: {\n${serializeSection(translations[lang], 2)}\n  },`).join('\n\n');
fs.writeFileSync(outPath, `${header}const translations = {\n${body}\n};\n\nexport default translations;\n`);
console.log(`patched ${Object.keys(ADMIN_REMAINING).length} remaining admin keys`);
