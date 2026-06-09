/**
 * responseShapers.js
 * Central DTO helpers so API payloads stay consistent and never leak
 * Mongoose internals (password hashes, __v, etc.).
 */

const INTERNAL_KEYS = new Set(['password', '__v', '$__', '$isNew', '_doc']);

function toPlain(doc) {
  if (!doc) return doc;
  if (Array.isArray(doc)) return doc.map(toPlain);
  if (typeof doc.toObject === 'function') return doc.toObject({ virtuals: true });
  return { ...doc };
}

function isPlainObject(val) {
  return val && typeof val === 'object' && !Array.isArray(val)
    && Object.getPrototypeOf(val) === Object.prototype;
}

function stripInternal(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(stripInternal);
  const out = {};
  for (const [key, val] of Object.entries(obj)) {
    if (INTERNAL_KEYS.has(key)) continue;
    out[key] = isPlainObject(val) ? stripInternal(val) : val;
  }
  return out;
}

function shapeId(doc) {
  const plain = stripInternal(toPlain(doc));
  if (plain && plain._id != null) {
    const id = typeof plain._id.toHexString === 'function'
      ? plain._id.toHexString()
      : String(plain._id);
    plain.id = id;
    plain._id = id;
  }
  return plain;
}

function shapeUser(user) {
  const plain = shapeId(user);
  if (!plain) return plain;
  delete plain.password;
  return plain;
}

function shapeProfile(profile) {
  return shapeId(profile);
}

function shapeAuthResponse({ token, user, profile }) {
  return {
    token,
    user: shapeUser(user),
    profile: shapeProfile(profile),
  };
}

function shapeGoal(goal) {
  const plain = shapeId(goal);
  if (!plain) return plain;
  if (Array.isArray(plain.milestones)) {
    plain.milestones = plain.milestones.map(ms => ({
      id: ms._id ? String(ms._id) : ms.id,
      label: ms.label,
      completed: Boolean(ms.completed),
      completedAt: ms.completedAt || null,
    }));
  }
  return plain;
}

function shapeGoals(goals) {
  return (goals || []).map(shapeGoal);
}

function shapeConversationSummary(conv) {
  const plain = toPlain(conv);
  return {
    id: String(plain._id),
    title: plain.title,
    language: plain.language,
    lastMessageAt: plain.lastMessageAt,
    messageCount: Array.isArray(plain.messages) ? plain.messages.length : 0,
    preview: Array.isArray(plain.messages) && plain.messages.length
      ? String(plain.messages[plain.messages.length - 1].text || '').slice(0, 80)
      : '',
  };
}

function shapeConversationDetail(conv) {
  const plain = toPlain(conv);
  return {
    id: String(plain._id),
    title: plain.title,
    language: plain.language,
    messages: (plain.messages || []).map(m => ({
      id: m._id ? String(m._id) : undefined,
      role: m.role,
      text: m.text,
      suggestions: m.suggestions,
      cards: m.cards,
      crisis: m.crisis,
      intent: m.intent,
      confidence: m.confidence,
      sources: m.sources,
      draft: m.draft,
      mode: m.mode,
      verificationNote: m.verificationNote,
      modelTier: m.modelTier,
      createdAt: m.createdAt,
    })),
  };
}

function formatJournalDate(date) {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatJournalTime(date) {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function shapeMoodLogResponse(entry, streakData = {}) {
  const plain = shapeId(entry);
  return {
    id: plain.id || String(plain._id),
    date: plain.date,
    rating: plain.rating,
    streak: streakData.currentStreak ?? 0,
    newBadge: streakData.newBadge ?? null,
  };
}

function shapeMoodEntryBrief(entry) {
  if (!entry) return null;
  return {
    id: entry._id ? String(entry._id) : entry.id,
    date: entry.date,
    rating: entry.rating,
    note: entry.note || '',
  };
}

function shapeMoodToday(entry) {
  return {
    loggedToday: Boolean(entry),
    entry: shapeMoodEntryBrief(entry),
  };
}

function shapeJournalEntry(entry) {
  const plain = shapeId(entry);
  const date = plain.date || new Date();
  return {
    id: plain.id || String(plain._id),
    date: formatJournalDate(date),
    time: formatJournalTime(date),
    content: plain.content,
    sentimentScore: plain.sentimentScore,
    emotionTags: plain.emotionTags,
    riskLevel: plain.riskLevel,
    aiInsight: plain.aiInsight,
  };
}

function shapeJournalEntries(entries) {
  return (entries || []).map(shapeJournalEntry);
}

function shapeTherapistListing(t) {
  return {
    id: t.id || (t._id ? String(t._id) : undefined),
    name: t.name,
    specialisation: t.specialisation || 'Mental Health Professional',
    img: t.img || 'https://www.allsmilesdentist.com/wp-content/uploads/2017/08/Doctors-circle.png',
    bio: t.bio || '',
    email: t.email || '',
    contact_no: t.contact_no || '',
    timing: t.timing || '9:00 AM - 5:00 PM',
    fee: t.fee || '$15/session',
    stars: t.stars ?? 5,
  };
}

function shapeTherapistProfile(t) {
  const plain = shapeId(t);
  return shapeTherapistListing({
    ...plain,
    id: plain.id || String(plain._id),
    bio: plain.bio || 'Your bio here',
    contact_no: plain.contact_no || '12345678',
    fee: plain.fee || '$50/session',
  });
}

function shapeTherapistNote(note) {
  const plain = shapeId(note);
  return {
    id: plain.id || String(plain._id),
    patient: plain.patient ? String(plain.patient) : undefined,
    therapist: plain.therapist ? String(plain.therapist) : undefined,
    sessionDate: plain.sessionDate,
    content: plain.content,
    category: plain.category,
    confidentialityLevel: plain.confidentialityLevel,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function shapeTherapistNotes(notes) {
  return (notes || []).map(shapeTherapistNote);
}

function shapeClinicalPatientProfile({ user, profile, fusions, issues, moods, journals }) {
  return {
    user: shapeUser(user),
    profile: shapeProfile(profile),
    fusions: (fusions || []).map(f => ({
      id: String(f._id),
      riskLevel: f.riskLevel,
      riskScore: f.riskScore,
      aiMarkers: f.aiMarkers,
      recommendations: f.recommendations,
      createdAt: f.createdAt,
    })),
    issues: (issues || []).map(i => ({
      id: String(i._id),
      category: i.category,
      severity: i.severity,
      riskLevel: i.riskLevel,
      safetyTriggered: i.safetyTriggered,
      createdAt: i.createdAt,
    })),
    moods: (moods || []).map(shapeMoodEntryBrief),
    journals: (journals || []).map(j => ({
      id: String(j._id),
      title: j.title,
      contentPreview: j.content ? `${j.content.substring(0, 50)}...` : '',
      date: j.date,
    })),
  };
}

function shapeAppointmentPatientView(appt) {
  const plain = shapeId(appt);
  const therapist = plain.therapist;
  const therapistObj = therapist && typeof therapist === 'object' ? therapist : null;
  return {
    id: plain.id || String(plain._id),
    requestedSpeciality: plain.requestedSpeciality || '',
    preferredDates: plain.preferredDates || [],
    preferredTime: plain.preferredTime || '',
    userNote: plain.userNote || '',
    therapistId: therapistObj ? String(therapistObj._id || therapistObj.id) : (therapist ? String(therapist) : null),
    therapistName: therapistObj?.name || null,
    therapistImg: therapistObj?.img || null,
    specialisation: therapistObj?.specialisation || null,
    date: plain.date || null,
    timeSlot: plain.timeSlot || null,
    adminNote: plain.adminNote || '',
    status: plain.status,
    createdAt: plain.createdAt,
  };
}

function shapeAppointmentPatientViews(appts) {
  return (appts || []).map(shapeAppointmentPatientView);
}

function shapeAppointmentTherapistView(appt) {
  const plain = shapeId(appt);
  const id = plain.id || String(plain._id);
  const user = plain.user;
  const userObj = user && typeof user === 'object' ? user : null;
  return {
    id,
    _id: id,
    requestedSpeciality: plain.requestedSpeciality || '',
    preferredDates: plain.preferredDates || [],
    preferredTime: plain.preferredTime || '',
    userNote: plain.userNote || '',
    date: plain.date || null,
    timeSlot: plain.timeSlot || null,
    adminNote: plain.adminNote || '',
    status: plain.status,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    user: userObj ? {
      id: String(userObj._id || userObj.id),
      _id: String(userObj._id || userObj.id),
      name: userObj.name,
      email: userObj.email,
      age: userObj.age,
      gender: userObj.gender,
    } : (user ? { id: String(user), _id: String(user) } : null),
  };
}

function shapeAppointmentTherapistViews(appts) {
  return (appts || []).map(shapeAppointmentTherapistView);
}

function shapeAppointmentCreateResponse(appt, message) {
  const view = shapeAppointmentPatientView(appt);
  return {
    ...view,
    message: message || 'Your consultation request has been submitted.',
  };
}

function shapeDeletionRequest(request) {
  const plain = shapeId(request);
  return {
    id: plain.id || String(plain._id),
    user: plain.user ? String(plain.user) : undefined,
    reason: plain.reason,
    status: plain.status,
    adminNote: plain.adminNote || '',
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function shapePeerSuggestion(profile, sharedConcerns = []) {
  const plain = shapeId(profile);
  return {
    userId: String(plain.userId || plain.id),
    name: plain.name,
    peerBio: plain.peerBio || '',
    sharedConcerns,
  };
}

function shapePeerRequest(conn, direction) {
  const plain = shapeId(conn);
  const isIncoming = direction === 'incoming';
  const other = isIncoming ? plain.requester : plain.recipient;
  const otherObj = other && typeof other === 'object' ? other : null;
  return {
    requestId: plain.id || String(plain._id),
    userId: otherObj ? String(otherObj._id || otherObj.id) : String(other),
    userName: otherObj?.name,
    sharedConcerns: plain.sharedConcerns || [],
  };
}

function shapePeerRequestsResponse(incoming, outgoing) {
  return {
    incoming: (incoming || []).map(c => shapePeerRequest(c, 'incoming')),
    outgoing: (outgoing || []).map(c => shapePeerRequest(c, 'outgoing')),
  };
}

function shapePeerConnection(conn, myUserId) {
  const plain = shapeId(conn);
  const requesterId = String(plain.requester?._id || plain.requester);
  const isRequester = requesterId === String(myUserId);
  const other = isRequester ? plain.recipient : plain.requester;
  const otherObj = other && typeof other === 'object' ? other : null;
  return {
    userId: otherObj ? String(otherObj._id || otherObj.id) : String(other),
    userName: otherObj?.name,
    sharedConcerns: plain.sharedConcerns || [],
    connectedAt: plain.updatedAt,
  };
}

function shapeGroupParticipant(participant) {
  if (!participant) return null;
  if (typeof participant === 'object') {
    return {
      id: String(participant._id || participant.id),
      name: participant.name,
      email: participant.email,
    };
  }
  return String(participant);
}

function shapeGroupSession(session, { populateParticipants = false } = {}) {
  const plain = shapeId(session);
  const id = plain.id || String(plain._id);
  const rawParticipants = plain.participants || [];
  const participants = populateParticipants
    ? rawParticipants.map(shapeGroupParticipant).filter(Boolean)
    : rawParticipants.map(p => (typeof p === 'object' ? String(p._id || p.id) : String(p)));

  return {
    id,
    _id: id,
    title: plain.title,
    description: plain.description,
    scheduledDate: plain.scheduledDate,
    meetingLink: plain.meetingLink,
    maxParticipants: plain.maxParticipants ?? 10,
    participants,
    facilitatorName: plain.facilitatorName || 'MindCare Team',
    isActive: plain.isActive !== false,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function shapeGroupSessions(sessions, options = {}) {
  return (sessions || []).map(s => shapeGroupSession(s, options));
}

function shapeBadgeWithMeta(badge, metaMap = {}) {
  const plain = shapeId(badge);
  const key = plain.badgeKey || plain.key;
  const meta = metaMap[key] || {};
  return {
    key,
    earnedAt: plain.earnedAt,
    seen: Boolean(plain.seen),
    ...meta,
  };
}

function shapeBadgeGoal(threshold, progress, metaMap = {}) {
  if (!threshold) return null;
  const meta = metaMap[threshold.key] || {};
  return {
    key: threshold.key,
    target: threshold.target,
    progress,
    ...meta,
  };
}

function shapeWellnessTask(task) {
  const plain = toPlain(task);
  const id = plain._id != null ? String(plain._id) : (plain.id != null ? String(plain.id) : undefined);
  return {
    id,
    _id: id,
    title: plain.title,
    type: plain.type,
    description: plain.description || '',
    resourceLink: plain.resourceLink || '',
    completed: Boolean(plain.completed),
    completedAt: plain.completedAt || null,
  };
}

function shapeWellnessDay(day) {
  const plain = toPlain(day);
  const id = plain._id != null ? String(plain._id) : (plain.id != null ? String(plain.id) : undefined);
  return {
    id,
    _id: id,
    dayNumber: plain.dayNumber,
    date: plain.date || null,
    tasks: (plain.tasks || []).map(shapeWellnessTask),
  };
}

function shapeWellnessPlan(plan) {
  if (!plan) return null;
  const plain = shapeId(plan);
  const totalTasksCompleted = plain.totalTasksCompleted || 0;
  return {
    id: plain.id || String(plain._id),
    status: plain.status,
    goals: plain.goals || [],
    currentStruggles: plain.currentStruggles || '',
    preferredPace: plain.preferredPace || 'Moderate',
    adminNote: plain.adminNote || '',
    planFocus: plain.planFocus || '',
    planDurationDays: plain.planDurationDays,
    dailyPlans: (plain.dailyPlans || []).map(shapeWellnessDay),
    progress: totalTasksCompleted,
    totalTasksCompleted,
    startDate: plain.startDate || null,
    endDate: plain.endDate || null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function shapeWellnessPlanResponse(plan) {
  if (!plan) return { exists: false };
  return { exists: true, ...shapeWellnessPlan(plan) };
}

function shapeBlogPost(post) {
  const plain = shapeId(post);
  return {
    id: plain.id || String(plain._id),
    title: plain.title,
    author: plain.author,
    likes: plain.likes ?? 0,
    profilePic: plain.profilePic,
    image: plain.image,
    section: plain.section,
  };
}

function shapeBlogFeed({ featured = [], popular = [] } = {}) {
  return {
    featured: featured.map(shapeBlogPost),
    popular: popular.map(shapeBlogPost),
  };
}

function shapeAssignedResource(resource, { assignedAt, reportCategory } = {}) {
  const plain = stripInternal(toPlain(resource));
  return {
    title: plain.title,
    type: plain.type,
    url: plain.url,
    description: plain.description || '',
    assignedAt: assignedAt || null,
    reportCategory: reportCategory || null,
  };
}

function shapeStreaksResponse({
  streak,
  badges,
  badgeMeta = {},
  streakThresholds = [],
  checkinThresholds = [],
}) {
  const earnedKeys = new Set((badges || []).map(b => b.badgeKey));
  const currentStreak = streak?.currentStreak || 0;
  const totalCheckins = streak?.totalCheckins || 0;
  const nextStreakBadge = streakThresholds.find(t => !earnedKeys.has(t.key));
  const nextCheckinBadge = checkinThresholds.find(t => !earnedKeys.has(t.key));

  return {
    currentStreak,
    longestStreak: streak?.longestStreak || 0,
    totalCheckins,
    lastCheckinDate: streak?.lastCheckinDate || null,
    badges: (badges || []).map(b => shapeBadgeWithMeta(b, badgeMeta)),
    nextStreakGoal: shapeBadgeGoal(nextStreakBadge, currentStreak, badgeMeta),
    nextCheckinGoal: shapeBadgeGoal(nextCheckinBadge, totalCheckins, badgeMeta),
  };
}

function shapeAdminUserListing(user, profile = null) {
  const plain = shapeUser(user);
  return {
    id: plain.id || String(plain._id),
    name: plain.name,
    email: plain.email,
    age: plain.age,
    gender: plain.gender,
    role: plain.role || 'user',
    suspended: plain.suspended || false,
    flagged: plain.flagged || false,
    flagReason: plain.flagReason || '',
    createdAt: plain.createdAt,
    profile: profile ? {
      phone_no: profile.phone_no,
      concerns: profile.concerns || [],
    } : null,
  };
}

function shapeAdminAppointment(appt) {
  const plain = shapeId(appt);
  const therapist = plain.therapist && typeof plain.therapist === 'object' ? plain.therapist : null;
  const user = plain.user && typeof plain.user === 'object' ? plain.user : null;
  return {
    id: plain.id || String(plain._id),
    userName: user?.name || 'Unknown',
    userEmail: user?.email || '',
    requestedSpeciality: plain.requestedSpeciality || '',
    preferredDates: plain.preferredDates || [],
    preferredTime: plain.preferredTime || '',
    userNote: plain.userNote || '',
    therapistId: therapist ? String(therapist._id || therapist.id) : null,
    therapistName: therapist?.name || null,
    therapistSpeciality: therapist?.specialisation || null,
    therapistTiming: therapist?.timing || null,
    date: plain.date || null,
    timeSlot: plain.timeSlot || null,
    adminNote: plain.adminNote || '',
    status: plain.status,
    createdAt: plain.createdAt,
  };
}

function shapeAdminIssueReport(report) {
  const plain = shapeId(report);
  const user = plain.user && typeof plain.user === 'object' ? plain.user : null;
  return {
    id: plain.id || String(plain._id),
    userId: user ? String(user._id || user.id) : String(plain.user),
    userName: user?.name,
    userEmail: user?.email,
    createdAt: plain.createdAt,
    category: plain.category,
    severity: plain.severity,
    description: plain.description,
    moodTag: plain.moodTag,
    riskLevel: plain.riskLevel,
    sentimentScore: plain.sentimentScore,
    emotionTags: plain.emotionTags || [],
    recommendations: plain.recommendations || [],
  };
}

function shapeAdminEmergencyContact(contact) {
  const plain = shapeId(contact);
  const user = plain.user && typeof plain.user === 'object' ? plain.user : null;
  return {
    id: plain.id || String(plain._id),
    userId: user ? String(user._id || user.id) : String(plain.user),
    userName: user?.name || 'Unknown',
    userEmail: user?.email || '',
    contactName: plain.name,
    relationship: plain.relationship,
    phone: plain.phone,
    reachVia: plain.reachVia,
    userMessage: plain.userMessage || '',
    status: plain.status,
    callLogCount: plain.callLog?.length || 0,
    createdAt: plain.createdAt,
  };
}

function shapeAdminResource(resource) {
  const plain = shapeId(resource);
  return {
    id: plain.id || String(plain._id),
    title: plain.title,
    type: plain.type,
    url: plain.url,
    description: plain.description || '',
    active: plain.active !== false,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function shapeAdminAuditLogEntry(log) {
  const plain = shapeId(log);
  const target = plain.targetUser && typeof plain.targetUser === 'object' ? plain.targetUser : null;
  return {
    id: plain.id || String(plain._id),
    adminId: plain.adminId,
    action: plain.action,
    targetUserName: target?.name || null,
    targetUserEmail: target?.email || null,
    metadata: plain.metadata || {},
    createdAt: plain.createdAt,
  };
}

function shapeAdminWellnessPlan(plan) {
  const shaped = shapeWellnessPlan(plan);
  if (!shaped) return null;
  const user = plan.user;
  if (user && typeof user === 'object') {
    shaped.user = {
      id: String(user._id || user.id),
      name: user.name,
      email: user.email,
    };
  }
  return shaped;
}

function shapeChatResponse(payload) {
  return {
    reply: payload.reply,
    suggestions: payload.suggestions || [],
    cards: payload.cards || [],
    crisis: Boolean(payload.crisis),
    mood: payload.mood || 'neutral',
    detectedLanguage: payload.detectedLanguage || 'en',
    intent: payload.intent,
    confidence: payload.confidence,
    sources: payload.sources || [],
    draft: payload.draft || null,
    mode: payload.mode || 'rule',
    toolTraces: payload.toolTraces || [],
    conversationId: payload.conversationId || null,
    verificationNote: payload.verificationNote || undefined,
    modelTier: payload.modelTier || undefined,
  };
}

module.exports = {
  stripInternal,
  shapeUser,
  shapeProfile,
  shapeAuthResponse,
  shapeGoal,
  shapeGoals,
  shapeMoodLogResponse,
  shapeMoodEntryBrief,
  shapeMoodToday,
  shapeJournalEntry,
  shapeJournalEntries,
  shapeTherapistListing,
  shapeTherapistProfile,
  shapeTherapistNote,
  shapeTherapistNotes,
  shapeClinicalPatientProfile,
  shapeAppointmentPatientView,
  shapeAppointmentPatientViews,
  shapeAppointmentTherapistView,
  shapeAppointmentTherapistViews,
  shapeAppointmentCreateResponse,
  shapeDeletionRequest,
  shapePeerSuggestion,
  shapePeerRequestsResponse,
  shapePeerConnection,
  shapeGroupSession,
  shapeGroupSessions,
  shapeStreaksResponse,
  shapeWellnessPlan,
  shapeWellnessPlanResponse,
  shapeBlogPost,
  shapeBlogFeed,
  shapeAssignedResource,
  shapeAdminUserListing,
  shapeAdminAppointment,
  shapeAdminIssueReport,
  shapeAdminEmergencyContact,
  shapeAdminResource,
  shapeAdminAuditLogEntry,
  shapeAdminWellnessPlan,
  shapeConversationSummary,
  shapeConversationDetail,
  shapeChatResponse,
};
