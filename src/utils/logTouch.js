/**
 * Central logging for app events so every touch/screen change is visible in Metro terminal.
 * Use logTouch() for button/card presses, and navigation listeners for screen/tab focus.
 */
const PREFIX = '[APP]';

export function logTouch(eventName, extra = null) {
  const payload = extra != null ? { eventName, ...extra } : { eventName };
  console.log(PREFIX, 'TOUCH', payload);
}

export function logScreen(screenName, params = null) {
  if (params && Object.keys(params).length > 0) {
    console.log(PREFIX, 'SCREEN', screenName, params);
  } else {
    console.log(PREFIX, 'SCREEN', screenName);
  }
}

export function logTab(tabName) {
  console.log(PREFIX, 'TAB', tabName);
}
