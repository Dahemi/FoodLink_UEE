import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRole } from '../context/RoleContext';
import { UserRole } from '../types';

const { width, height } = Dimensions.get('window');

export default function RoleSelectionScreen() {
  const { setRole } = useRole();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const primaryRoles: {
    key: UserRole;
    title: string;
    subtitle: string;
    color: string;
    backgroundColor: string;
    isPrimary: boolean;
    isCircular?: boolean;
  }[] = [
    {
      key: 'donor',
      title: 'Donate',
      subtitle: 'Donate your food for needy',
      color: '#FF8A50',
      backgroundColor: '#FFFFFF',
      isPrimary: false,
      isCircular: true,
    },
    {
      key: 'ngo',
      title: 'NGO Agent',
      subtitle: 'Food pickup and deliver',
      color: '#FF8A50',
      backgroundColor: '#FFFFFF',
      isPrimary: false,
      isCircular: true,
    },
    {
      key: 'volunteer',
      title: 'Volunteer',
      subtitle: 'Help deliver food',
      color: '#FF8A50',
      backgroundColor: '#FFFFFF',
      isPrimary: false,
      isCircular: true,
    },
  ];

  const handleRoleSelect = async (role: UserRole) => {
    await setRole(role);
    router.push('/welcome');
  };

  const handleNeedFood = () => {
    // Handle beneficiary role selection
    setRole('beneficiary');
    router.push('/welcome');
  };

  // Icon URLs
  const foodDonationIconUrl =
    'https://media.istockphoto.com/id/2150313780/vector/food-donation-outline-icon-box-with-food.jpg?s=612x612&w=0&k=20&c=wGzHLux3IWsArmzBQod9Jw9VAZklhofs_b4JlI8THDU=';
  const ngoDeliveryIconUrl =
    'https://img.freepik.com/premium-vector/ngo-building-icon-isolated-white-background_268104-12418.jpg';
  const volunteerIconUrl =
    'https://www.shutterstock.com/image-vector/volunteer-icon-simple-thin-outline-260nw-2572717961.jpg';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Logo */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            {/* TODO: Replace with vector logo component */}
            <View style={styles.logoPlaceholder}>
              <View style={styles.logoCircle1} />
              <View style={styles.logoCircle2} />
              <Text style={styles.logoText}>FoodLink</Text>
            </View>
          </View>
        </Animated.View>

        {/* Main Content */}
        <Animated.View
          style={[
            styles.mainContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>Want To Share Food?</Text>
          <Text style={styles.subtitle}>Choose any one</Text>

          {/* Primary Role Cards */}
          <View style={styles.roleCardsContainer}>
            {primaryRoles.map((role, index) => (
              <Animated.View
                key={role.key}
                style={[
                  styles.roleCardWrapper,
                  role.isCircular && styles.circularCardWrapper,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: Animated.add(
                          slideAnim,
                          new Animated.Value(index * 10)
                        ),
                      },
                    ],
                  },
                ]}
              >
                {/* Circular Cards for both roles */}
                <View style={styles.circularCardContainer}>
                  <TouchableOpacity
                    style={[
                      styles.circularCard,
                      {
                        backgroundColor: role.backgroundColor,
                        borderColor: role.isPrimary ? 'transparent' : '#FF8A50',
                        borderWidth: role.isPrimary ? 0 : 2,
                      },
                    ]}
                    onPress={() => handleRoleSelect(role.key)}
                    activeOpacity={0.8}
                  >
                    {role.key === 'donor' ? (
                      <Image
                        source={{ uri: foodDonationIconUrl }}
                        style={{ width: 60, height: 60 }}
                        resizeMode="contain"
                      />
                    ) : role.key === 'ngo' ? (
                      <Image
                        source={{ uri: ngoDeliveryIconUrl }}
                        style={{ width: 60, height: 60 }}
                        resizeMode="contain"
                      />
                    ) : role.key === 'volunteer' ? (
                      <Image
                        source={{ uri: volunteerIconUrl }}
                        style={{ width: 60, height: 60 }}
                        resizeMode="contain"
                      />
                    ) : null}
                  </TouchableOpacity>

                  <View style={styles.circularCardTextContainer}>
                    <Text style={[styles.roleTitle, { color: '#2D3748' }]}>
                      {role.title}
                    </Text>
                    <Text style={[styles.roleSubtitle, { color: '#999999' }]}>
                      {role.subtitle}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Divider Section */}
          <Animated.View
            style={[
              styles.dividerContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </Animated.View>
        </Animated.View>

        {/* Bottom Section - Need Food */}
        <Animated.View
          style={[
            styles.bottomSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.illustrationContainer}>
            <Image
              source={{
                uri: 'https://img.freepik.com/premium-vector/hungry-woman-thinking-about-food-illustration_598748-255.jpg',
              }}
              style={styles.illustrationPlaceholder}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity
            style={styles.needFoodButton}
            onPress={handleNeedFood}
            activeOpacity={0.9}
          >
            <Text style={styles.needFoodText}>I need some food</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  mainContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 40,
    textAlign: 'center',
  },
  roleCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 30,
    paddingHorizontal: 10,
    alignItems: 'flex-start',
  },
  roleCardWrapper: {
    width: '45%',
    marginHorizontal: '2.5%',
    marginBottom: 20,
  },
  circularCardWrapper: {
    alignItems: 'center',
  },
  circularCardContainer: {
    alignItems: 'center',
  },
  circularCard: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 16,
  },
  circularCardTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  roleSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  // SVG-like icon styles for NGO
  svgContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  truckContainer: {
    position: 'relative',
    width: 45,
    height: 25,
  },
  truckCab: {
    position: 'absolute',
    left: 0,
    top: 2,
    width: 15,
    height: 18,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  truckCargo: {
    position: 'absolute',
    right: 0,
    top: 5,
    width: 25,
    height: 15,
    borderWidth: 2,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  wheelsContainer: {
    position: 'absolute',
    bottom: -3,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  wheel: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  motionContainer: {
    position: 'absolute',
    left: -20,
    top: 8,
    width: 15,
    height: 10,
  },
  motionLine: {
    position: 'absolute',
    width: 8,
    height: 2,
    borderRadius: 1,
  },
  packageContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  foodPackage: {
    width: 8,
    height: 6,
    borderRadius: 2,
  },
  statsIconContainer: {
    alignItems: 'flex-end',
    width: '100%',
    paddingRight: 20,
  },
  statsIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#FF8A50',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF8A50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statsIconPlaceholder: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: 30,
    height: 20,
  },
  chartBar1: {
    width: 6,
    height: 12,
    backgroundColor: '#FFFFFF',
    marginRight: 3,
    borderRadius: 3,
  },
  chartBar2: {
    width: 6,
    height: 18,
    backgroundColor: '#FFFFFF',
    marginRight: 3,
    borderRadius: 3,
  },
  chartBar3: {
    width: 6,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  bottomSection: {
    flex: 1,
    marginTop: 40,
    alignItems: 'center',
  },
  illustrationContainer: {
    width: width,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  illustrationPlaceholder: {
    width: width * 0.8,
    height: 240,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF5E6',
    top: 30,
    left: 20,
  },
  bgCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE4CC',
    top: 10,
    right: 30,
  },
  bgCircle3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFD6B3',
    bottom: 40,
    left: 40,
  },
  characterContainer: {
    alignItems: 'center',
    zIndex: 2,
  },
  characterHead: {
    width: 50,
    height: 50,
    backgroundColor: '#F7C6A0',
    borderRadius: 25,
    marginBottom: 5,
  },
  characterBody: {
    width: 60,
    height: 80,
    backgroundColor: '#8B7DC3',
    borderRadius: 30,
    marginBottom: 10,
  },
  characterArm: {
    position: 'absolute',
    width: 25,
    height: 40,
    backgroundColor: '#8B7DC3',
    borderRadius: 12,
    top: 60,
    right: -5,
    transform: [{ rotate: '20deg' }],
  },
  foodBowl: {
    position: 'absolute',
    width: 30,
    height: 15,
    backgroundColor: '#FF8A50',
    borderRadius: 15,
    bottom: 80,
    right: 60,
  },
  needFoodButton: {
    backgroundColor: '#FF8A50',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 25,
    shadowColor: '#FF8A50',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 40,
  },
  needFoodText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginHorizontal: 20,
    letterSpacing: 1,
  },
});
