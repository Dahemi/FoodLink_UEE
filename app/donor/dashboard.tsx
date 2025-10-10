import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDonorAuth } from '../../context/DonorAuthContext';

export default function DonorDashboard() {
  const router = useRouter();
  const { authState, logout } = useDonorAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/role-selection');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {authState.user?.name}!</Text>
      <Text style={styles.subtitle}>Donor Dashboard Coming Soon</Text>
      <Button mode="contained" onPress={handleLogout} style={styles.button}>
        Logout
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F7FAFC',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#FF8A50',
  },
});
