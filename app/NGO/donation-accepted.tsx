import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';

export default function DonationAcceptedScreen() {
  const router = useRouter();
  const { donationTitle } = useLocalSearchParams<{ donationTitle?: string }>();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleOK = () => {
    router.replace('/NGO/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button
          icon="arrow-left"
          mode="text"
          onPress={handleOK}
          textColor="#2D3748"
          compact
        >
          
        </Button>
        <Text style={styles.headerTitle}>Donation Accepted</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Animated Checkmark */}
        <Animated.View
          style={[
            styles.checkmarkContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.checkmarkCircle}>
            <MaterialCommunityIcons name="check" size={80} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* Success Message */}
        <Animated.View
          style={[
            styles.messageContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.title}>Donation Accepted!</Text>
          <Text style={styles.subtitle}>
            A volunteer will be assigned for pickup. You will be notified.
          </Text>
          
          {donationTitle && (
            <View style={styles.donationInfo}>
              <Text style={styles.donationLabel}>Donation:</Text>
              <Text style={styles.donationTitle}>{donationTitle}</Text>
            </View>
          )}
        </Animated.View>

        {/* Action Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Button
            mode="contained"
            onPress={handleOK}
            style={styles.okButton}
            labelStyle={styles.okButtonLabel}
          >
            OK
          </Button>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  checkmarkContainer: {
    marginBottom: 40,
  },
  checkmarkCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#4CD964',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CD964',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  donationInfo: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  donationLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  donationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  buttonContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 40,
    paddingHorizontal: 40,
  },
  okButton: {
    backgroundColor: '#4CD964',
    paddingVertical: 8,
    borderRadius: 8,
  },
  okButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
