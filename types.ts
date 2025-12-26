export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  username: string;
  password?: string; // Only for auth check, usually shouldn't store plain text but OK for mock
  role: UserRole;
  fullName: string;
}

export enum ContentType {
  URL = 'URL',
  IMAGE = 'IMAGE'
}

export interface Slide {
  id: string;
  type: ContentType;
  url: string;
  duration: number; // in seconds
  title?: string;
}

export interface Kiosk {
  id: string;
  name: string;
  location: string;
  slides: Slide[];
  lastHeartbeat?: number;
  status: 'online' | 'offline' | 'maintenance';
}

export interface LogEntry {
  id: string;
  timestamp: number;
  username: string;
  action: string;
  details: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}