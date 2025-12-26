import { Kiosk, User, UserRole, LogEntry, ContentType } from '../types';

const KIOSKS_KEY = 'kmp_kiosks';
const USERS_KEY = 'kmp_users';
const LOGS_KEY = 'kmp_logs';

// Initialize default data if empty
const initStorage = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    const defaultAdmin: User = {
      username: 'Niv',
      password: '123',
      role: UserRole.ADMIN,
      fullName: 'Niv Manager',
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([defaultAdmin]));
  }

  if (!localStorage.getItem(KIOSKS_KEY)) {
    const initialKiosks: Kiosk[] = Array.from({ length: 15 }).map((_, i) => ({
      id: `kiosk-${i + 1}`,
      name: `קיוסק ייצור ${i + 1}`,
      location: `אולם ${Math.floor(i / 5) + 1}`,
      status: 'offline',
      slides: [
        {
          id: `slide-${i}-1`,
          type: ContentType.IMAGE,
          url: `https://picsum.photos/seed/${i}/1920/1080`,
          duration: 10,
          title: 'תמונת אווירה'
        },
        {
          id: `slide-${i}-2`,
          type: ContentType.URL,
          url: 'https://www.wikipedia.org/',
          duration: 15,
          title: 'ויקיפדיה'
        }
      ]
    }));
    localStorage.setItem(KIOSKS_KEY, JSON.stringify(initialKiosks));
  }
};

initStorage();

// User Services
export const getUsers = (): User[] => {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.username === user.username);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const deleteUser = (username: string): void => {
  const users = getUsers().filter(u => u.username !== username);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Kiosk Services
export const getKiosks = (): Kiosk[] => {
  return JSON.parse(localStorage.getItem(KIOSKS_KEY) || '[]');
};

export const getKioskById = (id: string): Kiosk | undefined => {
  return getKiosks().find(k => k.id === id);
};

export const saveKiosk = (kiosk: Kiosk): void => {
  const kiosks = getKiosks();
  const index = kiosks.findIndex(k => k.id === kiosk.id);
  if (index >= 0) {
    kiosks[index] = kiosk;
  } else {
    kiosks.push(kiosk);
  }
  localStorage.setItem(KIOSKS_KEY, JSON.stringify(kiosks));
};

// Log Services
export const getLogs = (): LogEntry[] => {
  return JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
};

export const addLog = (username: string, action: string, details: string): void => {
  const logs = getLogs();
  const newLog: LogEntry = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    username,
    action,
    details
  };
  // Keep last 100 logs
  const updatedLogs = [newLog, ...logs].slice(0, 100);
  localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
};