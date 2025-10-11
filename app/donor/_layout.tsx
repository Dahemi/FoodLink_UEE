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
          headerShown: false,
          contentStyle: { backgroundColor: '#FFF8F0' },
        }}
      >
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="home" />
        <Stack.Screen
          name="create-donation"
          options={{
            presentation: 'modal',
            title: 'New Donation',
          }}
        />
        <Stack.Screen name="recurring" />
        <Stack.Screen name="history" />
        <Stack.Screen name="receipts" />
        <Stack.Screen name="badges" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="urgent-donation" />
        <Stack.Screen name="stories/[id]" />
      </Stack>
      <StatusBar style="dark" backgroundColor="#FFF8F0" />
    </ProtectedRoute>
  );
}
