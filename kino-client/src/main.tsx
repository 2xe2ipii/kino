import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext'; // <--- This was missing

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>  {/* <--- Wraps the App so context works */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
);