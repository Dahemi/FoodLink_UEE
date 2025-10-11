import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNGOAuth } from '../context/NGOAuthContext';
import { useDonorAuth } from '../context/DonorAuthContext';
import { useRole } from '../context/RoleContext';
import LoadingSpinner from './LoadingSpinner';
import { useRouter, usePathname } from 'expo-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: 'volunteer' | 'donor' | 'ngo' | 'beneficiary';
  fallbackRoute?: string;
}

export default function ProtectedRoute({
  children,
  requireAuth = false,
  requireRole,
  fallbackRoute = '/volunteer-login',
}: ProtectedRouteProps) {
  const volunteerAuth = useAuth();
  const ngoAuth = useNGOAuth();
  const donorAuth = useDonorAuth();
  const { selectedRole } = useRole();
  const router = useRouter();
  const pathname = usePathname();

  // Select the appropriate auth context based on requireRole
  const authState = 
    requireRole === 'ngo' ? ngoAuth.authState :
    requireRole === 'donor' ? donorAuth.authState :
    volunteerAuth.authState;

  // Debug logging
  useEffect(() => {
    console.log('🔐 ProtectedRoute Debug:', {
      pathname,
      requireRole,
      requireAuth,
      selectedRole,
      isAuthenticated: authState.isAuthenticated,
      loading: authState.loading,
      user: authState.user?.name || 'none',
      fallbackRoute,
    });
  }, [
    pathname,
    requireRole,
    requireAuth,
    selectedRole,
    authState.isAuthenticated,
    authState.loading,
  ]);

  // Handle navigation in useEffect to avoid setState during render
  useEffect(() => {
    if (!authState.loading) {
      // Check authentication requirement
      if (requireAuth && !authState.isAuthenticated) {
        console.log('ProtectedRoute: Not authenticated, redirecting to:', fallbackRoute);
        
        // Redirect to appropriate login based on role
        if (requireRole === 'ngo') {
          router.replace('/ngo-login');
        } else if (requireRole === 'donor') {
          router.replace('/donor-login');
        } else if (requireRole === 'volunteer') {
          router.replace('/volunteer-login');
        } else {
          router.replace(fallbackRoute as any);
        }
        return;
      }

      // Check role requirement
      if (requireRole && selectedRole !== requireRole) {
        console.log('ProtectedRoute: Wrong role, redirecting to role selection');
        router.replace('/role-selection');
        return;
      }
    }
  }, [
    authState.loading,
    authState.isAuthenticated,
    selectedRole,
    requireAuth,
    requireRole,
    fallbackRoute,
    router,
  ]);

  // Show loading while checking authentication
  if (authState.loading) {
    console.log('⏳ Loading auth state...');
    return (
      <View style={styles.container}>
        <LoadingSpinner message="Loading..." size="large" color="#FF8A50" />
      </View>
    );
  }

  // If not authenticated and auth is required, show nothing (navigation will happen in useEffect)
  if (requireAuth && !authState.isAuthenticated) {
    console.log('🚫 Not authenticated, rendering null');
    return null;
  }

  // If role doesn't match and is required, show nothing (navigation will happen in useEffect)
  if (requireRole && selectedRole && selectedRole !== requireRole) {
    console.log('🚫 Role mismatch, rendering null');
    return null;
  }

  console.log('✅ Rendering protected content');
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