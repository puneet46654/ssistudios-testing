// @/contexts/AuthContext.tsx (Updated)

'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react'
import { useRouter, usePathname } from 'next/navigation'

// Define the shape of the user and their permissions
export interface UserAccess {
  posterEditor?: boolean;
  certificateEditor?: boolean;
  visitingCard?: boolean;
  idCard?: boolean;
  bgRemover?: boolean;
  imageEnhancer?: boolean;
  assets?: boolean;
}

export interface User { // 👈 EXPORTED
  id: string;
  username: string;
  access: UserAccess;
}

export interface AuthContextType { // 👈 EXPORTED
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUserAccess: (newAccess: UserAccess) => void;
  isLoading: boolean;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
// ... (rest of AuthProvider logic remains unchanged) ...

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch user from backend on first load (always fresh data)
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // 🔑 Always sync from backend (if session exists)
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setUser(data.user);
            sessionStorage.setItem('user', JSON.stringify(data.user));
          }
        }
      } catch (error) {
        console.error("Failed to load user session:", error);
        sessionStorage.removeItem('user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Handle page protection & redirects
  useEffect(() => {
    if (isLoading) return;

    const isAuthPage = pathname === '/login';
    const isPublicPage = pathname.startsWith('/slots');

    if (!user && !isAuthPage && !isPublicPage) {
      router.replace('/login');
    }

    if (user && isAuthPage) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, pathname, router]);

  const login = (userData: User) => {
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    router.replace('/login');
  };

  const updateUserAccess = (newAccess: UserAccess) => {
    if (user) {
      const updatedUser = { ...user, access: { ...user.access, ...newAccess } };
      setUser(updatedUser);
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    updateUserAccess,
    isLoading,
  };

  if (isLoading) return null;

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};