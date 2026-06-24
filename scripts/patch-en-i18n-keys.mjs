import fs from 'fs';

const path = 'src/localization/translations.js';
let src = fs.readFileSync(path, 'utf8');
const enStart = src.indexOf('  en: {');
const hiStart = src.indexOf('  hi: {');
if (enStart < 0 || hiStart < 0) throw new Error('lang markers not found');
let en = src.slice(enStart, hiStart);

function insertAfter(anchor, lines) {
  if (lines.some((l) => en.includes(l.split(':')[0].trim() + ':'))) return;
  const idx = en.indexOf(anchor);
  if (idx < 0) throw new Error(`anchor not found: ${anchor}`);
  const lineEnd = en.indexOf('\n', idx);
  en = en.slice(0, lineEnd + 1) + lines.join('\n') + '\n' + en.slice(lineEnd + 1);
}

insertAfter('      your_badges: "Your Badges ({earned} / {total})",', [
  '      locked: "Locked",',
  '      earned_on: "Earned {date}",',
]);

insertAfter('      open_likes: "{count} Likes",', [
  '      sample_paragraph_1: "There was a time I wanted to change the world. I tried to change the tech industry. Now I just want to change my thinking. I have struggled with depression on and off since 2011 that I\'m aware of. My peak depression level came early 2013 after moving from Raleigh, NC to San Francisco. The move didn\'t cause my depression, but the lack of self-awareness that I was even depressed almost killed me. As an entrepreneur, one of the most successful behaviors you can develop is the skill of self-awareness. Learn what it means to know what you don\'t know and how you are feeling. Learn the ability to process your emotional state of being.",',
  '      sample_paragraph_2: "I didn\'t have that skill in 2011; I wasn\'t processing my emotions, how I was feeling and even worse, how I was making others feel around me. I wasn\'t processing how my behavior was affecting my confidence. Confidence is everything. I know this. But understanding you need to work on your confidence and being confident is another. Projecting your confidence in your work can lead to peak success.",',
]);

insertAfter('      signup_failed: "Signup failed. Please try again.",', [
  '      api_invalid_credentials: "Invalid email or password.",',
  '      api_user_exists: "An account with this email already exists.",',
  '      api_server_error: "Server error. Please try again later.",',
  '      login_unreachable: "Login failed. Server may be unreachable.",',
  '      signup_unreachable: "Registration failed. Server may be unreachable.",',
]);

if (!en.includes('alert_error:')) {
  insertAfter('      loading_pending: "Loading pending items...",', [
    '      alert_error: "Error",',
    '      alert_failed: "Failed",',
    '      alert_incomplete: "Incomplete",',
    '      alert_assigned: "Assigned",',
    '      alert_verified: "Verified",',
    '      alert_rejected: "Rejected",',
    '      alert_approved: "Approved",',
    '      alert_no_contact: "No Contact",',
    '      alert_logged: "Logged",',
    '      alert_plan_assigned: "Plan Assigned",',
    '      alert_saved: "Saved",',
    '      alert_mismatch: "Mismatch",',
    '      alert_sla_complete: "SLA Check Complete",',
    '      load_pending_failed: "Failed to load pending items.",',
    '      sla_escalated: "Escalated reports have been flagged.",',
    '      sla_check_failed: "Failed to run SLA check.",',
    '      availability_failed: "Could not fetch availability.",',
    '      assign_incomplete: "Select therapist, date, and time slot.",',
    '      session_confirmed: "{name}\'s session confirmed.",',
    '      assign_failed: "Could not assign.",',
    '      report_marked: "Report marked as \\"{action}\\".",',
    '      verify_report_failed: "Could not verify report.",',
    '      ec_verified: "Emergency contact has been verified.",',
    '      ec_rejected: "Emergency contact has been rejected.",',
    '      ec_verify_failed: "Could not process EC verification.",',
    '      no_ec_on_file: "This user has no verified emergency contact on file.",',
    '      load_ec_failed: "Could not load emergency contact.",',
    '      call_logged: "Call outcome saved to audit trail.",',
    '      log_call_failed: "Could not log call outcome.",',
    '      plan_focus_required: "Please provide a Plan Focus.",',
    '      plan_sent: "Wellness plan sent to {name}",',
    '      assign_plan_failed: "Failed to assign plan.",',
    '      deletion_reviewed: "Deletion request has been {action}.",',
    '      deletion_failed: "Failed to process deletion request.",',
    '      password_mismatch: "Passwords do not match.",',
    '      profile_saved: "Profile updated successfully.",',
    '      profile_update_failed: "Could not update profile.",',
    '      feed_load_failed: "Failed to load feed",',
    '      sla_breach_title: "SLA BREACH — {count} REPORT{suffix} OVERDUE",',
    '      sla_breach_sub: "Immediate action required on HIGH/CRITICAL reports.",',
    '      rerun_sla: "Re-run SLA",',
    '      section_consultations: "Consultation Requests",',
    '      empty_consultations: "All consultation requests have been handled",',
    '      speciality_any: "Any",',
    '      no_time_pref: "No time preference",',
    '      assign_therapist: "Assign Therapist & Confirm",',
    '      section_risk_reports: "Unverified Risk Reports",',
    '      empty_risk_reports: "No unverified HIGH or CRITICAL reports",',
    '      sla_breached_min: "SLA BREACHED — {minutes}min overdue",',
    '      category_label: "Category",',
    '      severity_label: "Severity",',
    '      safety_triggered: "Safety response triggered",',
    '      urgent_review: "URGENT Review",',
    '      review_action: "Review & Action",',
    '      emergency_call: "Emergency Call",',
    '      section_emergency_contacts: "Emergency Contacts",',
    '      empty_emergency_contacts: "No emergency contacts pending verification",',
    '      contact_label: "Contact",',
    '      verify_reject_contact: "Verify or Reject Contact",',
    '      section_wellness_plans: "Wellness Plan Requests",',
    '      empty_wellness_plans: "No wellness plan requests pending",',
    '      build_assign_plan: "Build & Assign Plan",',
    '      section_deletion: "Account Deletion Requests",',
    '      empty_deletion: "No deletion requests pending",',
    '      review_deletion: "Review Deletion Request",',
  ]);
}

src = src.slice(0, enStart) + en + src.slice(hiStart);
fs.writeFileSync(path, src);
console.log('patched en translations');
