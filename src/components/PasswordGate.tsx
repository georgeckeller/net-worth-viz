import React, { useState, useEffect } from 'react';
import { reportError, reportWarning } from '../services/error.service';

interface PasswordGateProps {
  onLogin: (password: string) => Promise<boolean>;
  isBiometricsAvailable: boolean;
  isBiometricsEnabled: boolean;
  onLoginWithBiometrics: () => Promise<boolean>;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({
  onLogin,
  isBiometricsAvailable,
  isBiometricsEnabled,
  onLoginWithBiometrics
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Default to hiding password if bio is enabled
  const [showPassword, setShowPassword] = useState(!isBiometricsEnabled);

  // Auto-prompt logic
  useEffect(() => {
    let mounted = true;

    const autoTrigger = async () => {
      if (isBiometricsAvailable && isBiometricsEnabled) {
        setShowPassword(false);
        setLoading(true);
        try {
          const success = await onLoginWithBiometrics();
          if (!mounted) return;

          if (!success) {
            reportWarning('Auto-biometric login failed or cancelled', { component: 'PasswordGate', action: 'autoTrigger' });
            setLoading(false);
            setShowPassword(true);
          }
        } catch (err) {
          if (!mounted) return;
          reportError(err, { component: 'PasswordGate', action: 'autoTrigger' });
          setLoading(false);
          setShowPassword(true);
        }
      } else {
        setShowPassword(true);
      }
    };

    autoTrigger();

    return () => { mounted = false; };
  }, [isBiometricsAvailable, isBiometricsEnabled, onLoginWithBiometrics]);

  const handleBiometricLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const success = await onLoginWithBiometrics();
      if (!success) {
        reportWarning('Manual biometric login failed or cancelled', { component: 'PasswordGate', action: 'handleBiometricLogin' });
        setLoading(false);
        setShowPassword(true);
      }
    } catch (err) {
      reportError(err, { component: 'PasswordGate', action: 'handleBiometricLogin' });
      setLoading(false);
      setShowPassword(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await onLogin(password);

      if (!success) {
        setError('Incorrect password');
        setPassword('');
      }
    } catch (err) {
      // Show actual error message to help debug
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      reportError(err, { component: 'PasswordGate', action: 'handleSubmit' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: 'var(--spacing-lg)',
      }}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          padding: 'var(--spacing-2xl)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          maxWidth: '400px',
          width: '100%',
        }}
      >
        <h2 style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
          Net Worth Dashboard
        </h2>

        {/* Biometrics Loading State */}
        {!showPassword && isBiometricsAvailable && isBiometricsEnabled && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-lg)', padding: 'var(--spacing-xl) 0' }}>
            <div className="spinner" style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--bg-tertiary)',
              borderTopColor: 'var(--success)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ color: 'var(--text-secondary)' }} aria-live="polite">Scanning fingerprint...</p>

            <button
              onClick={() => {
                setLoading(false);
                setShowPassword(true);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-tertiary)',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '0.875rem',
                marginTop: 'var(--spacing-md)'
              }}
            >
              Use password instead
            </button>
          </div>
        )}

        {/* Password View (Fallback) */}
        {showPassword && (
          <form onSubmit={handleSubmit} className="fade-in">
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-sm)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                }}
              >
                Enter Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoFocus
                aria-describedby={error ? 'password-error' : undefined}
                aria-invalid={!!error}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  background: 'var(--bg-tertiary)',
                  border: '2px solid transparent',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--success)')}
                onBlur={(e) => (e.target.style.borderColor = 'transparent')}
              />
            </div>

            {error && (
              <div
                id="password-error"
                role="alert"
                style={{
                  padding: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-lg)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--error)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--error)',
                  fontSize: '0.875rem',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                background: loading || !password ? 'var(--bg-tertiary)' : 'var(--success)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                transition: 'all 0.2s',
                opacity: loading || !password ? 0.5 : 1,
                cursor: loading || !password ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!loading && password) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {loading ? 'Verifying...' : 'Unlock with Password'}
            </button>

            {isBiometricsAvailable && isBiometricsEnabled && (
              <button
                type="button"
                onClick={handleBiometricLogin}
                style={{
                  width: '100%',
                  marginTop: 'var(--spacing-md)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Retry biometric login
              </button>
            )}
          </form>
        )}

        <p
          style={{
            marginTop: 'var(--spacing-lg)',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
          }}
        >
          Secure Dashboard
        </p>
      </div>
    </div>
  );
};
