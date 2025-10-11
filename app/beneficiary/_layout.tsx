import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function BeneficiaryLayout() {
  return (
    <ProtectedRoute requireAuth={true} requireRole="beneficiary">
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
            title: 'Home',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="map" 
          options={{ 
            title: 'FoodFinderMap',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="alerts" 
          options={{ 
            title: 'Alerts',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="profile" 
          options={{ 
            title: 'Profile',
            headerShown: false,
          }} 
        />
      </Stack>
      <StatusBar style="light" backgroundColor="#FF8A50" />
    </ProtectedRoute>
  );
}