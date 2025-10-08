import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function VolunteerLayout() {
  return (
    <ProtectedRoute requireAuth={true} requireRole="volunteer">
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
            title: 'Volunteer Dashboard',
            headerShown: false, // Hide header since we have custom header in dashboard
          }} 
        />
        <Stack.Screen 
          name="task-detail" 
          options={{ 
            title: 'Task Details',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="completed-tasks" 
          options={{ 
            title: 'Completed Tasks',
          }} 
        />
        <Stack.Screen 
          name="schedule" 
          options={{ 
            title: 'My Schedule',
          }} 
        />
        <Stack.Screen 
          name="profile" 
          options={{ 
            title: 'Profile',
            headerShown: false, // Custom header in profile page
          }} 
        />
      </Stack>
      <StatusBar style="light" backgroundColor="#FF8A50" />
    </ProtectedRoute>
  );
}
