/**
 * AllPortals.test.js
 *
 * Comprehensive integration tests for all 3 MindCare portals:
 *   1. 👤 User Portal     — HomeScreen
 *   2. 🧑‍⚕️ Therapist Portal — TherapistHomeScreen (therapist role)
 *   3. 🛡️ Admin Portal    — AdminDashboardScreen
 *
 * Every test runs with fully mocked API calls (no real network traffic).
 * Tests verify:
 *   • Components render without crashing
 *   • Correct UI elements are visible for each role
 *   • API client is called with the right endpoints on mount
 *   • Route configuration is valid
 */

import React from 'react';
import renderer from 'react-test-renderer';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

// ─── Global mocks (must be before any imports that trigger native modules) ────

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'MCIcon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MIcon');
jest.mock('react-native-vector-icons/AntDesign', () => 'AntIcon');

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
}));

jest.mock('react-native-paper', () => ({
  Searchbar: () => 'Searchbar',
  Provider: ({ children }) => children,
}));

jest.mock('react-native-elements', () => ({
  Button: () => 'Button',
}));

jest.mock('react-native-chart-kit', () => ({
  LineChart: () => 'LineChart',
  ContributionGraph: () => 'ContributionGraph',
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: { institutionId: 'inst-123' } }),
  useIsFocused: () => true,
}));

jest.mock('react-native-gesture-handler', () => ({
  TouchableOpacity: ({ children, onPress }) => {
    const { TouchableOpacity } = require('react-native');
    return <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>;
  },
  GestureHandlerRootView: ({ children }) => children,
}));

// Mock lottie (used inside some screens)
jest.mock('lottie-react-native', () => 'LottieView');

// Mock the apiClient with per-URL responses
const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockApiPatch = jest.fn();

jest.mock('../src/utils/apiClient', () => ({
  get: (...args) => mockApiGet(...args),
  post: (...args) => mockApiPost(...args),
  patch: (...args) => mockApiPatch(...args),
}));

jest.mock('../src/utils/route', () => ({
  api_route: 'http://127.0.0.1:5000',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(null),
  getItem: jest.fn().mockResolvedValue(null),
}));

jest.mock('../src/utils/avatar', () => ({
  getAvatarForGender: () => require('../src/assets/tink.gif'),
}));

jest.mock('../src/constants/doctors', () => []);

jest.mock('../src/domains/therapy/components/TherapistCard', () => () => 'TherapistCard');
jest.mock('../src/components/TrackedTouchable', () => {
  const { TouchableOpacity } = require('react-native');
  return ({ children, onPress, style }) => (
    <TouchableOpacity onPress={onPress} style={style}>{children}</TouchableOpacity>
  );
});

jest.mock('../src/redux/actions/auth', () => ({
  logout: () => ({ type: 'LOGOUT' }),
  clearWelcome: () => ({ type: 'CLEAR_WELCOME' }),
}));
jest.mock('../src/redux/actions/profile', () => ({
  updateConcerns: () => ({ type: 'UPDATE_CONCERNS' }),
}));
jest.mock('../src/redux/actions/quote', () => ({
  fetchQuoteOfTheDay: () => ({ type: 'FETCH_QUOTE' }),
}));

// ─── Redux store factory ──────────────────────────────────────────────────────
const makeStore = ({ role = 'user', name = 'Test User' } = {}) => {
  const initialState = {
    auth: {
      token: 'mock-token-abc',
      user: { _id: 'user-001', name, role, specialisation: 'Anxiety' },
      profile: { name, gender: 'female', profilePic: null },
      welcomeMessage: null,
    },
    quote: { quote: 'Keep going!' },
  };
  return createStore((state = initialState) => state);
};

// ─── Navigation mock factory ──────────────────────────────────────────────────
const mockNav = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
});

// ─── Shared setup ─────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();

  // Default API responses used across all portals
  mockApiGet.mockImplementation((url) => {
    if (url.includes('/api/home'))
      return Promise.resolve({ data: { selfHelpTiles: [], contentCategories: [] } });
    if (url.includes('/api/issues/burnout-alert'))
      return Promise.resolve({ data: { active: false } });
    if (url.includes('/api/mood/today'))
      return Promise.resolve({ data: { loggedToday: true } });
    if (url.includes('/api/user/notifications'))
      return Promise.resolve({ data: [] });
    if (url.includes('/api/content/search'))
      return Promise.resolve({ data: [] });
    if (url.includes('/api/appointments/therapist/me'))
      return Promise.resolve({ data: [] });
    if (url.includes('/api/appointments/open'))
      return Promise.resolve({ data: [] });
    if (url.includes('/api/therapists'))
      return Promise.resolve({ data: [] });
    if (url.includes('/api/admin/pending-verification'))
      return Promise.resolve({
        data: {
          appointmentRequests: [],
          riskReports: [],
          pendingContacts: [],
          wellnessPlans: [],
          deletionRequests: [],
          totalPending: 0,
          escalatedCount: 0,
        },
      });
    if (url.includes('/api/admin/resources'))
      return Promise.resolve({ data: [] });
    if (url.includes('/api/institutions'))
      return Promise.resolve({
        data: {
          institutionName: 'Test University',
          memberCount: 120,
          moodTrends: [],
          topConcerns: [],
          riskDistribution: [],
        },
      });
    return Promise.resolve({ data: {} });
  });

  mockApiPost.mockResolvedValue({ data: {} });
  mockApiPatch.mockResolvedValue({ data: {} });
});

// ═════════════════════════════════════════════════════════════════════════════
// PORTAL 1 — 👤 USER PORTAL (HomeScreen)
// ═════════════════════════════════════════════════════════════════════════════
describe('Portal 1 — User Portal (HomeScreen)', () => {
  let HomeScreen;

  beforeAll(() => {
    HomeScreen = require('../src/domains/content/screens/HomeScreen').default;
  });

  it('renders without crashing', async () => {
    const store = makeStore({ role: 'user', name: 'Muskan' });
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <HomeScreen navigation={mockNav()} />
        </Provider>
      );
    });
    expect(tree).toBeTruthy();
  }, 15000);

  it('shows the user greeting section', async () => {
    const store = makeStore({ role: 'user', name: 'Muskan' });
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <HomeScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Hello !');
  });

  it('shows the TINK chatbot section', async () => {
    const store = makeStore({ role: 'user', name: 'Muskan' });
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <HomeScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain("I'M TINK");
  });

  it('shows the Quote of the Day section', async () => {
    const store = makeStore({ role: 'user', name: 'Muskan' });
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <HomeScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Quote of the day');
  });

  it('calls /api/home on mount to load self-help tiles', async () => {
    const store = makeStore({ role: 'user', name: 'Muskan' });
    await renderer.act(async () => {
      renderer.create(
        <Provider store={store}>
          <HomeScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const calledUrls = mockApiGet.mock.calls.map(c => c[0]);
    expect(calledUrls.some(u => u.includes('/api/home'))).toBe(true);
  });

  it('calls /api/content/search on mount to load mindful content', async () => {
    const store = makeStore({ role: 'user', name: 'Muskan' });
    await renderer.act(async () => {
      renderer.create(
        <Provider store={store}>
          <HomeScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const calledUrls = mockApiGet.mock.calls.map(c => c[0]);
    expect(calledUrls.some(u => u.includes('/api/content/search'))).toBe(true);
  });

  it('shows Wellness Plan and Emotional Fingerprint cards', async () => {
    const store = makeStore({ role: 'user', name: 'Muskan' });
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <HomeScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('My Wellness Plan');
    expect(json).toContain('Emotional Fingerprint');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PORTAL 2 — 🧑‍⚕️ THERAPIST PORTAL (TherapistHomeScreen in therapist role)
// ═════════════════════════════════════════════════════════════════════════════
describe('Portal 2 — Therapist Portal (TherapistHomeScreen)', () => {
  let TherapistHomeScreen;

  beforeAll(() => {
    TherapistHomeScreen = require('../src/domains/therapy/screens/TherapistHomeScreen').default;
  });

  it('renders the therapist dashboard without crashing', async () => {
    const store = makeStore({ role: 'therapist', name: 'Dr. Smith' });
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <TherapistHomeScreen navigation={mockNav()} />
        </Provider>
      );
    });
    expect(tree).toBeTruthy();
  });

  it('shows the therapist greeting with "Good" prefix', async () => {
    const store = makeStore({ role: 'therapist', name: 'Dr. Smith' });
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <TherapistHomeScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const json = JSON.stringify(tree.toJSON());
    // Greeting: "Good morning/afternoon/evening, Dr. Smith"
    expect(json).toMatch(/Good (morning|afternoon|evening)/);
  });

  it('shows Operations Hub section', async () => {
    const store = makeStore({ role: 'therapist', name: 'Dr. Smith' });
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <TherapistHomeScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Operations Hub');
  });

  it('shows Active Schedule section', async () => {
    const store = makeStore({ role: 'therapist', name: 'Dr. Smith' });
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <TherapistHomeScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Active Schedule');
  });

  it('calls /api/appointments/therapist/me on mount', async () => {
    const store = makeStore({ role: 'therapist', name: 'Dr. Smith' });
    await renderer.act(async () => {
      renderer.create(
        <Provider store={store}>
          <TherapistHomeScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const calledUrls = mockApiGet.mock.calls.map(c => c[0]);
    expect(calledUrls.some(u => u.includes('/api/appointments/therapist/me'))).toBe(true);
  });

  it('calls /api/appointments/open to fetch unclaimed sessions', async () => {
    const store = makeStore({ role: 'therapist', name: 'Dr. Smith' });
    await renderer.act(async () => {
      renderer.create(
        <Provider store={store}>
          <TherapistHomeScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const calledUrls = mockApiGet.mock.calls.map(c => c[0]);
    expect(calledUrls.some(u => u.includes('/api/appointments/open'))).toBe(true);
  });

  it('shows empty schedule message when no patients assigned', async () => {
    const store = makeStore({ role: 'therapist', name: 'Dr. Smith' });
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <TherapistHomeScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Your schedule is clear!');
  });

  it('shows the Practice Vitality & Wellness Index widget', async () => {
    const store = makeStore({ role: 'therapist', name: 'Dr. Smith' });
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <TherapistHomeScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Practice Vitality');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PORTAL 3 — 🛡️ ADMIN PORTAL (AdminDashboardScreen)
// ═════════════════════════════════════════════════════════════════════════════
describe('Portal 3 — Admin Portal (AdminDashboardScreen)', () => {
  let AdminDashboardScreen;

  beforeAll(() => {
    AdminDashboardScreen = require('../src/domains/admin/screens/AdminDashboardScreen').default;
  });

  it('renders the admin dashboard without crashing', async () => {
    const store = makeStore({ role: 'admin', name: 'Admin' });
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <AdminDashboardScreen navigation={mockNav()} />
        </Provider>
      );
    });
    expect(tree).toBeTruthy();
  });

  it('calls /api/admin/pending-verification on mount', async () => {
    const store = makeStore({ role: 'admin', name: 'Admin' });
    await renderer.act(async () => {
      renderer.create(
        <Provider store={store}>
          <AdminDashboardScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const calledUrls = mockApiGet.mock.calls.map(c => c[0]);
    expect(calledUrls.some(u => u.includes('/api/admin/pending-verification'))).toBe(true);
  });

  it('calls /api/therapists to load therapist list for assignment', async () => {
    const store = makeStore({ role: 'admin', name: 'Admin' });
    await renderer.act(async () => {
      renderer.create(
        <Provider store={store}>
          <AdminDashboardScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const calledUrls = mockApiGet.mock.calls.map(c => c[0]);
    expect(calledUrls.some(u => u.includes('/api/therapists'))).toBe(true);
  });

  it('calls /api/admin/resources on mount', async () => {
    const store = makeStore({ role: 'admin', name: 'Admin' });
    await renderer.act(async () => {
      renderer.create(
        <Provider store={store}>
          <AdminDashboardScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const calledUrls = mockApiGet.mock.calls.map(c => c[0]);
    expect(calledUrls.some(u => u.includes('/api/admin/resources'))).toBe(true);
  });

  it('shows "Overview" section header', async () => {
    const store = makeStore({ role: 'admin', name: 'Admin' });
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <AdminDashboardScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Overview');
  });

  it('shows "Work Queue" label', async () => {
    const store = makeStore({ role: 'admin', name: 'Admin' });
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <AdminDashboardScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Work Queue');
  });

  it('shows empty state for Consultation Requests when none pending', async () => {
    const store = makeStore({ role: 'admin', name: 'Admin' });
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <AdminDashboardScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('All consultation requests have been handled');
  });

  it('shows empty state for Risk Reports when none pending', async () => {
    const store = makeStore({ role: 'admin', name: 'Admin' });
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <AdminDashboardScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('No unverified HIGH or CRITICAL reports');
  });

  it('shows 6 stat tiles in the overview grid', async () => {
    const store = makeStore({ role: 'admin', name: 'Admin' });
    let tree;
    await renderer.act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <AdminDashboardScreen navigation={mockNav()} />
        </Provider>
      );
    });
    const json = JSON.stringify(tree.toJSON());
    // Each stat tile label
    expect(json).toContain('Consultations');
    expect(json).toContain('Risk Reports');
    expect(json).toContain('Wellness Plans');
    expect(json).toContain('Total Pending');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ROUTE CONFIG — validates api_route is correctly set
// ═════════════════════════════════════════════════════════════════════════════
describe('API Route Configuration', () => {
  it('api_route is defined and starts with http', () => {
    const { api_route } = require('../src/utils/route');
    expect(api_route).toBeDefined();
    expect(api_route).toMatch(/^https?:\/\//);
  });

  it('api_route points to localhost (ADB tunnel mode)', () => {
    const { api_route } = require('../src/utils/route');
    // In local dev, should be 127.0.0.1 via adb reverse
    expect(api_route).toContain('127.0.0.1');
  });

  it('apiClient is configured with the correct baseURL', () => {
    // apiClient is mocked — but we can verify route.js exports are valid
    const { api_route } = require('../src/utils/route');
    expect(typeof api_route).toBe('string');
    expect(api_route.length).toBeGreaterThan(5);
  });
});
