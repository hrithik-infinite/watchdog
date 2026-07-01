// Standalone-preview chrome stub. DEV-gated inside the module, so it is
// tree-shaken out of the production bundle; kept as the first import so the stub
// is installed before the app's module graph evaluates in dev.
import './mock-chrome';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import '../styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
