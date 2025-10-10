import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function DonorLayout() {
  return (
    <ProtectedRoute
      requireAuth={true}
      requireRole="donor"
      fallbackRoute="/donor-login"
    >
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FF8A50',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen
          name="dashboard"
          options={{
            title: 'Donor Dashboard',
            headerShown: true,
          }}
        />
      </Stack>
      <StatusBar style="light" backgroundColor="#FF8A50" />
    </ProtectedRoute>
  );
}
