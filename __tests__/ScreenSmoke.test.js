/**
 * ScreenSmoke.test.js — Phase 6.2
 * Smoke tests for screens that consume shaped API responses (fitness, institutions).
 */

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Provider } from 'react-redux';
import { TouchableOpacity, Text } from 'react-native';
import makeTestStore from './helpers/makeTestStore';

function collectText(root) {
  return root.findAllByType(Text)
    .map((n) => {
      const c = n.props.children;
      if (typeof c === 'string') return c;
      if (typeof c === 'number') return String(c);
      return '';
    })
    .join(' ');
}

function findTouchableByLabel(root, label) {
  return root.findAllByType(TouchableOpacity).find((touchable) => {
    try {
      return collectText(touchable).includes(label);
    } catch (_) {
      return false;
    }
  });
}

jest.mock('react-native-vector-icons/AntDesign', () => 'AntIcon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'MCIcon');

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: { institutionId: 'inst-507f1f77bcf86cd799439011' } }),
  useIsFocused: () => true,
}));

jest.mock('react-native-animated-loader', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props) => React.createElement(View, props, props.children);
});

jest.mock('react-native-image-overlay', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ title }) => React.createElement(Text, null, title);
});

jest.mock('lottie-react-native', () => 'LottieView');

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();

jest.mock('../src/utils/apiClient', () => ({
  get: (...args) => mockApiGet(...args),
  post: (...args) => mockApiPost(...args),
}));

const SHAPED_FITNESS_CATEGORIES = {
  Yoga: { icon: 'https://cdn.example.com/yoga.png' },
  Meditation: { icon: 'https://cdn.example.com/meditation.png' },
};

const SHAPED_FITNESS_PLAN = {
  summary: 'Your personalized 3-day routine focuses on Yoga.',
  weeklySchedule: [
    {
      day: 'Monday',
      focus: 'Yoga',
      exercises: [
        { name: 'Morning flow', description: 'Gentle start', durationMinutes: 10, type: 'Yoga', youtubeId: 'v7AYKMP6rOE' },
      ],
    },
  ],
};

const SHAPED_INSTITUTION_REPORT = {
  institutionName: 'Test University',
  memberCount: 42,
  moodTrends: [{ date: '2026-06-01', value: 3.5 }],
  topConcerns: [{ concern: 'Anxiety', count: 8 }],
  riskDistribution: [{ level: 'LOW', count: 5 }],
  generatedAt: '2026-06-09T00:00:00.000Z',
};

const makeStore = makeTestStore;

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  mockApiGet.mockImplementation((url) => {
    if (url === '/api/fitness/categories') {
      return Promise.resolve({ data: SHAPED_FITNESS_CATEGORIES });
    }
    if (url.includes('/api/institutions/') && url.endsWith('/report')) {
      return Promise.resolve({ data: SHAPED_INSTITUTION_REPORT });
    }
    return Promise.resolve({ data: {} });
  });
  mockApiPost.mockImplementation((url) => {
    if (url === '/api/fitness/plan') {
      return Promise.resolve({ data: SHAPED_FITNESS_PLAN });
    }
    if (url === '/api/institutions/join') {
      return Promise.resolve({ data: { success: true, institutionName: 'Test University' } });
    }
    return Promise.resolve({ data: {} });
  });
});

describe('Fitness screens (shaped API)', () => {
  test('FitnessScreen loads category map keyed by name (no mongoose fields)', async () => {
    const FitnessScreen = require('../src/domains/wellness/screens/FitnessScreen').default;
    const store = makeStore();
    let tree;

    await act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <FitnessScreen />
        </Provider>,
      );
      await Promise.resolve();
    });

    const json = JSON.stringify(tree.toJSON());
    expect(mockApiGet).toHaveBeenCalledWith('/api/fitness/categories');
    expect(json).toContain('Fitness Coach');
    expect(json).toContain('Yoga');
    expect(json).toContain('Meditation');
    expect(json).not.toContain('"_id"');
    expect(json).not.toContain('"__v"');
  }, 15000);

  test('FitnessCoachScreen renders plan from shaped weeklySchedule', async () => {
    const FitnessCoachScreen = require('../src/domains/wellness/screens/FitnessCoachScreen').default;
    const store = makeStore();
    let tree;

    await act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <FitnessCoachScreen navigation={mockNavigation} />
        </Provider>,
      );
    });

    const generateBtn = findTouchableByLabel(tree.root, 'Generate my routine');
    expect(generateBtn).toBeTruthy();

    await act(async () => {
      generateBtn.props.onPress();
      await Promise.resolve();
      await Promise.resolve();
    });

    const text = collectText(tree.root);
    expect(mockApiPost).toHaveBeenCalledWith('/api/fitness/plan', expect.objectContaining({
      goal: expect.any(String),
      durationMinutes: expect.any(Number),
      daysPerWeek: expect.any(Number),
      preferredTypes: expect.any(Array),
    }));
    expect(text).toContain('Your routine');
    expect(text).toContain(SHAPED_FITNESS_PLAN.summary);
    expect(text).toContain('Monday');
    expect(text).toContain('Yoga');

    const mondayRow = findTouchableByLabel(tree.root, 'Monday');
    await act(async () => {
      mondayRow.props.onPress();
    });
    expect(collectText(tree.root)).toContain('Morning flow');
  });
});

describe('Institution screens (shaped API)', () => {
  test('InstitutionDashboardScreen shows institutionName and memberCount', async () => {
    const InstitutionDashboardScreen = require('../src/domains/identity/screens/InstitutionDashboardScreen').default;
    const store = makeStore();
    let tree;

    await act(async () => {
      tree = renderer.create(
        <Provider store={store}>
          <InstitutionDashboardScreen
            route={{ params: { institutionId: 'inst-507f1f77bcf86cd799439011' } }}
            navigation={mockNavigation}
          />
        </Provider>,
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    const text = collectText(tree.root);
    expect(mockApiGet).toHaveBeenCalledWith('/api/institutions/inst-507f1f77bcf86cd799439011/report');
    expect(text).toContain('Test University');
    expect(text).toContain('42');
    expect(text).toContain('Institution Oversight Dashboard');
  });
});
