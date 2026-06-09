import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Linking,
  Easing,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { colors } from '../../../constants/theme';
import useTranslation from '../../../utils/i18n';
import {
  sendChatMessage,
  refineMessage,
  getCapabilities,
  commitDraft,
} from '../../../utils/tinkChat';
import { FEATURE_FLAGS, DEFAULT_CHAT_TONE } from '../../../constants/featureFlags';
import {
  startListening,
  stopListening,
  destroyVoice,
  isVoiceAvailable,
  isTtsAvailable,
  speak,
  stopSpeaking,
} from '../../../utils/speech';

const TINK_AVATAR = require('../../../assets/tink.gif');

let idCounter = 0;
const nextId = () => `${Date.now()}_${idCounter++}`;

const INTENT_LABELS = {
  support: 'Support',
  help: 'App help',
  lookup_mood: 'Your mood',
  lookup_journal: 'Your journals',
  lookup_goals: 'Your goals',
  lookup_appointments: 'Your sessions',
  discovery_groups: 'Group sessions',
  action_log_mood: 'Log mood',
  action_add_journal: 'New journal',
  action_set_goal: 'New goal',
  action_book_session: 'Book session',
};

const REFINE_OPTIONS = [
  { mode: 'shorter', label: 'Shorter' },
  { mode: 'simpler', label: 'Simpler' },
  { mode: 'steps', label: 'Steps' },
  { mode: 'professional', label: 'Professional' },
];

// ── Animated "Tink is typing" three-dot indicator ───────────────────────────
const TypingDots = () => {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ),
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={styles.typingRow}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.typingDot,
            { opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }), transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] },
          ]}
        />
      ))}
    </View>
  );
};

// ── Editable draft review card (log mood / journal / goal / book session) ────
const DRAFT_ICONS = { mood: 'happy-outline', journal: 'book-outline', goal: 'flag-outline', appointment: 'calendar-outline' };

const DraftReviewCard = ({ draft, status, onConfirm, onDismiss }) => {
  const [fields, setFields] = useState(draft.fields || {});
  const setField = (key, value) => setFields(prev => ({ ...prev, [key]: value }));

  const confirm = () => {
    // Rebuild commit payload from the (possibly edited) fields
    const payload = { ...draft.commit.payload, ...fields };
    onConfirm({ ...draft, commit: { ...draft.commit, payload } });
  };

  const renderFields = () => {
    switch (draft.kind) {
      case 'mood':
        return (
          <>
            <Text style={styles.draftLabel}>Rating (1–10)</Text>
            <TextInput
              style={styles.draftInput}
              keyboardType="number-pad"
              value={String(fields.rating ?? '')}
              onChangeText={v => setField('rating', Math.max(1, Math.min(10, Number(v.replace(/[^0-9]/g, '')) || 1)))}
              editable={status !== 'committed'}
            />
            <Text style={styles.draftLabel}>Note (optional)</Text>
            <TextInput style={[styles.draftInput, styles.draftMultiline]} value={fields.note || ''} onChangeText={v => setField('note', v)} multiline editable={status !== 'committed'} />
          </>
        );
      case 'journal':
        return (
          <>
            <Text style={styles.draftLabel}>Entry</Text>
            <TextInput style={[styles.draftInput, styles.draftMultiline]} value={fields.content || ''} onChangeText={v => setField('content', v)} multiline editable={status !== 'committed'} placeholder="Write what's on your mind…" placeholderTextColor="#999" />
          </>
        );
      case 'goal':
        return (
          <>
            <Text style={styles.draftLabel}>Goal title</Text>
            <TextInput style={styles.draftInput} value={fields.title || ''} onChangeText={v => setField('title', v)} editable={status !== 'committed'} placeholder="e.g. Meditate daily" placeholderTextColor="#999" />
            <Text style={styles.draftLabel}>Description (optional)</Text>
            <TextInput style={[styles.draftInput, styles.draftMultiline]} value={fields.description || ''} onChangeText={v => setField('description', v)} multiline editable={status !== 'committed'} />
          </>
        );
      case 'appointment':
        return (
          <>
            <Text style={styles.draftLabel}>Speciality (optional)</Text>
            <TextInput style={styles.draftInput} value={fields.requestedSpeciality || ''} onChangeText={v => setField('requestedSpeciality', v)} editable={status !== 'committed'} placeholder="e.g. Psychologist" placeholderTextColor="#999" />
            <Text style={styles.draftLabel}>Preferred time</Text>
            <TextInput style={styles.draftInput} value={fields.preferredTime || ''} onChangeText={v => setField('preferredTime', v)} editable={status !== 'committed'} placeholder="morning / afternoon / evening / any" placeholderTextColor="#999" />
            <Text style={styles.draftLabel}>What do you need help with?</Text>
            <TextInput style={[styles.draftInput, styles.draftMultiline]} value={fields.userNote || ''} onChangeText={v => setField('userNote', v)} multiline editable={status !== 'committed'} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.draftCard}>
      <View style={styles.draftHeader}>
        <Icon name={DRAFT_ICONS[draft.kind] || 'create-outline'} size={18} color={colors.primary} />
        <Text style={styles.draftTitle}>{draft.title}</Text>
        {status === 'committed' && <Icon name="checkmark-circle" size={18} color="#2E7D32" style={styles.draftDoneIcon} />}
      </View>
      {renderFields()}
      {status === 'committed' ? (
        <Text style={styles.draftDoneText}>Saved to your account ✓</Text>
      ) : (
        <View style={styles.draftActions}>
          <TouchableOpacity style={styles.draftDismiss} onPress={onDismiss} disabled={status === 'committing'}>
            <Text style={styles.draftDismissText}>Dismiss</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.draftConfirm} onPress={confirm} disabled={status === 'committing'}>
            {status === 'committing'
              ? <ActivityIndicator size="small" color={colors.white} />
              : <Text style={styles.draftConfirmText}>Confirm</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const ChatWithTink = props => {
  const { navigation, route } = props;
  const { t, language } = useTranslation();
  const auth = useSelector(state => state.auth);

  const profileName = auth?.profile?.name || auth?.user?.name;
  const routeName = route?.params?.name && route.params.name !== 'Tink' ? route.params.name : null;
  const userName = (profileName || routeName || 'there').split(' ')[0];

  const buildWelcome = useCallback(
    () => t('chat.welcome', "Hey {name}! I'm Tink, your MindCare companion. What's on your mind today?").replace('{name}', userName),
    [t, userName],
  );

  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', text: buildWelcome() },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [listening, setListening] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(false);
  const [capabilities, setCapabilities] = useState(null);
  const [refiningId, setRefiningId] = useState(null);
  const [draftStatus, setDraftStatus] = useState({}); // messageId -> 'pending'|'committing'|'committed'|'dismissed'

  // Typewriter streaming state
  const [streamId, setStreamId] = useState(null);
  const [streamText, setStreamText] = useState('');
  const streamFullRef = useRef('');

  const flatListRef = useRef();

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
  }, []);

  useEffect(() => {
    let mounted = true;
    getCapabilities().then(c => { if (mounted) setCapabilities(c); });
    return () => { mounted = false; };
  }, []);

  // If opened from history with a loaded transcript
  useEffect(() => {
    const loaded = route?.params?.loadedConversation;
    if (loaded && Array.isArray(loaded.messages) && loaded.messages.length) {
      setConversationId(loaded.id);
      setMessages(loaded.messages.map(m => ({
        id: m.id || nextId(),
        role: m.role,
        text: m.text,
        suggestions: m.suggestions,
        cards: m.cards,
        crisis: m.crisis,
        intent: m.intent,
        confidence: m.confidence,
        sources: m.sources,
        draft: m.draft,
        verificationNote: m.verificationNote,
        modelTier: m.modelTier,
        mode: m.mode,
      })));
    }
  }, [route?.params?.loadedConversation]);

  useEffect(() => {
    return () => {
      destroyVoice();
      stopSpeaking();
    };
  }, []);

  // Typewriter reveal effect
  useEffect(() => {
    if (!streamId) return undefined;
    const full = streamFullRef.current || '';
    let i = 0;
    const step = Math.max(1, Math.round(full.length / 90));
    const interval = setInterval(() => {
      i += step;
      if (i >= full.length) {
        setStreamText(full);
        clearInterval(interval);
        setStreamId(null);
        if (speakEnabled) speak(full, language);
      } else {
        setStreamText(full.slice(0, i));
      }
      scrollToEnd();
    }, 18);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId]);

  const sendText = useCallback(
    async (text) => {
      const trimmed = (text || '').trim();
      if (!trimmed || isTyping) return;

      const userMessage = { id: nextId(), role: 'user', text: trimmed };
      const history = messages
        .filter(m => !m.isError)
        .slice(-12)
        .map(m => ({ role: m.role, text: m.text }));

      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      setIsTyping(true);
      scrollToEnd();

      try {
        const res = await sendChatMessage({
          message: trimmed,
          history,
          conversationId,
          language,
          tone: DEFAULT_CHAT_TONE,
        });
        if (res.conversationId) setConversationId(res.conversationId);

        const botMessage = {
          id: nextId(),
          role: 'assistant',
          text: res.reply,
          suggestions: res.suggestions,
          cards: res.cards,
          crisis: res.crisis,
          intent: res.intent,
          confidence: res.confidence,
          sources: res.sources,
          draft: res.draft,
          mode: res.mode,
          verificationNote: res.verificationNote,
          modelTier: res.modelTier,
        };
        setIsTyping(false);
        setMessages(prev => [...prev, botMessage]);
        if (botMessage.draft) setDraftStatus(prev => ({ ...prev, [botMessage.id]: 'pending' }));
        streamFullRef.current = res.reply;
        setStreamText('');
        setStreamId(botMessage.id);
      } catch (err) {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          { id: nextId(), role: 'assistant', text: t('chat.error_generic', "Sorry, I couldn't reach the server. Please try again."), isError: true },
        ]);
      }
    },
    [messages, isTyping, conversationId, language, t, scrollToEnd],
  );

  const handleSend = () => sendText(inputText);

  const startNewChat = useCallback(() => {
    stopSpeaking();
    setConversationId(null);
    setDraftStatus({});
    setMessages([{ id: 'welcome', role: 'assistant', text: buildWelcome() }]);
  }, [buildWelcome]);

  // ── Refine the last reply ───────────────────────────────────────────────────
  const handleRefine = useCallback(async (messageId, mode) => {
    const target = messages.find(m => m.id === messageId);
    if (!target || refiningId) return;
    setRefiningId(messageId);
    try {
      const refined = await refineMessage({ text: target.text, mode, language });
      setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, text: refined } : m)));
      if (speakEnabled) speak(refined, language);
    } catch (_) { /* keep original */ } finally {
      setRefiningId(null);
    }
  }, [messages, refiningId, language, speakEnabled]);

  // ── Commit / dismiss a draft action ─────────────────────────────────────────
  const handleConfirmDraft = useCallback(async (messageId, draft) => {
    setDraftStatus(prev => ({ ...prev, [messageId]: 'committing' }));
    try {
      await commitDraft(draft);
      setDraftStatus(prev => ({ ...prev, [messageId]: 'committed' }));
      setMessages(prev => [
        ...prev,
        { id: nextId(), role: 'assistant', text: t('chat.draft_saved', 'Done — I\'ve saved that for you. 💜') },
      ]);
    } catch (err) {
      setDraftStatus(prev => ({ ...prev, [messageId]: 'pending' }));
      setMessages(prev => [
        ...prev,
        { id: nextId(), role: 'assistant', text: t('chat.draft_failed', "I couldn't save that just now. Please try again or do it from the app."), isError: true },
      ]);
    }
  }, [t]);

  const handleDismissDraft = useCallback((messageId) => {
    setDraftStatus(prev => ({ ...prev, [messageId]: 'dismissed' }));
  }, []);

  // ── Voice input ───────────────────────────────────────────────────────────
  const toggleListening = useCallback(async () => {
    if (listening) {
      await stopListening();
      setListening(false);
      return;
    }
    if (!isVoiceAvailable()) return;
    setListening(true);
    await startListening({
      language,
      onResult: (value) => setInputText(value),
      onPartial: (value) => setInputText(value),
      onError: () => setListening(false),
      onEnd: () => setListening(false),
    });
  }, [listening, language]);

  const toggleSpeak = useCallback(() => {
    setSpeakEnabled(prev => {
      const next = !prev;
      if (!next) stopSpeaking();
      return next;
    });
  }, []);

  // ── Card actions ──────────────────────────────────────────────────────────
  const handleCardAction = useCallback(
    (action) => {
      if (action.phone) {
        Linking.openURL(`tel:${action.phone}`).catch(() => {});
      } else if (action.route && navigation) {
        navigation.navigate(action.route);
      }
    },
    [navigation],
  );

  // ── Renderers ───────────────────────────────────────────────────────────────
  const renderCards = (cards) => {
    if (!cards || !cards.length) return null;
    return cards.map((card, idx) => {
      if (card.type === 'crisis') {
        return (
          <View key={`crisis_${idx}`} style={styles.crisisCard}>
            <View style={styles.crisisHeader}>
              <Icon name={card.icon || 'alert-circle'} size={20} color="#C62828" />
              <Text style={styles.crisisTitle}>{card.title}</Text>
            </View>
            {!!card.subtitle && <Text style={styles.crisisSubtitle}>{card.subtitle}</Text>}
            <View style={styles.crisisActions}>
              {(card.actions || []).map((action, aIdx) => (
                <TouchableOpacity key={aIdx} style={styles.crisisBtn} onPress={() => handleCardAction(action)}>
                  <Text style={styles.crisisBtnText}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      }
      return (
        <TouchableOpacity key={`action_${idx}`} style={styles.actionCard} onPress={() => handleCardAction(card)} activeOpacity={0.85}>
          <View style={styles.actionIconWrap}>
            <Icon name={card.icon || 'sparkles'} size={20} color={colors.primary} />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.actionTitle}>{card.title}</Text>
            {!!card.subtitle && <Text style={styles.actionSubtitle}>{card.subtitle}</Text>}
          </View>
          <Icon name="chevron-forward" size={18} color={colors.gray} />
        </TouchableOpacity>
      );
    });
  };

  const renderMessage = ({ item, index }) => {
    const isUser = item.role === 'user';
    const isStreaming = item.id === streamId;
    const displayText = isStreaming ? streamText : item.text;
    const isLastAssistant = !isUser && index === messages.length - 1 && !isStreaming;
    const dStatus = draftStatus[item.id];

    if (isUser) {
      return (
        <View style={[styles.messageRow, styles.userRow]}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{item.text}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.messageRow}>
        <Image source={TINK_AVATAR} style={styles.avatar} />
        <View style={styles.flex1}>
          <View style={[styles.botBubble, item.isError && styles.errorBubble]}>
            <Text style={[styles.botText, item.isError && styles.errorText]}>
              {displayText}
              {isStreaming ? <Text style={styles.caret}>▋</Text> : null}
            </Text>
          </View>

          {/* Low-confidence verification note */}
          {!isStreaming && !item.isError && item.verificationNote && (
            <View style={styles.verifyNote}>
              <Icon name="information-circle-outline" size={14} color="#B45309" />
              <Text style={styles.verifyNoteText}>
                {t('chat.verification_note', item.verificationNote)}
              </Text>
            </View>
          )}

          {/* Intent + confidence debug badges */}
          {!isStreaming && !item.isError && FEATURE_FLAGS.chatDebugBadges && item.intent && item.intent !== 'support' && (
            <View style={styles.badgeRow}>
              <View style={styles.intentBadge}>
                <Text style={styles.intentBadgeText}>{INTENT_LABELS[item.intent] || item.intent}</Text>
              </View>
              {typeof item.confidence === 'number' && (
                <View style={styles.confBadge}>
                  <Text style={styles.confBadgeText}>{Math.round(item.confidence * 100)}%</Text>
                </View>
              )}
              {item.modelTier && item.modelTier !== 'rule' && (
                <View style={styles.tierBadge}>
                  <Text style={styles.tierBadgeText}>
                    {item.modelTier === 'quality' ? t('chat.model_quality', 'Quality') : t('chat.model_fast', 'Fast')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* RAG source chips */}
          {!isStreaming && item.sources && item.sources.length > 0 && (
            <View style={styles.sourcesWrap}>
              <Icon name="document-text-outline" size={13} color={colors.gray} />
              {item.sources.map((s, i) => (
                <View key={i} style={styles.sourceChip}>
                  <Text style={styles.sourceText}>{s.title}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Rich cards */}
          {!isStreaming && renderCards(item.cards)}

          {/* Draft review card */}
          {!isStreaming && item.draft && FEATURE_FLAGS.chatActions && dStatus !== 'dismissed' && (
            <DraftReviewCard
              draft={item.draft}
              status={dStatus}
              onConfirm={(edited) => handleConfirmDraft(item.id, edited)}
              onDismiss={() => handleDismissDraft(item.id)}
            />
          )}

          {/* Refine bar on the latest assistant reply */}
          {isLastAssistant && !item.draft && item.text && item.text.length > 60 && (
            <View style={styles.refineWrap}>
              {refiningId === item.id ? (
                <ActivityIndicator size="small" color={colors.primary} style={styles.refineSpinner} />
              ) : (
                REFINE_OPTIONS.map(opt => (
                  <TouchableOpacity key={opt.mode} style={styles.refineChip} onPress={() => handleRefine(item.id, opt.mode)}>
                    <Text style={styles.refineText}>{opt.label}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Quick-reply suggestion chips */}
          {isLastAssistant && item.suggestions && item.suggestions.length > 0 && (
            <View style={styles.suggestionsWrap}>
              {item.suggestions.map((s, i) => (
                <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => sendText(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const showStarters = messages.length === 1 && !isTyping;
  const starters = [
    t('chat.starter_1', "I'm feeling anxious"),
    t('chat.starter_2', "I'm feeling low"),
    t('chat.starter_3', 'I had a rough day'),
    t('chat.starter_4', 'I just need to talk'),
  ];
  const quickPrompts = [
    t('chat.quick_mood', 'Show my mood this week'),
    t('chat.quick_goals', 'How are my goals?'),
    t('chat.quick_help', 'How does the assessment work?'),
    t('chat.quick_book', 'Book a therapy session'),
  ];

  const geminiLive = capabilities?.geminiLive;
  const ragLabel = capabilities?.ragMode === 'hybrid'
    ? t('chat.rag_hybrid', 'Hybrid RAG')
    : t('chat.rag_local', 'Local help');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="chevron-back" size={26} color={colors.white} />
        </TouchableOpacity>
        <Image source={TINK_AVATAR} style={styles.headerAvatar} />
        <View style={styles.headerTextWrap}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Tink</Text>
            {capabilities && (
              <View style={styles.capPillRow}>
                <View style={[styles.capPill, geminiLive ? styles.capPillLive : styles.capPillRule]}>
                  <Text style={styles.capPillText}>{geminiLive ? 'AI live' : 'Rule-based'}</Text>
                </View>
                {FEATURE_FLAGS.chatDebugBadges && (
                  <View style={styles.capPillRag}>
                    <Text style={styles.capPillText}>{ragLabel}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
          <Text style={styles.headerSubtitle}>
            {isTyping ? t('chat.typing', 'Tink is typing') : t('chat.online', 'Online')}
          </Text>
        </View>
        {FEATURE_FLAGS.chatHistory && (
          <TouchableOpacity onPress={() => navigation?.navigate('ChatHistory')} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon name="time-outline" size={22} color={colors.white} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={startNewChat} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="create-outline" size={22} color={colors.white} />
        </TouchableOpacity>
        {isTtsAvailable() && (
          <TouchableOpacity onPress={toggleSpeak} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon name={speakEnabled ? 'volume-high' : 'volume-mute'} size={22} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={scrollToEnd}
        ListFooterComponent={
          <>
            {isTyping && (
              <View style={styles.messageRow}>
                <Image source={TINK_AVATAR} style={styles.avatar} />
                <View style={[styles.botBubble, styles.typingBubble]}>
                  <TypingDots />
                </View>
              </View>
            )}
            {showStarters && (
              <View style={styles.startersContainer}>
                <Text style={styles.startersTitle}>{t('chat.starters_title', 'Not sure where to start?')}</Text>
                <View style={styles.suggestionsWrap}>
                  {starters.map((s, i) => (
                    <TouchableOpacity key={i} style={styles.starterChip} onPress={() => sendText(s)}>
                      <Text style={styles.starterText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.startersTitle, styles.quickTitle]}>{t('chat.quick_title', 'Or ask me to…')}</Text>
                <View style={styles.suggestionsWrap}>
                  {quickPrompts.map((s, i) => (
                    <TouchableOpacity key={i} style={styles.quickChip} onPress={() => sendText(s)}>
                      <Icon name="flash-outline" size={13} color={colors.primary} />
                      <Text style={styles.quickText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </>
        }
      />

      {/* Input bar */}
      <View style={styles.inputContainer}>
        {isVoiceAvailable() && (
          <TouchableOpacity
            style={[styles.micButton, listening && styles.micButtonActive]}
            onPress={toggleListening}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name={listening ? 'mic' : 'mic-outline'} size={22} color={listening ? colors.white : colors.primary} />
          </TouchableOpacity>
        )}
        <TextInput
          style={styles.textInput}
          placeholder={listening ? t('chat.listening', 'Listening…') : t('chat.input_placeholder', 'Message Tink…')}
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isTyping) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isTyping}
        >
          <Icon name="send" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatWithTink;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  flex1: {
    flex: 1,
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 12,
  },
  headerBtn: {
    padding: 4,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginLeft: 6,
    backgroundColor: colors.white,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 1,
  },
  capPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 4,
  },
  capPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  capPillLive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  capPillRule: {
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  capPillRag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  capPillText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  // Chat
  chatContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: colors.white,
  },
  userBubble: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    maxWidth: '82%',
  },
  botBubble: {
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    maxWidth: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  errorBubble: {
    backgroundColor: '#FDECEA',
  },
  userText: {
    color: colors.white,
    fontSize: 15,
    lineHeight: 22,
  },
  botText: {
    color: '#2B2B2B',
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: {
    color: '#C62828',
  },
  caret: {
    color: colors.primary,
    fontSize: 14,
  },
  // Typing dots
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginHorizontal: 3,
  },
  // Badges
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  intentBadge: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
  },
  intentBadgeText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '700',
  },
  confBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  confBadgeText: {
    color: '#2E7D32',
    fontSize: 10,
    fontWeight: '700',
  },
  tierBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tierBadgeText: {
    color: '#1565C0',
    fontSize: 10,
    fontWeight: '700',
  },
  verifyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 6,
    marginLeft: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
    maxWidth: '95%',
  },
  verifyNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  // Sources
  sourcesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 6,
  },
  sourceChip: {
    backgroundColor: '#EEF1FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 6,
    marginBottom: 4,
  },
  sourceText: {
    color: '#3949AB',
    fontSize: 10,
    fontWeight: '600',
  },
  // Refine
  refineWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    alignItems: 'center',
  },
  refineSpinner: {
    marginVertical: 4,
  },
  refineChip: {
    borderWidth: 1,
    borderColor: colors.gray2,
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 11,
    marginRight: 7,
    marginBottom: 6,
    backgroundColor: colors.white,
  },
  refineText: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: '600',
  },
  // Suggestions
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  suggestionChip: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 13,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  suggestionText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  // Starters
  startersContainer: {
    marginTop: 4,
    marginLeft: 38,
  },
  startersTitle: {
    color: colors.gray,
    fontSize: 13,
    marginBottom: 8,
  },
  quickTitle: {
    marginTop: 8,
  },
  starterChip: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray2,
  },
  starterText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  quickText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 5,
  },
  // Action card
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTitle: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: colors.gray,
    fontSize: 12,
    marginTop: 1,
  },
  // Draft review card
  draftCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  draftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  draftTitle: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
  },
  draftDoneIcon: {
    marginLeft: 'auto',
  },
  draftLabel: {
    color: colors.gray,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  draftInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#2B2B2B',
  },
  draftMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  draftActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  draftDismiss: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray2,
    marginRight: 8,
  },
  draftDismissText: {
    color: colors.gray,
    fontSize: 14,
    fontWeight: '600',
  },
  draftConfirm: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  draftConfirmText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  draftDoneText: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  // Crisis card
  crisisCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F4C7C3',
  },
  crisisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crisisTitle: {
    color: '#C62828',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
  crisisSubtitle: {
    color: '#7A4A48',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  crisisActions: {
    marginTop: 10,
  },
  crisisBtn: {
    backgroundColor: '#C62828',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  crisisBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  // Input
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderColor: '#EFEFEF',
    alignItems: 'flex-end',
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  micButtonActive: {
    backgroundColor: colors.redPink,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    maxHeight: 110,
    color: '#2B2B2B',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray2,
  },
});
