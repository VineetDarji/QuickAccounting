const EMAIL_SERVICE_URL = 'http://localhost:5000/api';

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
    console.error('Failed to send verification code:', error);
    return false;
  }
};

export const checkEmailServiceHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${EMAIL_SERVICE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Email service not running:', error);
    return false;
  }
};
