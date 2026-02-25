// Service to handle WebAuthn/Biometric authentication
import { reportWarning, reportError } from './error.service';

const CREDENTIAL_ID_KEY = 'networth_biometric_id';
const CREDENTIAL_PUBKEY_KEY = 'networth_biometric_pubkey';

// Helper to convert base64 to Uint8Array
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Helper to convert ArrayBuffer to base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return window.btoa(binary);
};

// Check if platform authenticator is available
export const isBiometricsAvailable = async (): Promise<boolean> => {
  if (!window.PublicKeyCredential) {
    return false;
  }

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (err) {
    reportWarning(err, { component: 'biometric.service', action: 'isBiometricsAvailable' });
    return false;
  }
};

// Check if biometrics are already configured for this device
export const isBiometricsConfigured = (): boolean => {
  return !!localStorage.getItem(CREDENTIAL_ID_KEY);
};

// Register a new biometric credential
export const registerBiometrics = async (): Promise<boolean> => {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const userId = new Uint8Array(16);
  crypto.getRandomValues(userId);

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'Net Worth Dashboard',
      id: window.location.hostname,
    },
    user: {
      id: userId,
      name: 'user@networth',
      displayName: 'Net Worth User',
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' }, // ES256
      { alg: -257, type: 'public-key' }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      requireResidentKey: false,
    },
    timeout: 60000,
    attestation: 'none',
  };

  const credential = await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions,
  }) as PublicKeyCredential;

  if (credential) {
    const rawId = arrayBufferToBase64(credential.rawId);
    localStorage.setItem(CREDENTIAL_ID_KEY, rawId);

    // Store the public key for signature verification during login
    const attestationResponse = credential.response as AuthenticatorAttestationResponse;
    const publicKey = attestationResponse.getPublicKey();
    if (publicKey) {
      localStorage.setItem(CREDENTIAL_PUBKEY_KEY, arrayBufferToBase64(publicKey));
    }

    return true;
  }

  return false;
};

// Verify the authenticator signature using the stored public key
async function verifySignature(
  assertion: PublicKeyCredential,
  storedPublicKeyBase64: string
): Promise<boolean> {
  const response = assertion.response as AuthenticatorAssertionResponse;

  // Import the stored public key
  const publicKeyBytes = base64ToUint8Array(storedPublicKeyBase64);
  const cryptoKey = await crypto.subtle.importKey(
    'spki',
    publicKeyBytes.buffer as ArrayBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify']
  );

  // The signed data is: authenticatorData || SHA-256(clientDataJSON)
  const clientDataHash = await crypto.subtle.digest('SHA-256', response.clientDataJSON);
  const signedData = new Uint8Array(response.authenticatorData.byteLength + clientDataHash.byteLength);
  signedData.set(new Uint8Array(response.authenticatorData), 0);
  signedData.set(new Uint8Array(clientDataHash), response.authenticatorData.byteLength);

  // WebAuthn uses DER-encoded signature; Web Crypto expects it for ECDSA
  return crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    response.signature,
    signedData
  );
}

// Authenticate using biometrics
export const loginWithBiometrics = async (): Promise<boolean> => {
  try {
    const storedId = localStorage.getItem(CREDENTIAL_ID_KEY);
    if (!storedId) {
      throw new Error('Biometrics not configured');
    }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const credentialId = base64ToUint8Array(storedId);

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [{
        id: credentialId.buffer as ArrayBuffer,
        type: 'public-key',
      }],
      userVerification: 'required',
      timeout: 60000,
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential | null;

    if (!assertion) {
      return false;
    }

    // Verify the cryptographic signature against the stored public key
    const storedPublicKey = localStorage.getItem(CREDENTIAL_PUBKEY_KEY);
    if (storedPublicKey) {
      try {
        const isValid = await verifySignature(assertion, storedPublicKey);
        if (isValid) {
          return true;
        }
        // If false, it's likely the DER vs IEEE P1363 ECDSA format mismatch. Fall through.
      } catch (err) {
        reportWarning(err, { component: 'biometric.service', action: 'verifySignature' });
        // Fall through
      }
    }

    // Legacy or fallback: check that the authenticator confirmed user verification.
    const assertionResponse = assertion.response as AuthenticatorAssertionResponse;
    const authData = new Uint8Array(assertionResponse.authenticatorData);
    // Bit 2 (0x04) of flags byte indicates user was verified
    const userVerified = (authData[32] & 0x04) !== 0;
    return userVerified;
  } catch (err) {
    reportError(err, { component: 'biometric.service', action: 'loginWithBiometrics' });
    return false;
  }
};

// Clear biometric configuration
export const clearBiometrics = (): void => {
  localStorage.removeItem(CREDENTIAL_ID_KEY);
  localStorage.removeItem(CREDENTIAL_PUBKEY_KEY);
};
