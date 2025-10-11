import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RoleProvider } from '../context/RoleContext';
import { AuthProvider } from '../context/AuthContext';
import { NGOAuthProvider } from '../context/NGOAuthContext';
import { DonorAuthProvider } from '../context/DonorAuthContext';
import { BeneficiaryAuthProvider } from '../context/BeneficiaryAuthContext';
import ErrorBoundary from '../components/ErrorBoundary';

const theme = {
  colors: {
    primary: '#FF8A50',
    accent: '#FFB380',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#2D3748',
    disabled: '#E2E8F0',
    placeholder: '#718096',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    onSurface: '#2D3748',
    onBackground: '#2D3748',
    elevation: {
      level0: '#FFFFFF',
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
      level4: '#FFFFFF',
      level5: '#FFFFFF',
    },
  },
  roundness: 8,
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <PaperProvider theme={theme}>
          <RoleProvider>
            <AuthProvider>
              <NGOAuthProvider>
                <DonorAuthProvider>
                  <BeneficiaryAuthProvider>
                    {/* Single Stack navigator for all routes */}
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: '#FFFFFF' },
                      }}
                    >
                      {/* Common routes */}
                      <Stack.Screen name="index" />
                      <Stack.Screen name="role-selection" />
                      <Stack.Screen name="welcome" />
                      <Stack.Screen name="+not-found" />
                      
                      {/* Auth routes */}
                      <Stack.Screen name="volunteer-login" />
                      <Stack.Screen name="ngo-login" />
                      <Stack.Screen name="donor-login" />
                      <Stack.Screen name="beneficiary-login" />
                      
                      {/* Protected route groups */}
                      <Stack.Screen name="volunteer" options={{ headerShown: false }} />
                      <Stack.Screen name="NGO" options={{ headerShown: false }} />
                      <Stack.Screen name="donor" options={{ headerShown: false }} />
                      <Stack.Screen name="beneficiary" options={{ headerShown: false }} />
                    </Stack>
                    <StatusBar style="auto" backgroundColor="#FFFFFF" />
                  </BeneficiaryAuthProvider>
                </DonorAuthProvider>
              </NGOAuthProvider>
            </AuthProvider>
          </RoleProvider>
        </PaperProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}