import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start animations with staggered timing
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to role selection after animation
    const timer = setTimeout(() => {
      router.push('/role-selection');
    }, 3500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, slideAnim, router]);

  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />

      <View style={styles.content}>
        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoBackground}>
            <View style={styles.donationBox}>
              {/* Food items in box */}
              <View style={styles.foodItems}>
                <Text style={styles.foodItem}>🍞</Text>
                <Text style={styles.foodItem}>🥫</Text>
                <Text style={styles.foodItem}>🍎</Text>
              </View>
              {/* Decorative elements */}
              <View style={styles.decorativeLeft}>
                <Text style={styles.leafIcon}>🌿</Text>
              </View>
              <View style={styles.decorativeRight}>
                <Text style={styles.leafIcon}>🌿</Text>
              </View>
            </View>
            {/* Africa outline/heart shape */}
            <View style={styles.heartContainer}>
              <Text style={styles.heartIcon}>♥</Text>
            </View>
          </View>
        </Animated.View>

        {/* App Name and Tagline */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.appName}>FoodLink</Text>
          <Text style={styles.tagline}>
            Connecting Communities Through Compassion
          </Text>
          <Text style={styles.subtitle}>
            Building bridges between surplus and need
          </Text>
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.footerText}>A Food Donation Platform</Text>
        <View style={styles.loadingIndicator}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotDelay1]} />
          <View style={[styles.dot, styles.dotDelay2]} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 100%)',
    opacity: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 60,
    alignItems: 'center',
  },
  logoBackground: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
    position: 'relative',
  },
  donationBox: {
    width: 120,
    height: 80,
    backgroundColor: '#FFE0B2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF9800',
    position: 'relative',
  },
  foodItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  foodItem: {
    fontSize: 20,
  },
  decorativeLeft: {
    position: 'absolute',
    left: -25,
    top: -10,
    transform: [{ rotate: '-15deg' }],
  },
  decorativeRight: {
    position: 'absolute',
    right: -25,
    top: -10,
    transform: [{ rotate: '15deg' }],
  },
  leafIcon: {
    fontSize: 24,
    color: '#4CAF50',
  },
  heartContainer: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: '#FF5722',
    borderRadius: 20,
    width: 40,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 42,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 18,
    color: '#4A4A4A',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: 20,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9800',
    marginHorizontal: 4,
    opacity: 0.3,
  },
  dotDelay1: {
    backgroundColor: '#4CAF50',
    opacity: 0.6,
  },
  dotDelay2: {
    backgroundColor: '#2196F3',
    opacity: 1,
  },
});

export default SplashScreen;
