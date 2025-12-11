import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// CORS FIX: Redirect www to non-www
// The API only allows 'https://mhjoygamershub.com'. 
// If we are on 'www.', the browser blocks requests. We must redirect.
if (window.location.hostname.startsWith('www.')) {
  const newUrl = window.location.href.replace('www.', '');
  window.location.replace(newUrl);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);