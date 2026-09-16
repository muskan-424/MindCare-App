/**
 * WellbeingCheckInScreen.test.js
 *
 * The check-in feeds the burnout model, so the answers it posts must match the
 * backend contract (PHQ-4 items 0–3, lifestyle scales 1–5).
 */
import React from 'react';
import renderer from 'react-test-renderer';
import api from '../src/utils/apiClient';
import WellbeingCheckInScreen, { PHQ4_ITEMS, SCALE_ITEMS } from '../src/domains/wellness/screens/WellbeingCheckInScreen';

jest.mock('../src/utils/apiClient', () => ({
  post: jest.fn(),
}));

jest.mock('../src/utils/i18n', () => {
  const translations = require('../src/localization/translations').default;
  const resolve = (path, obj) => path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  return () => ({ language: 'en', t: (key) => resolve(key, translations.en) ?? key });
});

const en = require('../src/localization/translations').default.en;

function render() {
  const navigation = { navigate: jest.fn(), goBack: jest.fn(), getParent: jest.fn(() => ({ navigate: jest.fn() })) };
  let tree;
  renderer.act(() => {
    tree = renderer.create(<WellbeingCheckInScreen navigation={navigation} />);
  });
  return { tree, navigation };
}

const press = (tree, testID) => renderer.act(() => {
  tree.root.findByProps({ testID }).props.onPress();
});

const answerAll = (tree, phqValue, scaleValue) => {
  PHQ4_ITEMS.forEach((id) => press(tree, `checkin-${id}-${phqValue}`));
  SCALE_ITEMS.forEach((id) => press(tree, `checkin-${id}-${scaleValue}`));
};

describe('WellbeingCheckInScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('asks the four PHQ-4 questions and five lifestyle scales', () => {
    const { tree } = render();
    const text = JSON.stringify(tree.toJSON());
    PHQ4_ITEMS.forEach((id) => expect(text).toContain(en.checkin[`q_${id}`]));
    SCALE_ITEMS.forEach((id) => expect(text).toContain(en.checkin[`scale_${id}`]));
  });

  it('does not submit until every question is answered', async () => {
    const { tree } = render();
    press(tree, 'checkin-nervous-1');
    await renderer.act(async () => {
      await tree.root.findByProps({ testID: 'checkin-submit' }).props.onPress();
    });
    expect(api.post).not.toHaveBeenCalled();
    expect(JSON.stringify(tree.toJSON())).toContain(en.checkin.incomplete);
  });

  it('posts the answers and shows crisis help for a severe result', async () => {
    api.post.mockResolvedValue({ data: { severity: 'severe', total: 12 } });
    const { tree, navigation } = render();
    answerAll(tree, 3, 5);
    await renderer.act(async () => {
      await tree.root.findByProps({ testID: 'checkin-submit' }).props.onPress();
    });

    expect(api.post).toHaveBeenCalledWith('/api/profile/wellbeing-checkin', {
      nervous: 3, worrying: 3, interest: 3, down: 3,
      stress: 5, pressure: 5, sleep: 5, activity: 5, social: 5,
    });
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain(en.checkin.result_severe);
    expect(text).toContain(en.checkin.crisis_help);

    let crisisButton = tree.root.findAll((node) => node.props.children === en.checkin.crisis_help)[0];
    while (crisisButton && !crisisButton.props.onPress) crisisButton = crisisButton.parent;
    renderer.act(() => crisisButton.props.onPress());
    expect(navigation.navigate).toHaveBeenCalledWith('CrisisResources');
  });

  it('shows a calm result without crisis help for a normal score', async () => {
    api.post.mockResolvedValue({ data: { severity: 'normal', total: 0 } });
    const { tree } = render();
    answerAll(tree, 0, 3);
    await renderer.act(async () => {
      await tree.root.findByProps({ testID: 'checkin-submit' }).props.onPress();
    });
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain(en.checkin.result_normal);
    expect(text).not.toContain(en.checkin.crisis_help);
  });
});
