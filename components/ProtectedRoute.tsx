import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import LoadingSpinner from './LoadingSpinner';
import { useRouter } from 'expo-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: string;
  fallbackRoute?: string;
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = false, 
  requireRole, 
  fallbackRoute = '/volunteer-login' 
}: ProtectedRouteProps) {
  const { authState } = useAuth();
  const { selectedRole } = useRole();
  const router = useRouter();

  // Handle navigation in useEffect to avoid setState during render
  useEffect(() => {
    if (!authState.loading) {
      // Check authentication requirement
      if (requireAuth && !authState.isAuthenticated) {
        router.replace(fallbackRoute);
        return;
      }

      // Check role requirement
      if (requireRole && selectedRole !== requireRole) {
        router.replace('/role-selection');
        return;
      }
    }
  }, [authState.loading, authState.isAuthenticated, selectedRole, requireAuth, requireRole, fallbackRoute, router]);

  // Show loading while checking authentication
  if (authState.loading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner 
          message="Loading..." 
          size="large" 
          color="#FF8A50" 
        />
      </View>
    );
  }

  // Don't render children if not authenticated or wrong role
  if (requireAuth && !authState.isAuthenticated) {
    return null;
  }

  if (requireRole && selectedRole !== requireRole) {
    return null;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
