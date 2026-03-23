import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import { OnlineProvider } from './context/OnlineContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <SocketProvider>
          <OnlineProvider>
            <App />
          </OnlineProvider>
        </SocketProvider>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
);