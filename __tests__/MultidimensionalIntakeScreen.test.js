/**
 * MultidimensionalIntakeScreen.test.js
 *
 * Unit tests for the MultidimensionalIntakeScreen component.
 * The screen uses useSpeechToText (not @react-native-voice/voice directly),
 * AudioRecorderPlayer, VisionCamera, and the apiClient.
 */
import React from 'react';
import renderer from 'react-test-renderer';
import MultidimensionalIntakeScreen from '../src/domains/assessment/screens/MultidimensionalIntakeScreen';

// ── Mock all native dependencies ─────────────────────────────────────────────

jest.mock('../src/domains/assessment/hooks/useSpeechToText', () => () => ({
  isListening: false,
  sttError: '',
  startListening: jest.fn(),
  stopListening: jest.fn().mockResolvedValue('test transcript'),
  reset: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(null),
  getItem: jest.fn().mockResolvedValue(null),
}));

jest.mock('../src/utils/apiClient', () => ({
  post: jest.fn().mockResolvedValue({
    data: {
      sessionId: 'test-session-123',
      questions: {
        textPrompts: ['How are you feeling today?', 'What is causing you stress?'],
      },
    },
  }),
  get: jest.fn().mockResolvedValue({ data: {} }),
}));

jest.mock('react-native-vision-camera', () => ({
  Camera: () => 'Camera',
  useCameraDevice: () => ({ id: 'front' }),
  useCameraPermission: () => ({ hasPermission: true, requestPermission: jest.fn() }),
}));

jest.mock('@react-native-ml-kit/face-detection', () => ({
  detect: jest.fn().mockResolvedValue([]),
}));

jest.mock('react-native-audio-recorder-player', () => {
  return jest.fn().mockImplementation(() => ({
    startRecorder: jest.fn().mockResolvedValue('/tmp/audio.mp4'),
    stopRecorder: jest.fn().mockResolvedValue('/tmp/audio.mp4'),
    addRecordBackListener: jest.fn(),
    removeRecordBackListener: jest.fn(),
  }));
});

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

jest.mock('../src/constants/theme', () => ({
  colors: {
    primary: '#74B35B',
    secondary: '#2E4057',
    white: '#FFFFFF',
    cream: '#F8F5F0',
    gray: '#888',
    gray3: '#EEE',
    accent: '#A8D5BA',
  },
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MultidimensionalIntakeScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the intake intro card at step 0 without crashing', () => {
    let tree;
    renderer.act(() => {
      tree = renderer.create(
        <MultidimensionalIntakeScreen navigation={mockNavigation} />
      );
    });
    expect(tree).toBeTruthy();
    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });

  it('displays the "I Agree, Start Scan" button on initial render', () => {
    let tree;
    renderer.act(() => {
      tree = renderer.create(
        <MultidimensionalIntakeScreen navigation={mockNavigation} />
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('I Agree, Start Scan');
  });

  it('displays the header title "Advanced Health Sync"', () => {
    let tree;
    renderer.act(() => {
      tree = renderer.create(
        <MultidimensionalIntakeScreen navigation={mockNavigation} />
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Advanced Health Sync');
  });

  it('shows "Daily Multidimensional Check-in" card title on step 0', () => {
    let tree;
    renderer.act(() => {
      tree = renderer.create(
        <MultidimensionalIntakeScreen navigation={mockNavigation} />
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Daily Multidimensional Check-in');
  });

  it('shows a "Skip for now" option on the intro screen', () => {
    let tree;
    renderer.act(() => {
      tree = renderer.create(
        <MultidimensionalIntakeScreen navigation={mockNavigation} />
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Skip for now');
  });
});
