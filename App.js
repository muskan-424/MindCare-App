import React from 'react';
import {Provider} from 'react-redux';
import store from './src/redux/store';
import AuthFlow from './AuthFlow';
import ErrorBoundary from './ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AuthFlow />
      </Provider>
    </ErrorBoundary>
  );
}
export default App;
