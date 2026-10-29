import { request } from './api';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
}

export const login = (email: string, password: string) => request('/auth/login', 'POST', { email, password });

export const register = (email: string, password: string, firstName: string, lastName: string) =>
  request('/auth/register', 'POST', { email, password, firstName, lastName });

export const logout = () => request('/auth/logout', 'POST');

export async function getMe(): Promise<AuthUser | null> {
  const { ok, data } = await request<AuthUser>('/auth/me');
  return ok ? data : null;
}

export const updateMe = (fields: { firstName?: string; lastName?: string; avatarUrl?: string }) =>
  request('/auth/me', 'PUT', fields);

