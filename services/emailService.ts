// Use relative path so it works behind a reverse proxy in production and via Vite dev proxy.
const EMAIL_SERVICE_URL = '/api';

export const sendVerificationCode = async (email: string, code: string): Promise<boolean> => {
  try {
    const response = await fetch(`${EMAIL_SERVICE_URL}/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Email service error:', error);
      return false;
    }

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Failed to send verification code:', message);
    return false;
  }
};

export const checkEmailServiceHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${EMAIL_SERVICE_URL}/health`);
    return response.ok;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Email service not running:', message);
    return false;
  }
};
