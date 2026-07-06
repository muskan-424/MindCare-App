/**
 * Cross-cutting admin keys: plan templates, distinct spec labels, CMS field labels.
 */

const PLAN_NOTE = {
  hi: 'आपके {goal} लक्ष्य के लिए यह 30-दिवसीय वेलनेस योजना तैयार की गई है।',
  es: 'Este plan de bienestar de 30 días se ha elaborado para tu objetivo: {goal}.',
  fr: 'Ce plan bien-être de 30 jours a été élaboré pour votre objectif : {goal}.',
  de: 'Dieser 30-Tage-Wellness-Plan wurde für Ihr Ziel {goal} erstellt.',
  pt: 'Este plano de bem-estar de 30 dias foi elaborado para o seu objetivo: {goal}.',
  ar: 'تم إعداد خطة العافية لمدة 30 يوماً لهدفك: {goal}.',
  zh: '此 30 天健康计划已为您的目标 {goal} 制定。',
  pa: 'ਤੁਹਾਡੇ {goal} ਲਕਸ਼ ਲਈ ਇਹ 30-ਦਿਨ ਦੀ ਵੈਲਨੈਸ ਯੋਜਨਾ ਤਿਆਰ ਕੀਤੀ ਗਈ ਹੈ।',
};

const FR = {
  plan_note_template: PLAN_NOTE.fr,
  spec_trauma: 'Traumatisme',
  spec_addiction: 'Dépendance',
  tab_actions: 'Actions à traiter',
  tab_notes: 'Notes cliniques',
  tab_audit: 'Journal d\'audit',
  alert_validation: 'Vérification des données',
  contact_label: 'Personne à contacter',
  task_description: 'Description de la tâche',
  description: 'Description détaillée',
  audience: 'Public cible',
  resource_visible: 'Affiché',
  stat_articles: 'Articles publiés',
  stat_patients: 'Patients suivis',
};

const DE = {
  plan_note_template: PLAN_NOTE.de,
  spec_depression: 'Depressive Störung',
  spec_trauma: 'Psychisches Trauma',
  tab_audit: 'Prüfprotokoll',
  administrator: 'Verwalter',
  therapist_name: 'Name des Therapeuten',
};

const ES = {
  plan_note_template: PLAN_NOTE.es,
  spec_trauma: 'Trauma psicológico',
  spec_general: 'Atención general',
  stat_videos: 'Vídeos formativos',
  resource_visible: 'Publicado',
  alert_error: 'Se ha producido un error',
  verify_note: 'Nota de verificación',
  approve_deletion: 'Aprobar eliminación',
  reject_deletion: 'Rechazar solicitud',
  save_therapist: 'Guardar terapeuta',
};

const PT = {
  plan_note_template: PLAN_NOTE.pt,
  spec_trauma: 'Trauma psicológico',
  spec_general: 'Atendimento geral',
  resource_visible: 'Publicado',
  alert_validation: 'Validação de dados',
  contact_label: 'Pessoa de contacto',
  task_description: 'Descrição da tarefa',
  description: 'Descrição detalhada',
  audience: 'Público-alvo',
};

const AR = {
  plan_note_template: PLAN_NOTE.ar,
  placeholder_date: 'YYYY-MM-DD',
};

const ZH = {
  plan_note_template: PLAN_NOTE.zh,
  placeholder_date: 'YYYY-MM-DD',
};

const PA = {
  plan_note_template: PLAN_NOTE.pa,
  stat_total_resources: 'ਕੁੱਲ ਸਰੋਤ',
  kpi_total_users: 'ਕੁੱਲ ਵਰਤੋਂਕਾਰ',
  kpi_pending_queue: 'ਲੰਬਿਤ ਕਤਾਰ',
  stat_patients: 'ਮਰੀਜ਼',
  stat_clinicians: 'ਕਲੀਨਿਸ਼ੀਅਨ',
};

const HI = {
  plan_note_template: PLAN_NOTE.hi,
};

export const WESTERN_META_BY_LANG = {
  hi: HI,
  es: ES,
  fr: FR,
  de: DE,
  pt: PT,
  ar: AR,
  zh: ZH,
  pa: PA,
};
