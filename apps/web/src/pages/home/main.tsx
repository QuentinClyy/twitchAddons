import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HomePage } from '../../modules/scene/HomePage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <HomePage />
  </StrictMode>,
);
