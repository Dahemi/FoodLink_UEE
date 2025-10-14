// Common Logo Component
// filepath: d:\SLIIT\Y3S1\UEE\FoodLink\FoodLink_UEE\components\Logo.tsx
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export default function Logo({ size = 120 }) {
  return (
    <View style={styles.logoContainer}>
      <Image
        source={require('../assets/images/logo.png')}
        style={[styles.logo, { width: size, height: size }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
});