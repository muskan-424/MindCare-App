export const concerns = [
  { id: '1', nameKey: 'concerns.anger', apiName: 'Anger' },
  { id: '2', nameKey: 'concerns.anxiety', apiName: 'Anxiety and Panic Attacks' },
  { id: '3', nameKey: 'concerns.depression', apiName: 'Depression' },
  { id: '4', nameKey: 'concerns.eating_disorders', apiName: 'Eating disorders' },
  { id: '5', nameKey: 'concerns.self_esteem', apiName: 'Self-esteem' },
  { id: '6', nameKey: 'concerns.self_harm', apiName: 'Self-harm' },
  { id: '7', nameKey: 'concerns.stress', apiName: 'Stress' },
  { id: '8', nameKey: 'concerns.sleep_disorders', apiName: 'Sleep disorders' },
];

/** Resolve localized concern label via t(). */
export function getConcernLabel(concern, t) {
  return t(concern.nameKey);
}

/** @deprecated use nameKey + getConcernLabel — kept for API payloads */
export function getConcernApiName(concern) {
  return concern.apiName;
}
