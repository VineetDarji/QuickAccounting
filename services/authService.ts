import { User } from '../types';

type AuthPayload = {
  token: string;
  user: User;
};

const parseJson = async (response: Response) => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json();
};

export const signup = async (payload: {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
}): Promise<AuthPayload> => {
  const response = await fetch('/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(response);
};

export const loginWithPassword = async (payload: { email: string; password: string }): Promise<AuthPayload> => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(response);
};
