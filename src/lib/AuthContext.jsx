import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44, auth } from '@/api/base44Client';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({ id: 'dummy_app_id', public_settings: {} }); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await base44.auth.me();
          setUser(userData);
          setIsAuthenticated(true);
          setAuthError(null);
        } catch(e) {
          console.error(e);
          setUser(null);
          setIsAuthenticated(false);
          setAuthError({ type: 'auth_required' });
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: 'auth_required' });
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const checkAppState = async () => {};

  const checkUserAuth = async () => {
    if (auth.currentUser) {
       const userData = await base44.auth.me();
       setUser(userData);
    }
  };

  const logout = (shouldRedirect = true) => {
    base44.auth.logout(shouldRedirect ? window.location.href : null);
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
