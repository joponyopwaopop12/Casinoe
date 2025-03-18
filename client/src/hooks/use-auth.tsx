import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useLoginMutation>;
  registerMutation: ReturnType<typeof useRegisterMutation>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Login mutation hook
function useLoginMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest('POST', '/api/login', credentials);
      return res.json() as Promise<User>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user'], data);
      queryClient.invalidateQueries({ queryKey: ['/api/bets'] });
    },
  });
}

// Register mutation hook
function useRegisterMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest('POST', '/api/register', credentials);
      return res.json() as Promise<User>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user'], data);
    },
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch current user
  const { data, isLoading: loading } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: async ({ queryKey }) => {
      try {
        const res = await fetch(queryKey[0] as string, {
          credentials: 'include',
        });
        
        if (res.status === 401) return null;
        if (!res.ok) throw new Error('Failed to fetch user');
        
        return res.json();
      } catch (error) {
        setError(error instanceof Error ? error : new Error('An error occurred'));
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
  
  // Ensure user is always User | null type, never undefined
  const user: User | null = data ?? null;
  
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  
  const logout = async () => {
    try {
      await apiRequest('POST', '/api/logout', {});
      queryClient.setQueryData(['/api/user'], null);
      queryClient.invalidateQueries();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // Reset error when mutations are called
  useEffect(() => {
    if (loginMutation.isPending || registerMutation.isPending) {
      setError(null);
    }
  }, [loginMutation.isPending, registerMutation.isPending]);
  
  // Set error from mutations
  useEffect(() => {
    if (loginMutation.error) {
      setError(loginMutation.error as Error);
    }
    if (registerMutation.error) {
      setError(registerMutation.error as Error);
    }
  }, [loginMutation.error, registerMutation.error]);
  
  const value: AuthContextType = {
    user,
    loading,
    error,
    loginMutation,
    registerMutation,
    logout,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}