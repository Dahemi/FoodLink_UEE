import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { RoleProvider } from '../context/RoleContext';
import ErrorBoundary from '../components/ErrorBoundary';

const theme = {
  colors: {
    primary: '#FF8A50', // Changed from '#4CAF50' to orange
    accent: '#FFB380', // Changed to light orange
    background: '#FFFFFF', // Changed to white
    surface: '#FFFFFF',
    text: '#2D3748', // Your dark gray
    disabled: '#E2E8F0', // Light gray
    placeholder: '#718096', // Medium gray
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
};

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <PaperProvider theme={theme}>
        <RoleProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#FFFFFF' }, // Force white background
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="role-selection" />
            <Stack.Screen name="welcome" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" backgroundColor="#FFFFFF" />
        </RoleProvider>
      </PaperProvider>
    </ErrorBoundary>
  );
}
