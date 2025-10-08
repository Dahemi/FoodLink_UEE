import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { TextInput, Button, Card, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const { width, height } = Dimensions.get('window');

export default function VolunteerLoginScreen() {
  const router = useRouter();
  const { login, register, authState } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      coordinates: {
        latitude: 6.9271, // Default to Colombo, Sri Lanka
        longitude: 79.8612,
      },
    },
    vehicleType: 'bike' as 'bike' | 'car' | 'van' | 'walking',
    maxDistance: 10,
  });
  const [availability, setAvailability] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });
  const [preferredTimeSlots, setPreferredTimeSlots] = useState<string[]>(['morning', 'afternoon']);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Password validation
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (!isLogin && (!formData.name || !formData.phone || !formData.address.street || !formData.address.city || !formData.address.state || !formData.address.zipCode)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login({
          email: formData.email,
          password: formData.password,
        });
        router.replace('/volunteer/dashboard');
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          vehicleType: formData.vehicleType,
          availability,
          preferredTimeSlots,
          maxDistance: formData.maxDistance,
        });
        router.replace('/volunteer/dashboard');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Authentication failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = (day: keyof typeof availability) => {
    setAvailability(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const toggleTimeSlot = (slot: string) => {
    setPreferredTimeSlots(prev => 
      prev.includes(slot) 
        ? prev.filter(s => s !== slot)
        : [...prev, slot]
    );
  };

  if (loading) {
    return (
      <LoadingSpinner 
        message={isLogin ? "Signing you in..." : "Creating your account..."} 
        size="large" 
        color="#FF8A50" 
      />
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle1} />
            <View style={styles.logoCircle2} />
            <Text style={styles.logoText}>FoodLink</Text>
          </View>
          <Text style={styles.title}>
            {isLogin ? 'Welcome Back!' : 'Join as Volunteer'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin 
              ? 'Sign in to continue helping your community' 
              : 'Help deliver food to those in need'
            }
          </Text>
        </View>

        {/* Form */}
        <Card style={styles.formCard}>
          <Card.Content style={styles.formContent}>
            {/* Email */}
            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            {/* Password */}
            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              mode="outlined"
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
            />

            {/* Registration Fields */}
            {!isLogin && (
              <>
                <TextInput
                  label="Full Name"
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  mode="outlined"
                  style={styles.input}
                />

                <TextInput
                  label="Phone Number"
                  value={formData.phone}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                  mode="outlined"
                  keyboardType="phone-pad"
                  style={styles.input}
                />

                <TextInput
                  label="Street Address"
                  value={formData.address.street}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, address: { ...prev.address, street: text } }))}
                  mode="outlined"
                  style={styles.input}
                />

                <View style={styles.addressRow}>
                  <TextInput
                    label="City"
                    value={formData.address.city}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, address: { ...prev.address, city: text } }))}
                    mode="outlined"
                    style={[styles.input, styles.addressInput]}
                  />
                  <TextInput
                    label="State"
                    value={formData.address.state}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, address: { ...prev.address, state: text } }))}
                    mode="outlined"
                    style={[styles.input, styles.addressInput]}
                  />
                </View>

                <View style={styles.addressRow}>
                  <TextInput
                    label="ZIP Code"
                    value={formData.address.zipCode}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, address: { ...prev.address, zipCode: text } }))}
                    mode="outlined"
                    keyboardType="numeric"
                    style={[styles.input, styles.addressInput]}
                  />
                  <TextInput
                    label="Country"
                    value={formData.address.country}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, address: { ...prev.address, country: text } }))}
                    mode="outlined"
                    style={[styles.input, styles.addressInput]}
                  />
                </View>

                {/* Vehicle Type */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Vehicle Type</Text>
                  <View style={styles.vehicleOptions}>
                    {['bike', 'car', 'van', 'walking'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.vehicleOption,
                          formData.vehicleType === type && styles.vehicleOptionSelected,
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, vehicleType: type as any }))}
                      >
                        <Text style={[
                          styles.vehicleOptionText,
                          formData.vehicleType === type && styles.vehicleOptionTextSelected,
                        ]}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Availability */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Availability</Text>
                  <View style={styles.availabilityGrid}>
                    {Object.entries(availability).map(([day, available]) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.availabilityDay,
                          available && styles.availabilityDaySelected,
                        ]}
                        onPress={() => toggleAvailability(day as keyof typeof availability)}
                      >
                        <Text style={[
                          styles.availabilityDayText,
                          available && styles.availabilityDayTextSelected,
                        ]}>
                          {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Time Slots */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Preferred Time Slots</Text>
                  <View style={styles.timeSlotsContainer}>
                    {['morning', 'afternoon', 'evening'].map((slot) => (
                      <TouchableOpacity
                        key={slot}
                        style={[
                          styles.timeSlot,
                          preferredTimeSlots.includes(slot) && styles.timeSlotSelected,
                        ]}
                        onPress={() => toggleTimeSlot(slot)}
                      >
                        <Text style={[
                          styles.timeSlotText,
                          preferredTimeSlots.includes(slot) && styles.timeSlotTextSelected,
                        ]}>
                          {slot.charAt(0).toUpperCase() + slot.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Max Distance */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Maximum Distance: {formData.maxDistance} km
                  </Text>
                  <View style={styles.sliderContainer}>
                    <TouchableOpacity
                      style={styles.sliderButton}
                      onPress={() => setFormData(prev => ({ 
                        ...prev, 
                        maxDistance: Math.max(1, prev.maxDistance - 1) 
                      }))}
                    >
                      <Text style={styles.sliderButtonText}>-</Text>
                    </TouchableOpacity>
                    <View style={styles.sliderTrack}>
                      <View 
                        style={[
                          styles.sliderFill, 
                          { width: `${(formData.maxDistance / 50) * 100}%` }
                        ]} 
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.sliderButton}
                      onPress={() => setFormData(prev => ({ 
                        ...prev, 
                        maxDistance: Math.min(50, prev.maxDistance + 1) 
                      }))}
                    >
                      <Text style={styles.sliderButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              labelStyle={styles.submitButtonText}
              disabled={loading}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>

            {/* Toggle Login/Register */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </Text>
              <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                <Text style={styles.toggleLink}>
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginTop: 50,
    letterSpacing: 0.5,
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
    textAlign: 'center',
    lineHeight: 22,
  },
  formCard: {
    margin: 20,
    elevation: 4,
    borderRadius: 12,
  },
  formContent: {
    padding: 20,
  },
  input: {
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addressInput: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  vehicleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  vehicleOptionSelected: {
    backgroundColor: '#FF8A50',
    borderColor: '#FF8A50',
  },
  vehicleOptionText: {
    fontSize: 14,
    color: '#718096',
  },
  vehicleOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  availabilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availabilityDay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availabilityDaySelected: {
    backgroundColor: '#FF8A50',
    borderColor: '#FF8A50',
  },
  availabilityDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
  },
  availabilityDayTextSelected: {
    color: '#FFFFFF',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  timeSlotSelected: {
    backgroundColor: '#FF8A50',
    borderColor: '#FF8A50',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#718096',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF8A50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#FF8A50',
    borderRadius: 4,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: '#FF8A50',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: '#718096',
  },
  toggleLink: {
    fontSize: 14,
    color: '#FF8A50',
    fontWeight: '600',
  },
});
