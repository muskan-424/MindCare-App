import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/theme';
import { Button } from 'react-native-elements';
import api from '../utils/apiClient';
import { connect } from 'react-redux';
import TrackedTouchable from '../components/TrackedTouchable';
import { updateConcerns } from '../redux/actions/profile';
import { fetchQuoteOfTheDay } from '../redux/actions/quote';
import { clearWelcome } from '../redux/actions/auth';

const SEVERITY_LABELS = { 1: 'A bit', 2: 'Somewhat', 3: 'Moderate', 4: 'Quite a bit', 5: 'Very much' };
const MOOD_TAGS = ['calm', 'anxious', 'sad', 'angry', 'tired', 'hopeful', 'overwhelmed', 'okay'];
const DEFAULT_CATEGORIES = ['academic_stress', 'anxiety', 'relationship', 'family', 'finances', 'health', 'loneliness', 'grief', 'self_esteem', 'sleep', 'work_life_balance', 'other'];

const FALLBACK_SELF_HELP = [
  { id: 'Breathing', screen: 'Breathing', label: 'Breathing', icon: 'https://cdn-icons-png.flaticon.com/512/4151/4151607.png' },
  { id: 'Affirmations', screen: 'Affirmations', label: 'Affirmations', icon: 'https://cdn-icons-png.flaticon.com/512/2461/2461102.png' },
  { id: 'CrisisResources', screen: 'CrisisResources', label: 'Crisis support', icon: 'https://cdn-icons-png.flaticon.com/512/463/463574.png' },
  { id: 'Gratitude', screen: 'Gratitude', label: 'Gratitude', icon: 'https://cdn-icons-png.flaticon.com/512/4207/4207244.png' },
  { id: 'Grounding', screen: 'Grounding', label: 'Grounding', icon: 'https://cdn-icons-png.flaticon.com/512/609/609803.png' },
];

const FALLBACK_CONTENT_CATEGORIES = [
  { id: 'meditation', label: 'Meditation' },
  { id: 'motivation', label: 'Motivation' },
  { id: 'sleep', label: 'Sleep Stories' },
  { id: 'relaxing_music', label: 'Relaxing Music' },
  { id: 'therapy', label: 'Therapy Advice' },
];
const label = (id) => (id || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const fallbackContentByCategory = {
  meditation: [
    {
      videoId: 'inpok4MKVLM',
      title: '10-Minute Guided Meditation for Anxiety',
      thumbnail: 'https://i.ytimg.com/vi/inpok4MKVLM/hqdefault.jpg',
    },
    {
      videoId: 'O-6f5wQXSu8',
      title: '5-Minute Meditation You Can Do Anywhere',
      thumbnail: 'https://i.ytimg.com/vi/O-6f5wQXSu8/hqdefault.jpg',
    },
  ],
  motivation: [
    {
      videoId: 'ZXsQAXx_ao0',
      title: 'Just Do It - Motivational Speech',
      thumbnail: 'https://i.ytimg.com/vi/ZXsQAXx_ao0/hqdefault.jpg',
    },
  ],
  sleep: [
    {
      videoId: '2OEL4P1Rz04',
      title: 'Deep Sleep Talk Down | Fall Asleep Fast',
      thumbnail: 'https://i.ytimg.com/vi/2OEL4P1Rz04/hqdefault.jpg',
    },
  ],
  relaxing_music: [
    {
      videoId: '2OEL4P1Rz04',
      title: 'Relaxing Piano & Rain Sounds',
      thumbnail: 'https://i.ytimg.com/vi/2OEL4P1Rz04/hqdefault.jpg',
    },
  ],
  therapy: [
    {
      videoId: 'aodS0mH2gfg',
      title: 'Therapy Session: Coping With Anxiety',
      thumbnail: 'https://i.ytimg.com/vi/aodS0mH2gfg/hqdefault.jpg',
    },
  ],
};

const HomeScreen = props => {
  const [assessmentModalVisible, setAssessmentModalVisible] = useState(false);
  const [assessmentStep, setAssessmentStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState(3);
  const [moodTag, setMoodTag] = useState('');
  const [description, setDescription] = useState('');
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentError, setAssessmentError] = useState('');
  const [contentFeed, setContentFeed] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('meditation');
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState(null);
  const [selfHelpTiles, setSelfHelpTiles] = useState(FALLBACK_SELF_HELP);
  const [contentCategories, setContentCategories] = useState(FALLBACK_CONTENT_CATEGORIES);

  useEffect(() => {
    (async () => {
      try {
        const res = await api
          .get('/api/issues/categories')
          .catch(() => ({}));
        const list = res.data?.categories || DEFAULT_CATEGORIES;
        setCategories(list);
        if (list[0]) setCategory(list[0]);
      } catch (e) {
        setCategories(DEFAULT_CATEGORIES);
        setCategory('anxiety');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/home').catch(() => ({}));
        if (res.data?.selfHelpTiles?.length) setSelfHelpTiles(res.data.selfHelpTiles);
        if (res.data?.contentCategories?.length) setContentCategories(res.data.contentCategories);
      } catch (_) {
        // keep fallbacks
      }
    })();
  }, []);

  // Daily check-in: show assessment when user is logged in and has not logged mood today (for burnout prediction history)
  useEffect(() => {
    const userId = props.auth.user?._id;
    if (!userId) return;

    const checkDailyMood = async () => {
      try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const dismissed = await AsyncStorage.getItem('MindCare_dismissedCheckInDate');
        if (dismissed === todayStr) return; // User dismissed prompt today, don't show again until tomorrow

        const res = await api.get('/api/mood/today', { params: { userId } }).catch(() => ({}));
        const loggedToday = res.data?.loggedToday === true;
        if (!loggedToday) setAssessmentModalVisible(true);
      } catch (_) {
        // on error don't force modal
      }
    };
    checkDailyMood();
  }, [props.auth.user?._id]);

  useEffect(() => {
    fetchQuoteOfTheDay();
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoadingContent(true);
        setContentError(null);
        const result = await api.get('/api/content/search', {
          params: { category: selectedCategory },
        });
        setContentFeed(result.data);
      } catch (err) {
        console.warn('Mindful Content API Error:', err.message);
        setContentError('Unable to load mindful content from server.');
        setContentFeed(fallbackContentByCategory[selectedCategory] || []);
      }
      setLoadingContent(false);
    };
    fetchContent();
  }, [selectedCategory]);

  useEffect(() => {
    if (!props.auth.welcomeMessage) return;
    const t = setTimeout(() => props.clearWelcome(), 4000);
    return () => clearTimeout(t);
  }, [props.auth.welcomeMessage]);

  const runAssessment = async () => {
    if (!props.auth.user?._id) {
      setAssessmentError('Please log in to complete check-in.');
      return;
    }
    setAssessmentError('');
    setAssessmentLoading(true);
    setAssessmentResult(null);
    try {
      const res = await api.post('/api/issues/report', {
        userId: props.auth.user._id,
        category: category || 'other',
        severity,
        description: description.trim(),
        moodTag: moodTag || undefined,
      });
      setAssessmentResult(res.data);
      if (res.data.safety?.showEmergencyScreen) {
        setAssessmentModalVisible(false);
        props.navigation.navigate('Safety', { helplines: res.data.safety.helplines });
        return;
      }
      try {
        await api.post('/api/mood', {
          userId: props.auth.user._id,
          rating: Math.max(1, Math.min(10, 11 - severity * 2)),
          note: description.trim() || undefined,
        });
      } catch (_) {}
    } catch (e) {
      setAssessmentError(e.response?.data?.error || e.message || 'Something went wrong.');
    }
    setAssessmentLoading(false);
  };

  const closeAssessment = () => {
    setAssessmentModalVisible(false);
    setAssessmentStep(1);
    setAssessmentResult(null);
    setAssessmentError('');
    const todayStr = new Date().toISOString().slice(0, 10);
    AsyncStorage.setItem('MindCare_dismissedCheckInDate', todayStr).catch(() => {});
  };

  const openAssessment = () => {
    setAssessmentStep(1);
    setAssessmentResult(null);
    setAssessmentError('');
    setAssessmentModalVisible(true);
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() => {
          // Navigating directly to the player since it's a specific video
          props.navigation.navigate('Track', {
            videoId: item.videoId,
            title: item.title,
            thumbnail: item.thumbnail
          });
        }}>
        <View style={styles.contentCard}>
          <Image
            source={{ uri: item.thumbnail }}
            style={{
              width: 180,
              height: 120,
              borderRadius: 10,
            }}
          />
          <Text style={styles.contentTitle} numberOfLines={2}>{item.title}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView>
      <Modal animationType="slide" transparent visible={assessmentModalVisible}>
        <KeyboardAvoidingView
          style={styles.centeredView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <View style={styles.modalView}>
            <ScrollView
              style={{ maxHeight: Dimensions.get('window').height * 0.8 }}
              contentContainerStyle={{ paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>AI Check-in</Text>
              <Text style={styles.modalSubtitle}>A quick assessment. Tink will suggest support based on your answers.</Text>

              {assessmentResult ? (
                <View style={styles.resultBlock}>
                  <Text style={styles.resultTitle}>Tink suggests</Text>
                  <Text style={styles.riskText}>Risk: {assessmentResult.riskLevel}</Text>
                  {assessmentResult.recommendations?.length > 0 &&
                    assessmentResult.recommendations.map((rec, i) => (
                      <Text key={i} style={styles.recText}>• {rec}</Text>
                    ))}
                  <TouchableOpacity style={styles.talkBtn} onPress={() => { closeAssessment(); props.navigation.navigate('Chat', { name: 'Tink' }); }}>
                    <Text style={styles.talkBtnText}>Talk to Tink</Text>
                  </TouchableOpacity>
                  <Button
                    buttonStyle={styles.done_button}
                    title="Done"
                    titleStyle={styles.done}
                    onPress={closeAssessment}
                  />
                </View>
              ) : (
                <>
                  {assessmentStep === 1 && (
                    <>
                      <Text style={styles.stepLabel}>What's on your mind?</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                        {categories.map((c) => (
                          <TouchableOpacity
                            key={c}
                            style={[styles.assessmentChip, category === c && styles.assessmentChipActive]}
                            onPress={() => setCategory(c)}
                          >
                            <Text style={[styles.assessmentChipText, category === c && styles.assessmentChipTextActive]}>{label(c)}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}
                  {assessmentStep === 2 && (
                    <>
                      <Text style={styles.stepLabel}>How much is it affecting you? (1–5)</Text>
                      <View style={styles.severityRow}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <TouchableOpacity
                            key={n}
                            style={[styles.sevBtn, severity === n && styles.sevBtnActive]}
                            onPress={() => setSeverity(n)}
                          >
                            <Text style={[styles.sevNum, severity === n && styles.sevNumActive]}>{n}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Text style={styles.sevLabel}>{SEVERITY_LABELS[severity]}</Text>
                    </>
                  )}
                  {assessmentStep === 3 && (
                    <>
                      <Text style={styles.stepLabel}>How are you feeling right now?</Text>
                      <View style={styles.moodRow}>
                        {MOOD_TAGS.map((m) => (
                          <TouchableOpacity
                            key={m}
                            style={[styles.assessmentChip, moodTag === m && styles.assessmentChipActive]}
                            onPress={() => setMoodTag(moodTag === m ? '' : m)}
                          >
                            <Text style={[styles.assessmentChipText, moodTag === m && styles.assessmentChipTextActive]}>{label(m)}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}
                  {assessmentStep === 4 && (
                    <>
                      <Text style={styles.stepLabel}>Anything else you'd like to share? (optional)</Text>
                      <TextInput
                        style={styles.assessmentInput}
                        placeholder="Describe how you're doing..."
                        placeholderTextColor={colors.gray}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                      />
                    </>
                  )}
                  {assessmentError ? <Text style={styles.errText}>{assessmentError}</Text> : null}
                  <View style={styles.modalActions}>
                    {assessmentStep > 1 && assessmentStep <= 4 && (
                      <Button
                        buttonStyle={styles.backAssessmentBtn}
                        title="Back"
                        titleStyle={{ color: colors.secondary }}
                        onPress={() => setAssessmentStep((s) => s - 1)}
                      />
                    )}
                    {assessmentStep < 4 ? (
                      <Button
                        buttonStyle={styles.done_button}
                        title="Next"
                        titleStyle={styles.done}
                        onPress={() => setAssessmentStep((s) => s + 1)}
                      />
                    ) : (
                      <Button
                        buttonStyle={styles.done_button}
                        title={assessmentLoading ? '' : 'Get AI assessment'}
                        titleStyle={styles.done}
                        onPress={runAssessment}
                        disabled={assessmentLoading}
                        loading={assessmentLoading}
                      />
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <View style={styles.container}>
        {props.auth.welcomeMessage === 'login' && (
          <View style={styles.welcomeBanner}>
            <Text style={styles.welcomeText}>✓ Login successful! Welcome back.</Text>
          </View>
        )}
        {props.auth.welcomeMessage === 'signup' && (
          <View style={styles.welcomeBanner}>
            <Text style={styles.welcomeText}>✓ Account created successfully! Welcome to MindCare.</Text>
          </View>
        )}
        <View style={styles.header}>
          <View>
            <Text style={styles.helloText}>Hello !</Text>
            <Text style={styles.nameText}>{props.auth.profile.name}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              props.navigation.navigate('Profile');
            }}>
            <View style={styles.avatar}>
              <Image
                source={require('../assets/userIcon.png')}
                style={{ width: 60, height: 60 }}
              />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.chatbotContainer}>
          <View style={styles.botContainer}>
            <Image
              source={require('../assets/tink.gif')}
              style={{ width: 180, height: 180 }}
            />
          </View>
          <View></View>
          <View style={styles.botContent}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: 10,
                color: colors.secondary,
              }}>
              I'M TINK
            </Text>
            <TouchableOpacity
              onPress={() => {
                props.navigation.navigate('Chat', {
                  name: 'Eva Gupta',
                });
              }}>
              <View style={styles.button}>
                <View style={styles.button}>
                  <Text
                    style={{
                      color: colors.white,
                      fontSize: 16,
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                    }}>
                    Let's talk
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.feelingCta} onPress={openAssessment}>
              <Text style={styles.feelingCtaText}>Check in (AI assessment)</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View>
          <TouchableOpacity
            onPress={() => {
              props.navigation.navigate('CreateMeme');
            }}>
            <View style={styles.createMemeContainer}>
              <Text style={styles.createMemeText}>Create a Meme</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.selfHelpContainer}>
          <Text style={styles.selfHelpTitle}>Self-help</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selfHelpScroll}>
            {selfHelpTiles.map(opt => (
              <TrackedTouchable
                key={opt.id}
                eventName={`Home_SelfHelp_${opt.id}`}
                style={styles.selfHelpCard}
                onPress={() => props.navigation.navigate(opt.screen)}
              >
                <Image source={{ uri: opt.icon }} style={styles.selfHelpIcon} />
                <Text style={styles.selfHelpLabel} numberOfLines={2}>{opt.label}</Text>
              </TrackedTouchable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>Quote of the day</Text>
          <View style={styles.quote}>
            <Text style={{ fontSize: 17 }}>
              {props.quote?.quote ?? 'Be yourself no matter what they say!'}
            </Text>
          </View>
        </View>
        <View style={styles.tracksContainer}>
          <Text style={styles.trackTitle}>Mindful Content</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
            {contentCategories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[styles.chip, selectedCategory === cat.id && styles.chipActive]}>
                <Text style={[styles.chipText, selectedCategory === cat.id && styles.chipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loadingContent ? (
            <View style={{ marginTop: 20 }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : contentFeed.length === 0 ? (
            <View style={{ marginTop: 20 }}>
              <Text style={{ color: colors.gray1 }}>
                {contentError || 'No content available right now.'}
              </Text>
            </View>
          ) : (
            <FlatList
              renderItem={renderItem}
              data={contentFeed}
              horizontal={true}
              keyExtractor={item => item.videoId}
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 15 }}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const mapStateToProps = state => ({
  auth: state.auth,
  quote: state.quote,
});

export default connect(mapStateToProps, { updateConcerns, fetchQuoteOfTheDay, clearWelcome })(
  HomeScreen,
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffff',
  },
  welcomeBanner: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: colors.primary,
    paddingBottom: 20,
    borderBottomLeftRadius: 120,
    elevation: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'column',
    width: Dimensions.get('window').width - 20,
  },

  helloText: {
    fontSize: 20,
    fontWeight: 'bold',
    flexDirection: 'column',
    color: colors.white,
    marginTop: 30,
  },
  nameText: {
    fontSize: 30,
    fontWeight: 'bold',
    flexDirection: 'column',
    color: colors.white,
  },
  avatar: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    elevation: 10,
    width: 70,
    height: 70,
    borderRadius: 90,
    marginRight: 10,
    marginTop: 20,
    marginLeft: 20,
  },
  chatbotContainer: {
    margin: 10,
    marginTop: 0,
    borderStyle: 'solid',
    borderColor: '#EFEFEF',
    borderRadius: 20,
    borderBottomWidth: 3,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  botContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  botContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 150,
    height: 40,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  feelingCta: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    alignItems: 'center',
  },
  feelingCtaText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  quoteContainer: {
    padding: 10,
    paddingTop: 0,
  },
  quoteText: {
    marginRight: 15,
    fontSize: 18,
    alignSelf: 'flex-end',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  quote: {
    padding: 10,
    width: Dimensions.get('screen').width - 50,
    alignItems: 'center',
    margin: 10,
    borderRadius: 20,
    elevation: 3,
    backgroundColor: '#face4b',
    borderTopRightRadius: 0,
  },
  tracksContainer: {
    marginVertical: 10,
    padding: 10,
    paddingTop: 0,
    paddingLeft: 20,
    position: 'relative',
  },
  trackTitle: {
    fontSize: 18,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  track: {
    width: 150,
    height: 150,
    margin: 10,
    borderRadius: 10,
    position: 'relative',
  },
  trackContent: {
    width: 150,
    height: 150,
    backgroundColor: 'black',
    borderRadius: 10,
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 10,
    paddingBottom: 10,
  },
  trackImage: {
    opacity: 1,
  },
  done: {
    alignSelf: 'center',
    justifyContent: 'center',
    fontSize: 15,
    flex: 1,
    color: colors.black,
  },
  done_button: {
    borderRadius: 90,
    backgroundColor: colors.yellow,
    borderColor: colors.tertiary,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 1,
    width: 120,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 16,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  assessmentChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray3,
  },
  assessmentChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  assessmentChipText: {
    fontSize: 14,
    color: colors.secondary,
  },
  assessmentChipTextActive: {
    color: colors.white,
  },
  severityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sevBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray3,
  },
  sevBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sevNum: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary,
  },
  sevNumActive: {
    color: colors.white,
  },
  sevLabel: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 16,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  assessmentInput: {
    borderWidth: 1,
    borderColor: colors.gray3,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  errText: {
    color: colors.redPink,
    fontSize: 14,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginHorizontal: 8,
  },
  backAssessmentBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 90,
    paddingHorizontal: 24,
    marginRight: 12,
  },
  resultBlock: {
    marginTop: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 8,
  },
  riskText: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 12,
  },
  recText: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 6,
  },
  talkBtn: {
    marginTop: 12,
    marginBottom: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  talkBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  preferencesItem: {
    marginHorizontal: 2,
    borderRadius: 12,
    borderColor: colors.gray3,
    borderWidth: 2,
    elevation: 0,
    backgroundColor: colors.white,
  },
  preferenceItemSelected: {
    marginHorizontal: 2,
    borderRadius: 12,
    borderColor: colors.gray3,
    borderWidth: 2,
    elevation: 0,
    backgroundColor: colors.accent,
  },
  preferenceText: {
    color: colors.primary,
    paddingLeft: 10,
    paddingRight: 10,
    paddingVertical: 5,
  },
  createMemeContainer: {
    width: 150,
    height: 40,
    backgroundColor: colors.secondary,
    borderRadius: 10,
    marginLeft: 20,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createMemeText: {
    color: colors.white,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  selfHelpContainer: {
    marginBottom: 16,
    paddingLeft: 4,
  },
  selfHelpTitle: {
    fontSize: 18,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    color: colors.secondary,
    marginLeft: 16,
    marginBottom: 12,
  },
  selfHelpScroll: {
    paddingLeft: 12,
  },
  selfHelpCard: {
    width: 100,
    marginRight: 12,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    minHeight: 88,
    justifyContent: 'center',
  },
  selfHelpIcon: {
    width: 32,
    height: 32,
    marginBottom: 6,
    resizeMode: 'contain',
  },
  selfHelpLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
    textAlign: 'center',
  },
  contentCard: {
    width: 180,
    marginRight: 15,
  },
  contentTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.black,
  },
  chipContainer: {
    marginTop: 10,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EFEFEF',
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.gray1,
    fontWeight: 'bold',
  },
  chipTextActive: {
    color: colors.white,
  }
});
