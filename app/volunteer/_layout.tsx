import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProtectedRoute from '../../components/ProtectedRoute';
import VolunteerBottomNav from '../../components/volunteer/VolunteerBottomNav';

export default function VolunteerLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <ProtectedRoute requireAuth={true} requireRole="volunteer">
      <View style={styles.container}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#FF8A50',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: '600',
            },
            contentStyle: { 
              backgroundColor: '#FFFFFF',
              paddingBottom: 80 + insets.bottom, // Add padding for bottom nav + safe area
            },
          }}
        >
          <Stack.Screen 
            name="dashboard" 
            options={{ 
              title: 'Volunteer Dashboard',
              headerShown: false, // Hide header since we have custom header
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
        <VolunteerBottomNav />
      </View>
      <StatusBar style="light" backgroundColor="#FF8A50" />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
