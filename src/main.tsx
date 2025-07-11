import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  // Hide the loader after the app is rendered
  const loader = document.getElementById('app-loader');
  if (loader) {
    // Start the fade-out transition
    loader.classList.add('fade-out');
    // Remove the loader from the DOM after the transition is complete
    setTimeout(() => {
      loader.style.display = 'none';
    }, 500); // Should match the CSS transition duration
  }
}