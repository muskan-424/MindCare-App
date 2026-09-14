import React from 'react';
import {Provider} from 'react-redux';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import store from './src/redux/store';
import AuthFlow from './AuthFlow';
import ErrorBoundary from './ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <SafeAreaProvider>
          <AuthFlow />
        </SafeAreaProvider>
      </Provider>
    </ErrorBoundary>
  );
}
export default App;
