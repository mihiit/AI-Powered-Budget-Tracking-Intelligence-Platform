import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  age: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user profiles for different accounts
const USER_PROFILES: Record<string, User> = {
  'demo@finpilot.ai': {
    id: 'usr_abc123',
    email: 'demo@finpilot.ai',
    name: 'Alex Kumar',
    age: 26
  },
  'test@example.com': {
    id: 'usr_xyz789',
    email: 'test@example.com',
    name: 'Sarah Johnson',
    age: 28
  },
  'john@example.com': {
    id: 'usr_def456',
    email: 'john@example.com',
    name: 'John Smith',
    age: 32
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get existing profile or create new one
    let mockUser = USER_PROFILES[email.toLowerCase()];
    
    if (!mockUser) {
      // Create new user profile for unknown emails
      const userId = `usr_${Math.random().toString(36).substr(2, 9)}`;
      mockUser = {
        id: userId,
        email,
        name: email.split('@')[0].replace(/[0-9]/g, '').replace(/[^a-z]/gi, '').split('').map((c, i) => i === 0 ? c.toUpperCase() : c).join(''),
        age: Math.floor(Math.random() * (45 - 20)) + 20,
      };
    }
    
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
