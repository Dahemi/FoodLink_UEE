import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import LoadingSpinner from './LoadingSpinner';
import { useRouter } from 'expo-router';
import { useBeneficiaryAuth } from '../context/BeneficiaryAuthContext';

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
  const { authState: volunteerAuthState } = useAuth();
  const { authState: beneficiaryAuthState } = useBeneficiaryAuth();
  const { selectedRole } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!volunteerAuthState.loading && !beneficiaryAuthState.loading) {
      const isAuthenticated = 
        (requireRole === 'volunteer' && volunteerAuthState.isAuthenticated) ||
        (requireRole === 'beneficiary' && beneficiaryAuthState.isAuthenticated);

      if (requireAuth && !isAuthenticated) {
        router.replace(requireRole === 'beneficiary' ? '/beneficiary-login' : fallbackRoute);
        return;
      }

      if (requireRole && selectedRole !== requireRole) {
        router.replace('/role-selection');
        return;
      }
    }
  }, [
    volunteerAuthState.loading,
    volunteerAuthState.isAuthenticated,
    beneficiaryAuthState.loading,
    beneficiaryAuthState.isAuthenticated,
    selectedRole,
    requireAuth,
    requireRole,
    fallbackRoute,
    router
  ]);

  if (volunteerAuthState.loading || beneficiaryAuthState.loading) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
