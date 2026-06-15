export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'WARD_STAFF';

export interface Hospital {
  id: number;
  name: string;
  city: string;
  state: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone: string;
  hospital: Hospital | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse extends AuthTokens {}

export interface RegisterResponse extends AuthTokens {
  user: User;
}

export interface ApiError {
  detail?: string;
  [key: string]: unknown;
}
