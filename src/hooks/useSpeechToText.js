/**
 * useSpeechToText — Production STT hook for MindCare
 *
 * Strategy (zero new native dependencies):
 *  1. Record audio with react-native-audio-recorder-player (already linked)
 *     → Uses AMR_WB encoding (16kHz, natively supported on all Android devices)
 *  2. Read the recorded .amr file as base64 via fetch + FileReader (built into RN runtime)
 *  3. POST to Google Speech-to-Text REST API using the project's GOOGLE_API_KEY
 *  4. Return the transcript string to the caller
 *
 * Flow in the screen:
 *   openSTT()  → startListening() → [user speaks] → stopSTT() → stopListening()
 *   stopListening() sets isListening=false immediately (modal shows spinner)
 *   then awaits Google STT → returns transcript → screen closes modal
 */

import { useState, useRef, useCallback } from 'react';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { GOOGLE_API_KEY } from '@env';

// Record in AAC/MP4 format which is perfectly supported by Gemini natively
const RECORDER_CONFIG = {
  AudioEncoderAndroid: 3,        // AudioEncoderAndroidType.AAC = 3
  AudioSourceAndroid: 1,         // AudioSourceAndroidType.MIC = 1
  OutputFormatAndroid: 2,        // OutputFormatAndroidType.MPEG_4 = 2  
};

// ── Utility: read a local file URI as base64 using XMLHttpRequest ──────────
const readFileAsBase64 = (filePath) => {
  // Fix React Native AudioRecorderPlayer bug where it returns 'file:////data/...'
  // 4 slashes break the Android XMLHttpRequest/fetch parser, causing Network request failed
  const uri = filePath.replace(/^file:\/*/, 'file:///');
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result ? reader.result.split(',')[1] : null;
        if (b64) resolve(b64);
        else reject(new Error('FileReader returned empty result'));
      };
      reader.onerror = (e) => reject(new Error('FileReader error: ' + e));
      reader.readAsDataURL(xhr.response); // xhr.response is a Blob
    };
    xhr.onerror = function() {
      reject(new Error(`Failed to read local file: XMLHttpRequest error on ${uri}`));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri);
    xhr.send();
  });
};

// ── Hook ─────────────────────────────────────────────────────────────────────
const useSpeechToText = () => {
  const [isListening, setIsListening]   = useState(false);
  const [sttError,    setSttError]      = useState('');
  const recorderRef = useRef(new AudioRecorderPlayer());
  const recordedPathRef = useRef(null);

  // ── Request mic permission ────────────────────────────────────────────────
  const requestMicPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const already = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      if (already) return true;
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'MindCare needs microphone access to transcribe your speech.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  // ── Start recording ───────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    setSttError('');
    recordedPathRef.current = null;

    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Microphone access is required for speech-to-text.');
      return;
    }

    try {
      // Let the recorder choose the default temp path — avoids path permission issues
      const result = await recorderRef.current.startRecorder(
        undefined,           // default path
        RECORDER_CONFIG,     // AMR_WB encoding
      );
      console.log('[STT] Recording started at:', result);
      setIsListening(true);
    } catch (e) {
      console.warn('[STT] startRecorder error:', e.message);
      setSttError('Could not start microphone: ' + e.message);
    }
  }, []);

  // ── Stop recording, then call Google STT, return transcript ──────────────
  const stopListening = useCallback(async () => {
    if (!isListening) return null;

    // Immediately flip isListening so the modal shows the spinner
    setIsListening(false);

    let audioPath = null;
    try {
      audioPath = await recorderRef.current.stopRecorder();
      recorderRef.current.removeRecordBackListener();
      console.log('[STT] Recording saved to:', audioPath);
    } catch (e) {
      console.warn('[STT] stopRecorder error:', e.message);
      setSttError('Recording failed to stop properly.');
      return null;
    }

    if (!audioPath) {
      setSttError('No audio was captured.');
      return null;
    }

// ── Transcribe via Gemini REST API ─────────────────────────────────────────
// ── Transcribe via Gemini REST API ─────────────────────────────────────────
    try {
      const apiKey = GOOGLE_API_KEY?.replace(/"/g, '') || '';
      if (!apiKey) {
        throw new Error('GOOGLE_API_KEY is not configured in .env');
      }

      console.log('[STT] Reading audio file into base64...');
      const b64Audio = await readFileAsBase64(audioPath);
      console.log('[STT] Audio encoded, sending to Gemini generateContent...');

      // Using Gemini 2.5 Flash which natively supports audio understanding
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: "You are a highly accurate speech-to-text transcriber. Transcribe the spoken audio exactly as heard. Do not add any extra commentary, notes, or conversational text. If the audio is empty or unintelligible, return an empty string." },
              {
                inlineData: {
                  mimeType: 'audio/mp4',
                  data: b64Audio
                }
              }
            ],
          }],
          generationConfig: {
            temperature: 0.1,
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data?.error?.message || `HTTP ${response.status}`;
        throw new Error('Gemini API error: ' + errMsg);
      }

      const transcript = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
      console.log('[STT] Transcript:', transcript);

      if (!transcript) {
        setSttError('Could not understand speech — please try again or type your answer.');
        return '';
      }

      return transcript;
    } catch (e) {
      console.error('[STT] Transcription error:', e.message);
      setSttError(e.message);
      return null;
    }
  }, [isListening]);

  // ── Reset state ───────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setSttError('');
    setIsListening(false);
    recordedPathRef.current = null;
  }, []);

  return {
    isListening,
    sttError,
    startListening,
    stopListening,
    reset,
  };
};

export default useSpeechToText;
