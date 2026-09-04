import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { CoverGenerator } from './demos/cover-generator';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CoverGenerator standalone />
  </StrictMode>,
);
