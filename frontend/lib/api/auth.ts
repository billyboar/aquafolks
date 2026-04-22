import { api } from '../api';

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  new_password: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const response = await api.post<ForgotPasswordResponse>('/api/auth/forgot-password', { email });
  return response.data;
}

export async function resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
  const response = await api.post<ResetPasswordResponse>('/api/auth/reset-password', {
    token,
    new_password: newPassword,
  });
  return response.data;
}
