import React from 'react';
import { TouchableOpacity } from 'react-native';
import { logTouch } from '../utils/logTouch';

/**
 * Wraps TouchableOpacity and logs every press to the terminal (Metro/devtools).
 * Use eventName to identify the button/card (e.g. "Home_SelfHelp_Breathing", "Therapist_Category_Psychologist").
 */
const TrackedTouchable = ({ eventName, onPress, children, ...rest }) => {
  const handlePress = (...args) => {
    logTouch(eventName || 'Unknown');
    if (onPress) onPress(...args);
  };

  return (
    <TouchableOpacity {...rest} onPress={handlePress}>
      {children}
    </TouchableOpacity>
  );
};

export default TrackedTouchable;
