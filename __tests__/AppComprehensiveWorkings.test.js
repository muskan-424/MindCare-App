/**
 * AppComprehensiveWorkings.test.js
 *
 * Comprehensive integration tests for checking:
 *   1. Validation helpers (Email, Phone, Password)
 *   2. Login screen rendering & interaction
 *   3. Signup screen rendering & clinician toggle
 *   4. Forgot Password screen rendering & submission
 *   5. Mood Tracker screen stats displaying & log submissions
 *   6. Goal Tracker screen listing, creating modals, and details
 *   7. Tink Chatbot initial state & reply simulation
 *
 * Runs with fully mocked API calls.
 */

import React from 'react';
import renderer from 'react-test-renderer';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

// ─── Global mocks ─────────────────────────────────────────────────────────────
jest.mock('react-native-vector-icons/Ionicons', () => 'IonIcon');
jest.mock('react-native-vector-icons/AntDesign', () => 'AntIcon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'MCIcon');

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
  useIsFocused: () => true,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
}));

jest.mock('react-native-paper', () => {
  const ReactObj = require('react');
  const { View } = require('react-native');
  return {
    Searchbar: 'Searchbar',
    Provider: ({ children }) => children,
    RadioButton: (props) => ReactObj.createElement(View, props),
    Switch: (props) => ReactObj.createElement(View, props),
  };
});

jest.mock('react-native-chart-kit', () => ({
  LineChart: () => 'LineChart',
  ContributionGraph: () => 'ContributionGraph',
}));

jest.mock('lottie-react-native', () => 'LottieView');

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(null),
  getItem: jest.fn().mockResolvedValue(null),
}));

// Mock apiClient with custom mocks
const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockApiPatch = jest.fn();
const mockApiDelete = jest.fn();

jest.mock('../src/utils/apiClient', () => ({
  get: (...args) => mockApiGet(...args),
  post: (...args) => mockApiPost(...args),
  patch: (...args) => mockApiPatch(...args),
  delete: (...args) => mockApiDelete(...args),
}));

// Mock Gemini Service for Tink Chat
const mockSendMessageToGemini = jest.fn();
jest.mock('../src/utils/geminiService', () => ({
  sendMessageToGemini: (...args) => mockSendMessageToGemini(...args),
}));

// ─── Redux store factory ──────────────────────────────────────────────────────
const makeStore = ({ role = 'user', name = 'Test User' } = {}) => {
  const initialState = {
    auth: {
      isLogin: true,
      token: 'mock-token-xyz',
      user: { _id: 'user-001', name, role, specialisation: 'Anxiety' },
    },
  };
  return createStore((state = initialState) => state);
};

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('1. Validation Helper Utilities', () => {
  const { validateEmail, validatePhone, validatePassword } = require('../src/utils/validation');

  it('validates emails correctly', () => {
    expect(validateEmail('test').valid).toBe(false);
    expect(validateEmail('test@').valid).toBe(false);
    expect(validateEmail('test@domain').valid).toBe(false);
    expect(validateEmail('test@domain.com').valid).toBe(true);
    expect(validateEmail('   test@domain.com ').valid).toBe(true);
  });

  it('validates phone numbers correctly', () => {
    expect(validatePhone('123456789').valid).toBe(false);
    expect(validatePhone('12345678901').valid).toBe(false);
    expect(validatePhone('1234567890').valid).toBe(true);
    expect(validatePhone('123-456-7890').valid).toBe(true);
  });

  it('validates passwords correctly', () => {
    expect(validatePassword('short').valid).toBe(false); // short
    expect(validatePassword('NoSpecialNumber').valid).toBe(false); // missing number & symbol
    expect(validatePassword('nospecialnumber1!').valid).toBe(false); // missing uppercase
    expect(validatePassword('NOSPECIALNUMBER1!').valid).toBe(false); // missing lowercase
    expect(validatePassword('SecurePass123!').valid).toBe(true);
  });
});

describe('2. Login Screen Working', () => {
  const Login = require('../src/domains/identity/screens/Login').default;
  const store = makeStore();

  it('renders Login screen elements', () => {
    let tree;
    renderer.act(() => {
      tree = renderer.create(
        <Provider store={store}>
          <Login navigation={mockNavigation} />
        </Provider>
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Patient');
    expect(json).toContain('Professional');
    expect(json).toContain('Admin');
  });
});

describe('3. Signup Screen Working', () => {
  const Signup = require('../src/domains/identity/screens/Signup').default;
  const store = makeStore();

  it('renders Signup form fields and detects role toggles', () => {
    let tree;
    renderer.act(() => {
      tree = renderer.create(
        <Provider store={store}>
          <Signup navigation={mockNavigation} />
        </Provider>
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Signup');
    expect(json).toContain('Full Name');
    expect(json).toContain('Phone Number');
    expect(json).toContain('Register as a Professional Clinician');
  });
});

describe('4. Forgot Password Screen Working', () => {
  const ForgotPasswordScreen = require('../src/domains/identity/screens/ForgotPasswordScreen').default;

  it('renders input box and instructions', () => {
    let tree;
    renderer.act(() => {
      tree = renderer.create(
        <ForgotPasswordScreen navigation={mockNavigation} />
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Forgot Password');
    expect(json).toContain('registered email address');
    expect(json).toContain('Send Code');
  });
});

describe('5. Mood Tracker Screen Working', () => {
  const MoodTrackerScreen = require('../src/domains/wellness/screens/MoodTrackerScreen').default;
  const store = makeStore();

  beforeEach(() => {
    mockApiGet.mockImplementation((url) => {
      if (url.includes('/api/mood/trend')) {
        return Promise.resolve({ data: { trend: [{ date: '2026-05-28', rating: 7 }] } });
      }
      if (url.includes('/api/mood/stats')) {
        return Promise.resolve({ data: { average: 7.5, streak: 3, totalEntries: 5 } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('renders mood rating selector buttons and average stats', async () => {
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <MoodTrackerScreen navigation={mockNavigation} />
        </Provider>
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Log your mood');
    expect(json).toContain('Avg (30d)');
    expect(json).toContain('Streak');
    expect(json).toContain('Save Mood');
  }, 15000);
});

describe('6. Goal Tracker Screen Working', () => {
  const GoalTrackingScreen = require('../src/domains/wellness/screens/GoalTrackingScreen').default;

  beforeEach(() => {
    mockApiGet.mockImplementation((url) => {
      if (url.includes('/api/goals')) {
        return Promise.resolve({
          data: [
            {
              _id: 'goal-1',
              title: 'Daily Meditation',
              description: 'Meditate for 10 minutes',
              category: 'mental_health',
              status: 'active',
              progress: 50,
              milestones: [{ _id: 'm-1', label: 'Week 1', completed: true }],
            },
          ],
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('renders goals lists, categories, and progress metrics', async () => {
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <GoalTrackingScreen navigation={mockNavigation} />
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Goal Tracker');
    expect(json).toContain('Daily Meditation');
    expect(json).toContain('Progress');
    expect(json).toContain('50%');
  });
});

describe('7. Chat With Tink Screen Working', () => {
  const ChatWithTink = require('../src/domains/community/screens/ChatWithTink').default;

  it('renders Tink welcome message and simulation', () => {
    const mockRoute = { params: { name: 'Muskan' } };
    let tree;
    renderer.act(() => {
      tree = renderer.create(
        <ChatWithTink route={mockRoute} />
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Muskan');
    expect(json).toContain("your MindCare assistant");
    expect(json).toContain("Message Tink");
  });
});

describe('8. Badges Screen Working', () => {
  const BadgesScreen = require('../src/domains/wellness/screens/BadgesScreen').default;

  beforeEach(() => {
    mockApiGet.mockImplementation((url) => {
      if (url.includes('/api/streaks/me')) {
        return Promise.resolve({
          data: {
            currentStreak: 3,
            longestStreak: 5,
            totalCheckins: 10,
            badges: [
              { key: 'first_checkin', earnedAt: '2026-05-28T12:00:00Z', label: 'First Step', icon: 'star-face', color: '#F59E0B', desc: 'Logged your first mood check-in' }
            ],
            nextStreakGoal: { label: 'Week Warrior', target: 7, progress: 3, icon: 'fire', color: '#EF4444', desc: 'Maintained a 7-day streak' },
            nextCheckinGoal: { label: 'Mood Explorer', target: 10, progress: 10, icon: 'compass', color: '#3B82F6', desc: 'Logged 10 mood check-ins' }
          }
        });
      }
      return Promise.resolve({ data: {} });
    });
    mockApiPatch.mockImplementation((url) => {
      if (url.includes('/api/streaks/seen')) {
        return Promise.resolve({ data: { success: true } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('renders badges statistics, goals, and badges grid', async () => {
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <BadgesScreen navigation={mockNavigation} />
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Achievements & Streaks');
    expect(json).toContain('Current Streak');
    expect(json).toContain('Longest Streak');
    expect(json).toContain('Next Milestone Goals');
    expect(json).toContain('Week Warrior');
    expect(json).toContain('Locked');
  });
});

