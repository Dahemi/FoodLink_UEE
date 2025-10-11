import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function DonorDashboard() {
  const router = useRouter();

  useEffect(() => {
    console.log('📍 DonorDashboard: Redirecting to home');
    // Use replace to avoid back navigation issues
    const timer = setTimeout(() => {
      router.replace('/donor/home');
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF8F0',
      }}
    >
      <ActivityIndicator size="large" color="#FF8A50" />
    </View>
  );
}
