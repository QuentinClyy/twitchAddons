import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BadgePage } from '../../modules/valorant/BadgePage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <BadgePage />
  </StrictMode>,
);
