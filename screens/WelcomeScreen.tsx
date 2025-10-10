import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRole } from '../context/RoleContext';

export default function WelcomeScreen() {
  const { selectedRole, clearRole } = useRole();
  const router = useRouter();

  // Icon URLs matching role selection screen
  const iconUrls = {
    donor:
      'https://media.istockphoto.com/id/2150313780/vector/food-donation-outline-icon-box-with-food.jpg?s=612x612&w=0&k=20&c=wGzHLux3IWsArmzBQod9Jw9VAZklhofs_b4JlI8THDU=',
    ngo: 'https://img.freepik.com/premium-vector/ngo-building-icon-isolated-white-background_268104-12418.jpg',
    volunteer:
      'https://www.shutterstock.com/image-vector/volunteer-icon-simple-thin-outline-260nw-2572717961.jpg',
    beneficiary:
      'https://img.freepik.com/premium-vector/hungry-woman-thinking-about-food-illustration_598748-255.jpg',
  };

  const getRoleInfo = () => {
    switch (selectedRole) {
      case 'donor':
        return {
          title: 'Welcome, Food Donor!',
          color: '#FF8A50',
          backgroundColor: '#FFFFFF',
          features: [
            'List surplus food items',
            'Set pickup schedules',
            'Track donation impact',
            'Connect with local NGOs',
          ],
        };
      case 'ngo':
        return {
          title: 'Welcome, NGO Partner!',
          color: '#FF8A50',
          features: [
            'Browse available donations',
            'Coordinate with volunteers',
            'Manage distribution events',
            'Track community impact',
          ],
        };
      case 'volunteer':
        return {
          title: 'Welcome, Volunteer!',
          color: '#FF8A50',
          features: [
            'View assigned pickup and delivery tasks',
            'Accept tasks and manage your schedule',
            'Navigate to pickup and delivery locations',
            'Communicate with donors and NGOs',
            'Track your volunteer impact and statistics',
            'Receive real-time notifications for updates',
          ],
        };
      case 'beneficiary':
        return {
          title: 'Welcome, Community Member!',
          color: '#FF8A50',
          features: [
            'Find nearby food assistance',
            'View distribution schedules',
            'Access nutrition resources',
            'Connect with local programs',
          ],
        };
      default:
        return {
          title: 'Welcome!',
          color: '#4CAF50',
          features: [],
        };
    }
  };

  const roleInfo = getRoleInfo();

  const handleChangeRole = () => {
    clearRole();
    router.push('/role-selection');
  };

  const handleGetStarted = () => {
    // Navigate to role-specific dashboard
    switch (selectedRole) {
      case 'volunteer':
        router.push('/volunteer/dashboard');
        break;
      case 'donor':
        // Future: router.push('/donor/dashboard');
        router.push('/donor/dashboard');
        break;
      case 'ngo':
        // Future: router.push('/ngo/dashboard');
        alert('NGO dashboard coming soon! Thank you for your patience.');
        break;
      case 'beneficiary':
        // Future: router.push('/beneficiary/dashboard');
        alert(
          'Beneficiary dashboard coming soon! Thank you for your patience.'
        );
        break;
      default:
        alert('Please select a role first.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header matching role selection style */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <View style={styles.logoCircle1} />
              <View style={styles.logoCircle2} />
              <Text style={styles.logoText}>FoodLink</Text>
            </View>
          </View>
        </View>

        {/* Welcome Content */}

        <View style={styles.welcomeContent}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: '#FFFFFF',
                borderColor: roleInfo.color,
                borderWidth: 3,
              },
            ]}
          >
            {selectedRole && iconUrls[selectedRole] && (
              <Image
                source={{ uri: iconUrls[selectedRole] }}
                style={styles.iconImage}
                resizeMode="contain"
              />
            )}
          </View>
          <Text style={styles.title}>{roleInfo.title}</Text>
          <Text style={styles.subtitle}>
            Thank you for joining our mission to fight hunger in our community.
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What you can do:</Text>
          {roleInfo.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View
                style={[styles.featureDot, { backgroundColor: roleInfo.color }]}
              />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: roleInfo.color }]}
            onPress={handleGetStarted}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleChangeRole}
          >
            <Text style={styles.secondaryButtonText}>Change Role</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Together, we can make a difference in our community
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Update styles:
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoCircle1: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFB380',
    top: 10,
    left: 15,
    transform: [{ rotate: '-15deg' }],
  },
  logoCircle2: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#FF8A50',
    top: 15,
    right: 10,
    transform: [{ rotate: '20deg' }],
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginTop: 50,
    letterSpacing: 0.5,
  },
  welcomeContent: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 24,
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
    paddingHorizontal: 20,
  },
  featuresContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#4A5568',
    flex: 1,
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 16,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  primaryButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#718096',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  iconImage: {
    width: 70,
    height: 70,
  },
  iconText: {
    fontSize: 36,
  },
});
