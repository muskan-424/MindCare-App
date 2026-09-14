export default {
  set: {
    'admin.sla_breach_title_one': 'SLA BREACH — 1 REPORT OVERDUE',
    'admin.sla_breach_title_other': 'SLA BREACH — {count} REPORTS OVERDUE',
  },
  // Replaced by the _one/_other keys: the old title appended an English "S" suffix in every language.
  remove: ['admin.sla_breach_title'],
};
