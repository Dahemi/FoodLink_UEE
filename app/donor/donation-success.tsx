import React, { useEffect, useRef } from 'react';
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

export default function DonationSuccessScreen() {
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

  const handleBackToHome = () => {
    router.replace('/donor/home');
  };

  const handleViewPastDonations = () => {
    router.replace('/donor/history');
  };

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.title}>Thank you for your{'\n'}donation!</Text>
          <Text style={styles.subtitle}>
            Your contribution will help us reduce food waste and feed those in need.
          </Text>

          {donationTitle && (
            <View style={styles.donationInfo}>
              <Text style={styles.donationLabel}>Donation:</Text>
              <Text style={styles.donationTitle}>{donationTitle}</Text>
            </View>
          )}
        </Animated.View>

        {/* Action Buttons */}
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
            onPress={handleBackToHome}
            style={styles.primaryButton}
            labelStyle={styles.primaryButtonLabel}
            icon="home"
          >
            Back to Home
          </Button>

          <Button
            mode="outlined"
            onPress={handleViewPastDonations}
            style={styles.secondaryButton}
            labelStyle={styles.secondaryButtonLabel}
            textColor="#FF8A50"
            icon="history"
          >
            View Past Donations
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
    backgroundColor: '#FF8A50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8A50',
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
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  donationInfo: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FFDDB3',
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
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FF8A50',
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderColor: '#FF8A50',
    borderWidth: 2,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});