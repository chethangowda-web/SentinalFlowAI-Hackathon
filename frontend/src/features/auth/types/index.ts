import { User } from '@/store/authStore';

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  // Step 1: Org Details
  organizationName: string;
  organizationSlug: string;
  industry: string;
  companySize: string;
  country: string;
  timezone: string;
  // Step 2: Owner Details
  ownerName: string;
  email: string;
  password?: string;
}

export interface RegisterResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: User;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password?: string;
}

export interface SwitchOrgResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: User;
}
