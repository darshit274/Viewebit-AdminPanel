import api from './api';
import { AuthResponse, LoginCredentials, Admin } from '../types';
import { STORAGE_KEYS, API_ENDPOINTS } from '../config/constants';

interface OTPVerificationData {
  email: string;
  otp: string;
}

interface ResendOTPData {
  email: string;
}

interface LoginResponse {
  email: string;
  requiresOTP: boolean;
}

export const authService = {
  // Admin login - Step 1: Send credentials, receive OTP requirement
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post('/admin/login', credentials);
    const { data } = response.data;

    // No longer storing token immediately
    // Will store after OTP verification

    return data;
  },

  // Admin login - Step 2: Verify OTP and get token
  verifyOTP: async (data: OTPVerificationData): Promise<AuthResponse> => {
    const response = await api.post('/admin/verify-otp', data);
    const { data: responseData } = response.data;

    // Store token and user data after successful OTP verification
    sessionStorage.setItem('admin_token', responseData.token);
    sessionStorage.setItem('admin_user', JSON.stringify(responseData.admin));

    return responseData;
  },

  // Resend OTP
  resendOTP: async (data: ResendOTPData): Promise<void> => {
    await api.post('/admin/resend-otp', data);
  },

  // Admin logout
  logout: async (): Promise<void> => {
    try {
      await api.post('/admin/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_user');
    }
  },

  // Get current admin profile
  getProfile: async (): Promise<Admin> => {
    const response = await api.get('/admin/profile');
    return response.data.data;
  },

  // Check if admin is authenticated
  isAuthenticated: (): boolean => {
    const token = sessionStorage.getItem('admin_token');
    const user = sessionStorage.getItem('admin_user');
    return !!(token && user);
  },

  // Get current admin from sessionStorage
  getCurrentAdmin: (): Admin | null => {
    const userStr = sessionStorage.getItem('admin_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Get auth token
  getToken: (): string | null => {
    return sessionStorage.getItem('admin_token');
  },

  // Refresh token (if needed)
  refreshToken: async (): Promise<string> => {
    const response = await api.post('/admin/refresh-token');
    const { token } = response.data.data;
    sessionStorage.setItem('admin_token', token);
    return token;
  },
};