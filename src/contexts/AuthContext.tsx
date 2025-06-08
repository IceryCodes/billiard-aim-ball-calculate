import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useToast } from '@/contexts/ToastContext';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { UserProps } from '@/domains/user';
import { ToastStyleType } from '@/global-components/Toast';
import { renewToken } from '@/services/token';
import { TokenProps, verifyToken } from '@/utils/token';

interface LoginProps {
  token: string;
}

interface AuthContextProps {
  isAuthenticated: boolean;
  token: string | null;
  user: UserProps | null;
  login: ({ token }: LoginProps) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const router = useRouter();
  const { showToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProps | null>(null);

  const handleAuthError = useCallback(
    (errorMessage: string) => {
      showToast({
        message: errorMessage,
        toastStyle: ToastStyleType.Warning,
        duration: 3000,
      });
      router.push(getPageUrlByType(PageType.LOGIN));
    },
    [router, showToast]
  );

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setIsAuthenticated(false);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(
    async ({ token }: LoginProps) => {
      try {
        const { user: userData }: TokenProps = await verifyToken({ token });

        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }

        setIsAuthenticated(true);
        setToken(token);
        setUser(userData);
      } catch (error) {
        console.error('Login failed:', error);
        handleAuthError('登入失敗，請重新登入');
        logout();
      }
    },
    [logout, handleAuthError]
  );

  const handleTokenRefresh = useCallback(
    async (currentToken: string) => {
      try {
        console.warn('Token renewing...');
        const newToken = await renewToken(currentToken);
        if (!newToken) {
          throw new Error('Failed to renew token');
        }

        const { user: userData }: TokenProps = await verifyToken({ token: newToken });

        if (typeof window !== 'undefined') {
          localStorage.setItem('token', newToken);
          setIsAuthenticated(true);
          setToken(newToken);
          setUser(userData);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        handleAuthError('登入階段已過期，請重新登入');
        logout();
      }
    },
    [logout, handleAuthError]
  );

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined') return;

      const storedToken = localStorage.getItem('token');
      if (!storedToken) return;

      try {
        const { user: userData }: TokenProps = await verifyToken({ token: storedToken });
        setIsAuthenticated(true);
        setToken(storedToken);
        setUser(userData);
      } catch (error) {
        if (error instanceof Error && error.name === 'TokenExpiredError') {
          await handleTokenRefresh(storedToken);
        } else {
          console.error('Token validation failed:', error);
          handleAuthError('驗證失敗，請重新登入');
          logout();
        }
      }
    };

    initAuth();
  }, [handleTokenRefresh, logout, handleAuthError]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
