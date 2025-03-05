import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './AuthContext'; // AuthProvider 추가

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: false }}>
        <AuthProvider>
            <App />
        </AuthProvider>
    </BrowserRouter>
  // </React.StrictMode>
);

reportWebVitals();