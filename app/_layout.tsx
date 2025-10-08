import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RoleProvider } from '../context/RoleContext';
import { AuthProvider } from '../context/AuthContext';
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
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#FFFFFF' }, // Force white background
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="role-selection" />
              <Stack.Screen name="welcome" />
              <Stack.Screen name="volunteer-login" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" backgroundColor="#FFFFFF" />
            </AuthProvider>
          </RoleProvider>
        </PaperProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
