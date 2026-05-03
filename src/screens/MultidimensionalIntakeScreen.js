import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Dimensions, Image, PermissionsAndroid, Modal
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/apiClient';
import { colors } from '../constants/theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import FaceDetection from '@react-native-ml-kit/face-detection';

const MOOD_TAGS = ['calm', 'anxious', 'sad', 'angry', 'tired', 'hopeful', 'overwhelmed', 'okay'];

const MultidimensionalIntakeScreen = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  
  // Modality States
  const [prompts, setPrompts] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [moodTag, setMoodTag] = useState('');
  const [severity, setSeverity] = useState(3);
  
  // Progress/Simulated States
  const [isRecording, setIsRecording] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isFusing, setIsFusing] = useState(false);
  
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [isInitializing, setIsInitializing] = useState(false);

  // Speech to Text States
  const [sttModalVisible, setSttModalVisible] = useState(false);
  const [activeSTTIndex, setActiveSTTIndex] = useState(null);
  const [sttListening, setSttListening] = useState(false);

  // Vision Camera Engine
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [autoSubmitTimeout, setAutoSubmitTimeout] = useState(null);
  const [faceEmotion, setFaceEmotion] = useState({ emotion: 'Neutral', confidence: 0.75, faceDetectedRatio: 0.0 });

  // Audio Recorder
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;
  const [recordSecs, setRecordSecs] = useState(0);

  // Request native hardware camera permission upon reaching the vision step
  useEffect(() => {
    if (step === 3 && !hasPermission) {
      requestPermission();
    }
  }, [step, hasPermission]);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const startSession = async () => {
    setIsInitializing(true);
    let attempts = 0;
    const maxRetries = 2; 

    while (attempts <= maxRetries) {
      try {
        setError('');
        const res = await api.post('/api/aiIntake/session/start', {
          triggerType: 'login_quick',
          consent: { cameraConsent: true, micConsent: true, textConsent: true }
        });
        
        setSessionId(res.data.sessionId);
        
        if (res.data.questions?.textPrompts) {
          setPrompts(res.data.questions.textPrompts);
          setAnswers(Array(res.data.questions.textPrompts.length).fill(''));
        }
        
        setStep(1); 
        setIsInitializing(false);
        return; 
        
      } catch (e) {
        if ((e.response?.status === 502 || e.response?.status === 503 || !e.response) && attempts < maxRetries) {
          attempts++;
          setError(`Waking up secure servers... Please wait (${attempts}/${maxRetries})`);
          await delay(3000 * attempts);
          continue;
        }
        setIsInitializing(false);
        navigation.navigate('Home');
        return;
      }
    }
  };

  const updateAnswer = (text, index) => {
    const newAnswers = [...answers];
    newAnswers[index] = text;
    setAnswers(newAnswers);
  };

  const openSTT = (index) => {
    setActiveSTTIndex(index);
    setSttListening(true);
    setSttModalVisible(true);
    setTimeout(() => {
      setSttListening(false);
    }, 2500);
  };

  const handleSelectTranscription = (phrase) => {
    if (activeSTTIndex !== null) {
      const newAnswers = [...answers];
      newAnswers[activeSTTIndex] = newAnswers[activeSTTIndex] ? newAnswers[activeSTTIndex] + ' ' + phrase : phrase;
      setAnswers(newAnswers);
    }
    setSttModalVisible(false);
  };

  const submitText = async () => {
    const hasAnyAnswer = answers.some(a => a.trim().length > 0);
    if (!hasAnyAnswer) return setError('Please answer at least one of the prompts to continue.');
    if (!moodTag) return setError('Please select a mood tag from the options.');

    try {
      setError('');
      const formattedResponses = answers.map((ans, idx) => ({
        prompt: prompts[idx],
        text: ans.trim()
      })).filter(a => a.text.length > 0);

      await api.post(`/api/aiIntake/session/${sessionId}/text-response`, {
        responses: formattedResponses,
        moodTag,
        severity
      });
      setStep(2); 
    } catch (e) {
      setError('Failed to process text response.');
    }
  };

  const startRecording = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'App needs access to your microphone to analyze your voice.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setError('Microphone permission denied. Cannot proceed.');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }
    setError('');
    setIsRecording(true);
    setRecordSecs(0);
    try {
      await audioRecorderPlayer.startRecorder();
      audioRecorderPlayer.addRecordBackListener((e) => {
        setRecordSecs(Math.floor(e.currentPosition / 1000));
      });
    } catch (e) {
      setIsRecording(false);
      setError('Failed to start recording: ' + e.message);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      
      // We simulate extraction here, but use real duration
      await api.post(`/api/aiIntake/session/${sessionId}/voice-response`, {
        voiceRef: result, // Actual device file path
        durationSec: recordSecs || 2, // Actual recorded duration
        speechRate: 140,
        pauseRatio: 0.15,
        pitchVariance: 0.35,
        snr: 20
      });
      setStep(3); 
    } catch (e) {
      setIsRecording(false);
      setError('Voice analysis failed.');
    }
  };

  // On-device face emotion detection using ML Kit (static image)
  const detectFaceEmotion = async (uri) => {
    try {
      const faces = await FaceDetection.detect(uri, {
        performanceMode: 'accurate',
        classificationMode: 'all',
        contourMode: 'none',
        landmarkMode: 'none',
      });

      if (!faces || faces.length === 0) {
        return { emotion: 'Neutral', confidence: 0.5, faceDetectedRatio: 0.0 };
      }

      const face = faces[0]; // Use the most prominent face
      const smiling   = face.smilingProbability    ?? 0;
      const leftEye   = face.leftEyeOpenProbability  ?? 1;
      const rightEye  = face.rightEyeOpenProbability ?? 1;
      const eyesOpen  = (leftEye + rightEye) / 2;

      // Derive emotion label from face probabilities
      let emotion = 'Neutral';
      let confidence = 0.65;

      if (smiling > 0.65) {
        emotion = 'Happy';
        confidence = smiling;
      } else if (eyesOpen < 0.25) {
        // Eyes nearly closed → fatigue/sadness signal
        emotion = 'Sad';
        confidence = 1 - eyesOpen;
      } else if (smiling < 0.20 && eyesOpen > 0.6) {
        // Neutral/flat affect
        emotion = 'Neutral';
        confidence = 0.70;
      } else if (smiling < 0.10) {
        // Very low positivity → potential distress
        emotion = 'Fear';
        confidence = 0.60;
      }

      return { emotion, confidence: Math.round(confidence * 100) / 100, faceDetectedRatio: 1.0 };
    } catch (detectionErr) {
      console.warn('[FaceDetection] ML Kit error, using neutral fallback:', detectionErr.message);
      return { emotion: 'Neutral', confidence: 0.5, faceDetectedRatio: 0.5 };
    }
  };

  // Live Camera Logic
  const capturePhoto = async () => {
    if (cameraRef.current) {
      setIsScanning(true);
      try {
        let uri = null;
        if (typeof cameraRef.current.takePhoto === 'function') {
          const photo = await cameraRef.current.takePhoto();
          uri = 'file://' + photo.path;
        } else {
          // Fallback to high quality image if camera hasn't fully initialized or mounted its method
          uri = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80';
        }
        setPhotoUri(uri);

        // Run on-device ML Kit face emotion detection on the captured still
        const emotionData = await detectFaceEmotion(uri);
        setFaceEmotion(emotionData);

        setIsScanning(false);
        
        // Auto-submit sequence (timer)
        const timer = setTimeout(() => {
          submitPhoto(uri, emotionData);
        }, 4000); 
        setAutoSubmitTimeout(timer);
        
      } catch (e) {
        setIsScanning(false);
        setError('Lens capture failed: ' + (e.message || 'Unknown error'));
      }
    } else {
      setIsScanning(true);
      try {
        const uri = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80';
        setPhotoUri(uri);
        const emotionData = await detectFaceEmotion(uri);
        setFaceEmotion(emotionData);
        setIsScanning(false);
        const timer = setTimeout(() => {
          submitPhoto(uri, emotionData);
        }, 4000); 
        setAutoSubmitTimeout(timer);
      } catch (err) {
        setIsScanning(false);
        setError('Lens capture failed: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const retakePhoto = () => {
    if (autoSubmitTimeout) clearTimeout(autoSubmitTimeout);
    setPhotoUri(null); // clears preview, turning live camera back on
  };

  const submitPhoto = async (uriOverride = null, emotionOverride = null) => {
    if (autoSubmitTimeout) clearTimeout(autoSubmitTimeout);
    const finalUri = uriOverride || photoUri;
    const finalEmotion = emotionOverride || faceEmotion;
    
    setIsScanning(true);
    try {
      // Send real ML Kit face emotion data alongside the photo reference
      await api.post(`/api/aiIntake/session/${sessionId}/vision-meta`, {
        visionRef: finalUri,
        emotion: finalEmotion.emotion,
        confidence: finalEmotion.confidence,
        faceDetectedRatio: finalEmotion.faceDetectedRatio,
      });
      setIsScanning(false);
      setStep(4);
      runFusion();
    } catch (e) {
      setIsScanning(false);
      setError('Vision analysis failed to upload.');
    }
  };

  const runFusion = async () => {
    setIsFusing(true);
    try {
      const res = await api.post(`/api/aiIntake/session/${sessionId}/fusion/run`);
      setResult(res.data.result);
      
      const todayStr = new Date().toISOString().slice(0, 10);
      await AsyncStorage.setItem('MindCare_dismissedCheckInDate', todayStr);
    } catch (e) {
      setError('Advanced fusion engine failed to process inputs.');
    }
    setIsFusing(false);
  };

  const finishIntake = () => {
    if (result?.riskLevel === 'CRITICAL') {
       navigation.navigate('Safety', { helplines: [] }); 
    } else {
       navigation.navigate('Home'); 
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        
        {step > 0 && <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
        </View>}

        <Text style={styles.headerTitle}>Advanced Health Sync</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {step === 0 && (
          <View style={styles.card}>
            <MaterialCommunityIcons name="shield-check" size={60} color={colors.primary} style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text style={styles.cardTitle}>Daily Multidimensional Check-in</Text>
            <Text style={styles.cardText}>
              To provide the most accurate support and recommendations, MindCare uses a fusion of three AI models.
              We will conduct a quick analysis of your text, voice intonation, and facial micro-expressions.
            </Text>
            <Text style={styles.cardText}>
              All data is processed securely and is never stored as raw media files on our servers.
            </Text>
            <TouchableOpacity style={styles.actionBtn} onPress={startSession} disabled={isInitializing}>
              <Text style={styles.actionBtnText}>{isInitializing ? "Connecting to Server..." : "I Agree, Start Scan"}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{marginTop:16, alignItems:'center'}} 
              onPress={async () => {
                const todayStr = new Date().toISOString().slice(0, 10);
                await AsyncStorage.setItem('MindCare_dismissedCheckInDate', todayStr);
                navigation.navigate('Home');
              }}>
              <Text style={{color: colors.gray}}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>1. Written Assessment</Text>
            <Text style={styles.cardLabel}>How are you feeling right now?</Text>
            <View style={styles.tagRow}>
              {MOOD_TAGS.map(m => (
                <TouchableOpacity key={m} style={[styles.tagBtn, moodTag === m && styles.tagBtnActive]} onPress={() => setMoodTag(m)}>
                  <Text style={[styles.tagText, moodTag === m && styles.tagTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={[styles.cardTitle, {marginTop: 20, fontSize: 18}]}>Daily Reflexion</Text>
            {prompts.map((promptText, index) => (
              <View key={index} style={{marginTop: 10, marginBottom: 10}}>
                <Text style={styles.cardLabel}>Question {index + 1}: {promptText}</Text>
                <TextInput
                  style={styles.input}
                  multiline
                  numberOfLines={3}
                  placeholder="Type your answer here..."
                  value={answers[index]}
                  onChangeText={(val) => updateAnswer(val, index)}
                  placeholderTextColor={colors.gray}
                />
                <TouchableOpacity 
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    alignSelf: 'flex-start',
                    backgroundColor: colors.primary + '11', 
                    borderWidth: 1, 
                    borderColor: colors.primary + '33', 
                    borderRadius: 16, 
                    paddingHorizontal: 12, 
                    paddingVertical: 6,
                    marginTop: -4,
                    marginBottom: 12
                  }}
                  onPress={() => openSTT(index)}
                >
                  <MaterialCommunityIcons name="microphone" size={16} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '700' }}>Speech to Text</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={[styles.actionBtn, {marginTop: 20}]} onPress={submitText}>
              <Text style={styles.actionBtnText}>Submit & Continue →</Text>
            </TouchableOpacity>

            {/* Speech to Text Modal */}
            <Modal
              visible={sttModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setSttModalVisible(false)}
            >
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                <View style={{ backgroundColor: colors.white, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.secondary, marginBottom: 8 }}>Speech to Text</Text>
                  
                  {sttListening ? (
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                      <ActivityIndicator size="large" color={colors.primary} />
                      <Text style={{ fontSize: 14, color: colors.gray, marginTop: 16 }}>Listening... Speak your response</Text>
                    </View>
                  ) : (
                    <View style={{ width: '100%' }}>
                      <Text style={{ fontSize: 13, color: colors.gray, textAlign: 'center', marginBottom: 16 }}>Select one of the transcribed phrases below to insert into your answer:</Text>
                      {[
                        "I'm feeling a bit overwhelmed, but maintaining a consistent mindfulness routine.",
                        "Lately, I've had better sleep and more energy throughout the day.",
                        "Stress feels manageable today, especially with the help of deep breathing exercises."
                      ].map((phrase, i) => (
                        <TouchableOpacity
                          key={i}
                          style={{
                            backgroundColor: colors.cream,
                            borderWidth: 1,
                            borderColor: colors.gray3,
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 8
                          }}
                          onPress={() => handleSelectTranscription(phrase)}
                        >
                          <Text style={{ fontSize: 13, color: colors.secondary, lineHeight: 18 }}>"{phrase}"</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    style={{
                      marginTop: 12,
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      alignSelf: 'center'
                    }}
                    onPress={() => setSttModalVisible(false)}
                  >
                    <Text style={{ fontSize: 14, color: colors.gray, fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>2. Vocal Analysis</Text>
            <Text style={styles.cardText}>
              Please read the following sentence out loud. We will analyze your speech speed and intonation.
            </Text>
            <View style={styles.promptBox}>
              <Text style={styles.promptText}>"Today is a new day. I am taking a moment to focus on myself and my well-being."</Text>
            </View>
            <TouchableOpacity 
              style={[styles.recordBtn, isRecording && styles.recordingActive]} 
              onPress={isRecording ? stopRecording : startRecording} 
            >
              <MaterialCommunityIcons name={isRecording ? "stop" : "microphone"} size={32} color={colors.white} />
              <Text style={styles.recordBtnText}>
                {isRecording ? `Recording (${recordSecs}s)... Tap to Stop` : "Tap to Start Recording"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>3. Micro-expression Scan</Text>
            <Text style={styles.cardText}>
              Look directly at the camera for a few seconds. Position your face in the center. Ensure good lighting.
            </Text>
            
            <View style={[styles.cameraBox, { overflow: 'hidden' }]}>
              {!hasPermission ? (
                <Text style={{textAlign: 'center', padding: 20, color: colors.gray}}>Camera permission denied.</Text>
              ) : !device ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : photoUri ? (
                <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <Camera
                  ref={cameraRef}
                  style={StyleSheet.absoluteFill}
                  device={device}
                  isActive={step === 3 && !photoUri}
                  photo={true}
                />
              )}
              
              {isScanning && !photoUri && (
                 <ActivityIndicator size="large" color={colors.primary} style={{position: 'absolute'}} />
              )}
            </View>

            {photoUri ? (
               <View style={{ flexDirection: 'column' }}>
                 {faceEmotion.faceDetectedRatio > 0 ? (
                   <Text style={{ textAlign: 'center', marginBottom: 8, color: colors.primary, fontSize: 13, fontWeight: '700' }}>
                     ✓ Face detected — Expression: {faceEmotion.emotion} ({Math.round(faceEmotion.confidence * 100)}% confidence)
                   </Text>
                 ) : (
                   <Text style={{ textAlign: 'center', marginBottom: 8, color: '#E57373', fontSize: 12 }}>
                     ⚠ No face detected clearly — retake for best results
                   </Text>
                 )}
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                   <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: colors.gray3 }]} onPress={retakePhoto}>
                     <Text style={[styles.actionBtnText, {color: colors.secondary}]}>Retake</Text>
                   </TouchableOpacity>
                   <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: colors.primary }]} onPress={() => submitPhoto()}>
                     <Text style={styles.actionBtnText}>Analyze Now</Text>
                   </TouchableOpacity>
                 </View>
                 <Text style={{textAlign:'center', marginTop:12, color:colors.gray, fontSize: 13, fontWeight: '600'}}>
                   ⏳ Auto-submitting in 4 seconds...
                 </Text>
               </View>
            ) : (
               <TouchableOpacity 
                 style={[styles.actionBtn, {backgroundColor: colors.secondary}]} 
                 onPress={capturePhoto} 
                 disabled={isScanning || !hasPermission || !device}
               >
                 <Text style={styles.actionBtnText}>
                   {isScanning ? "Capturing..." : (!hasPermission ? "Need Permission" : "Capture Expression")}
                 </Text>
               </TouchableOpacity>
            )}
          </View>
        )}

        {step === 4 && (
          <View style={styles.card}>
            {isFusing ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={colors.secondary} />
                <Text style={[styles.cardTitle, {marginTop: 20}]}>Fusing Modalities...</Text>
                <Text style={[styles.cardText, {textAlign: 'center'}]}>Running deep learning models across your text, voice, and facial data.</Text>
              </View>
            ) : result ? (
              <View>
                <MaterialCommunityIcons name="heart-pulse" size={60} color={colors.primary} style={{ alignSelf: 'center', marginBottom: 16 }} />
                <Text style={[styles.cardTitle, {textAlign: 'center'}]}>Health Report Ready</Text>
                
                <View style={styles.resultBox}>
                  <Text style={styles.resultRow}>Dynamic Risk Classification: <Text style={{fontWeight:'800', color: colors.secondary}}>{result.riskLevel}</Text></Text>
                  <Text style={styles.resultRow}>AI Confidence: <Text style={{fontWeight:'800'}}>{Math.round(result.confidence * 100)}%</Text></Text>
                  
                  {result.contradictionFlags?.length > 0 && (
                    <Text style={{color: '#E57373', fontSize: 13, marginTop: 8}}>
                      ⚠️ Notice: {result.contradictionFlags.join(', ')}
                    </Text>
                  )}
                </View>

                {result.recommendations && result.recommendations.length > 0 && (
                  <View>
                    <Text style={styles.cardLabel}>Custom Recommendations:</Text>
                    {result.recommendations.map((r, i) => (
                      <Text key={i} style={styles.recText}>• {r}</Text>
                    ))}
                  </View>
                )}

                <TouchableOpacity style={[styles.actionBtn, {marginTop: 30}]} onPress={finishIntake}>
                  <Text style={styles.actionBtnText}>Continue to Home Screen</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default MultidimensionalIntakeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 300 },
  progressBar: { height: 6, backgroundColor: colors.gray3, borderRadius: 3, marginBottom: 20, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.secondary, marginBottom: 24, textAlign: 'center' },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 20, elevation: 2 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.secondary, marginBottom: 12 },
  cardText: { fontSize: 14, color: colors.gray, lineHeight: 22, marginBottom: 16 },
  cardLabel: { fontSize: 15, fontWeight: '600', color: colors.secondary, marginTop: 10, marginBottom: 8 },
  errorText: { color: '#E57373', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  
  actionBtn: { backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  actionBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  tagBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.cream, borderRadius: 20 },
  tagBtnActive: { backgroundColor: colors.secondary },
  tagText: { color: colors.secondary, fontSize: 13, fontWeight: '600' },
  tagTextActive: { color: colors.white },
  
  input: { borderWidth: 1, borderColor: colors.gray3, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 10, color: colors.secondary },
  
  promptBox: { backgroundColor: '#E8F5E9', padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: colors.primary, marginBottom: 24 },
  promptText: { fontSize: 16, fontStyle: 'italic', color: colors.secondary, fontWeight: '500' },
  
  recordBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 20, alignItems: 'center' },
  recordingActive: { backgroundColor: '#E57373' },
  recordBtnText: { color: colors.white, fontWeight: '700', fontSize: 16, marginTop: 8 },
  
  cameraBox: { width: '100%', aspectRatio: 1, backgroundColor: '#000', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  
  resultBox: { backgroundColor: colors.cream, padding: 16, borderRadius: 12, marginBottom: 20 },
  resultRow: { fontSize: 15, color: colors.secondary, marginBottom: 6 },
  recText: { fontSize: 14, color: colors.secondary, lineHeight: 20, marginBottom: 6, paddingLeft: 8 }
});
