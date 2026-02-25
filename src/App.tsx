import React from 'react';
import { useAuth } from './hooks/useAuth';
import { PasswordGate } from './components/PasswordGate';
import { Dashboard } from './components/Dashboard';

export const App: React.FC = () => {
  const { 
    isAuthenticated, 
    login, 
    isBiometricsAvailable, 
    isBiometricsEnabled, 
    enableBiometrics, 
    loginWithBiometrics 
  } = useAuth();

  if (!isAuthenticated) {
    return (
      <PasswordGate 
        onLogin={login} 
        isBiometricsAvailable={isBiometricsAvailable}
        isBiometricsEnabled={isBiometricsEnabled}
        onLoginWithBiometrics={loginWithBiometrics}
      />
    );
  }

  return (
    <Dashboard 
      isBiometricsAvailable={isBiometricsAvailable}
      isBiometricsEnabled={isBiometricsEnabled}
      onEnableBiometrics={enableBiometrics}
    />
  );
};
