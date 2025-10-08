import React from 'react';
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

  // Check authentication requirement
  if (requireAuth && !authState.isAuthenticated) {
    router.replace(fallbackRoute);
    return null;
  }

  // Check role requirement
  if (requireRole && selectedRole !== requireRole) {
    router.replace('/role-selection');
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
