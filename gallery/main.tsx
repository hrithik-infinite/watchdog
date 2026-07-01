// Installs the chrome stub + seeds the store. MUST be the first import (it runs
// at module-eval, before <Gallery> and its components are imported).
import './mock';

import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/styles/globals.css';
import Gallery from './Gallery';

// biome-ignore lint/style/noNonNullAssertion: #root is defined in gallery.html
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Gallery />
  </React.StrictMode>
);
