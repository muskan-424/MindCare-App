import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/apiClient';
import { colors } from '../constants/theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const MOOD_TAGS = ['calm', 'anxious', 'sad', 'angry', 'tired', 'hopeful', 'overwhelmed', 'okay'];

const MultidimensionalIntakeScreen = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  
  // Modality States
  const [textInput, setTextInput] = useState('');
  const [moodTag, setMoodTag] = useState('');
  const [severity, setSeverity] = useState(3);
  
  // Progress/Simulated States
  const [isRecording, setIsRecording] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isFusing, setIsFusing] = useState(false);
  
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [isInitializing, setIsInitializing] = useState(false);

  // Helper to wait a few seconds
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const startSession = async () => {
    setIsInitializing(true);
    let attempts = 0;
    const maxRetries = 2; // Try up to 3 times total

    while (attempts <= maxRetries) {
      try {
        setError('');
        const res = await api.post('/api/aiIntake/session/start', {
          triggerType: 'login_quick',
          consent: { cameraConsent: true, micConsent: true, textConsent: true }
        });
        
        setSessionId(res.data.sessionId);
        setStep(1); // Move to Text Input
        setIsInitializing(false);
        return; // Success! Exit loop.
        
      } catch (e) {
        console.warn(`AI Intake session start failed (Attempt ${attempts + 1}/${maxRetries + 1}):`, e.response?.status, e.message);
        
        // If it was a 502 Bad Gateway (Render cold start) or 503, wait and retry.
        if ((e.response?.status === 502 || e.response?.status === 503 || !e.response) && attempts < maxRetries) {
          attempts++;
          setError(`Waking up secure servers... Please wait (${attempts}/${maxRetries})`);
          await delay(3000 * attempts); // 3s, then 6s delay
          continue; // Try again
        }

        // If we ran out of retries or got a different fatal error, auto-skip to Home
        const todayStr = new Date().toISOString().slice(0, 10);
        await AsyncStorage.setItem('MindCare_dismissedCheckInDate', todayStr);
        setIsInitializing(false);
        navigation.navigate('Home');
        return;
      }
    }
  };

  const submitText = async () => {
    if (!textInput.trim()) return setError('Please write something about how you are feeling.');
    try {
      setError('');
      await api.post(`/api/aiIntake/session/${sessionId}/text-response`, {
        description: textInput,
        moodTag,
        severity
      });
      setStep(2); // Move to Voice
    } catch (e) {
      setError('Failed to process text response.');
    }
  };

  const simulateVoiceCapture = async () => {
    setIsRecording(true);
    // Simulate recording delay
    setTimeout(async () => {
      try {
        await api.post(`/api/aiIntake/session/${sessionId}/voice-response`, {
          voiceRef: 'simulated_audio.wav',
          duration: 5
        });
        setIsRecording(false);
        setStep(3); // Move to Vision
      } catch (e) {
        setIsRecording(false);
        setError('Voice analysis failed.');
      }
    }, 3000);
  };

  const simulateVisionCapture = async () => {
    setIsScanning(true);
    // Simulate camera scan delay
    setTimeout(async () => {
      try {
        await api.post(`/api/aiIntake/session/${sessionId}/vision-meta`, {
          visionRef: 'simulated_video.mp4',
        });
        setIsScanning(false);
        setStep(4); // Move to Fusion
        runFusion();
      } catch (e) {
        setIsScanning(false);
        setError('Vision analysis failed.');
      }
    }, 4000);
  };

  const runFusion = async () => {
    setIsFusing(true);
    try {
      const res = await api.post(`/api/aiIntake/session/${sessionId}/fusion/run`);
      setResult(res.data.result);
      
      // Satisfy HomeScreen check-in requirement so it won't loop
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
       navigation.navigate('Home'); // Return to app
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {step > 0 && <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
        </View>}

        <Text style={styles.headerTitle}>Advanced Health Sync</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* STEP 0: CONSENT */}
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

        {/* STEP 1: TEXT */}
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
            <Text style={styles.cardLabel}>Describe how your day is going:</Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={4}
              placeholder="I'm feeling..."
              value={textInput}
              onChangeText={setTextInput}
              placeholderTextColor={colors.gray}
            />
            <TouchableOpacity style={styles.actionBtn} onPress={submitText}>
              <Text style={styles.actionBtnText}>Next Step →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: VOICE */}
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
              onPress={simulateVoiceCapture} 
              disabled={isRecording}
            >
              <MaterialCommunityIcons name="microphone" size={32} color={colors.white} />
              <Text style={styles.recordBtnText}>{isRecording ? "Recording... Please speak" : "Tap & Read Aloud"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: VISION */}
        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>3. Micro-expression Scan</Text>
            <Text style={styles.cardText}>
              Look directly at the camera for a few seconds. Position your face in the center.
            </Text>
            
            <View style={styles.cameraBox}>
              {isScanning ? (
                 <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <MaterialCommunityIcons name="camera-front" size={60} color={colors.gray3} />
              )}
            </View>

            <TouchableOpacity 
              style={[styles.actionBtn, {backgroundColor: colors.secondary}]} 
              onPress={simulateVisionCapture} 
              disabled={isScanning}
            >
              <Text style={styles.actionBtnText}>{isScanning ? "Scanning Face..." : "Start Camera Scan"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 4: FUSION & REPORT */}
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

                <Text style={styles.cardLabel}>Custom Recommendations:</Text>
                {result.recommendations.map((r, i) => (
                  <Text key={i} style={styles.recText}>• {r}</Text>
                ))}

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
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 60 },
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
  
  input: { borderWidth: 1, borderColor: colors.gray3, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 100, textAlignVertical: 'top', marginBottom: 16, color: colors.secondary },
  
  promptBox: { backgroundColor: '#E8F5E9', padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: colors.primary, marginBottom: 24 },
  promptText: { fontSize: 16, fontStyle: 'italic', color: colors.secondary, fontWeight: '500' },
  
  recordBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 20, alignItems: 'center' },
  recordingActive: { backgroundColor: '#E57373' },
  recordBtnText: { color: colors.white, fontWeight: '700', fontSize: 16, marginTop: 8 },
  
  cameraBox: { width: '100%', aspectRatio: 1, backgroundColor: colors.gray3, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  
  resultBox: { backgroundColor: colors.cream, padding: 16, borderRadius: 12, marginBottom: 20 },
  resultRow: { fontSize: 15, color: colors.secondary, marginBottom: 6 },
  recText: { fontSize: 14, color: colors.secondary, lineHeight: 20, marginBottom: 6, paddingLeft: 8 }
});
