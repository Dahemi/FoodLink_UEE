import React from 'react';
import { View, StyleSheet } from 'react-native';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';

export default function RoleSelection() {
  return (
    <View style={styles.container}>
      <RoleSelectionScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
