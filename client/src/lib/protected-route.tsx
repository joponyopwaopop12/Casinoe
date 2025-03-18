import React, { useEffect } from 'react';
import { Route, RouteProps, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

interface ProtectedRouteProps extends RouteProps {
  component: React.ComponentType<any>;
}

export function ProtectedRoute({ component: Component, ...rest }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // If authentication is complete (not loading) and user is not authenticated
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Render a conditional route
  return (
    <Route
      {...rest}
      component={(props: any) => {
        // If still loading, show a loading indicator
        if (loading) {
          return (
            <div className="flex items-center justify-center h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          );
        }

        // If user is authenticated, render the component
        return user ? <Component {...props} /> : null;
      }}
    />
  );
}