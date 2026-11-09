import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api-request";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const expire = () => { setIsAuthenticated(false); queryClient.clear(); };
    window.addEventListener("auth:expired", expire);
    // Verifica se o usuário está autenticado
    const checkAuth = async () => {
      try {
        // Esta rota vai verificar se a sessão está ativa
        await apiRequest('GET', '/api/check-auth');
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    return () => window.removeEventListener("auth:expired", expire);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await apiRequest('POST', '/api/login', { username, password });
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await apiRequest('POST', '/api/logout');
      setIsAuthenticated(false);
      queryClient.clear();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}