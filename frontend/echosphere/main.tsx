import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add debugging logs
console.log('React initialization starting');

try {
  const rootElement = document.getElementById('root');
  console.log('Root element found:', rootElement);
  
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    console.log('React root created');
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    console.log('React render called');
  } else {
    console.error('Root element not found in DOM');
  }
} catch (error) {
  console.error('React initialization error:', error);
}
