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
import { TextInput, Button, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDonorAuth } from '../context/DonorAuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const { width } = Dimensions.get('window');

export default function DonorLoginScreen() {
  const router = useRouter();
  const { login, register } = useDonorAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    donorType: 'individual' as
      | 'individual'
      | 'restaurant'
      | 'hotel'
      | 'catering'
      | 'grocery'
      | 'bakery'
      | 'other',
    businessName: '',
    averageDonationFrequency: 'occasional' as
      | 'daily'
      | 'weekly'
      | 'monthly'
      | 'occasional',
    specialInstructions: '',
  });
  const [preferredPickupTimes, setPreferredPickupTimes] = useState<string[]>([
    'morning',
  ]);
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

    if (!isLogin && (!formData.name || !formData.phone || !formData.address)) {
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
        router.replace('/donor/dashboard');
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          address: formData.address, // Send as string, backend will parse it
          donorType: formData.donorType,
          businessName: formData.businessName,
          averageDonationFrequency: formData.averageDonationFrequency,
          preferredPickupTimes,
          specialInstructions: formData.specialInstructions,
        });
        router.replace('/donor/dashboard');
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

  const togglePickupTime = (time: string) => {
    setPreferredPickupTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  if (loading) {
    return (
      <LoadingSpinner
        message={isLogin ? 'Signing you in...' : 'Creating your account...'}
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
            {isLogin ? 'Welcome Back, Donor!' : 'Become a Donor'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? 'Sign in to donate surplus food'
              : 'Join us in fighting food waste'}
          </Text>
        </View>

        {/* Form */}
        <Card style={styles.formCard}>
          <Card.Content style={styles.formContent}>
            {/* Email */}
            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, email: text }))
              }
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            {/* Password */}
            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, password: text }))
              }
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
                {/* Basic Information */}
                <TextInput
                  label="Full Name"
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, name: text }))
                  }
                  mode="outlined"
                  style={styles.input}
                />

                <TextInput
                  label="Phone Number"
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, phone: text }))
                  }
                  mode="outlined"
                  keyboardType="phone-pad"
                  style={styles.input}
                />

                <TextInput
                  label="Address"
                  value={formData.address}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, address: text }))
                  }
                  mode="outlined"
                  multiline
                  numberOfLines={2}
                  style={styles.input}
                />

                {/* Donor Type */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Donor Type</Text>
                  <View style={styles.donorTypeOptions}>
                    {[
                      { value: 'individual', label: 'Individual' },
                      { value: 'restaurant', label: 'Restaurant' },
                      { value: 'hotel', label: 'Hotel' },
                      { value: 'catering', label: 'Catering' },
                      { value: 'grocery', label: 'Grocery Store' },
                      { value: 'bakery', label: 'Bakery' },
                      { value: 'other', label: 'Other' },
                    ].map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.donorTypeOption,
                          formData.donorType === type.value &&
                            styles.donorTypeOptionSelected,
                        ]}
                        onPress={() =>
                          setFormData((prev) => ({
                            ...prev,
                            donorType: type.value as any,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.donorTypeOptionText,
                            formData.donorType === type.value &&
                              styles.donorTypeOptionTextSelected,
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Business Name (for non-individual donors) */}
                {formData.donorType !== 'individual' && (
                  <TextInput
                    label="Business Name"
                    value={formData.businessName}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, businessName: text }))
                    }
                    mode="outlined"
                    style={styles.input}
                  />
                )}

                {/* Donation Frequency */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Average Donation Frequency
                  </Text>
                  <View style={styles.frequencyOptions}>
                    {[
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                      { value: 'occasional', label: 'Occasional' },
                    ].map((freq) => (
                      <TouchableOpacity
                        key={freq.value}
                        style={[
                          styles.frequencyOption,
                          formData.averageDonationFrequency === freq.value &&
                            styles.frequencyOptionSelected,
                        ]}
                        onPress={() =>
                          setFormData((prev) => ({
                            ...prev,
                            averageDonationFrequency: freq.value as any,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.frequencyOptionText,
                            formData.averageDonationFrequency === freq.value &&
                              styles.frequencyOptionTextSelected,
                          ]}
                        >
                          {freq.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Preferred Pickup Times */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Preferred Pickup Times
                  </Text>
                  <View style={styles.pickupTimesContainer}>
                    {['morning', 'afternoon', 'evening', 'night'].map(
                      (time) => (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles.pickupTimeSlot,
                            preferredPickupTimes.includes(time) &&
                              styles.pickupTimeSlotSelected,
                          ]}
                          onPress={() => togglePickupTime(time)}
                        >
                          <Text
                            style={[
                              styles.pickupTimeSlotText,
                              preferredPickupTimes.includes(time) &&
                                styles.pickupTimeSlotTextSelected,
                            ]}
                          >
                            {time.charAt(0).toUpperCase() + time.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>

                {/* Special Instructions */}
                <TextInput
                  label="Special Instructions (Optional)"
                  value={formData.specialInstructions}
                  onChangeText={(text) =>
                    setFormData((prev) => ({
                      ...prev,
                      specialInstructions: text.slice(0, 500),
                    }))
                  }
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                  placeholder="Any special requirements for pickup?"
                />
                <Text style={styles.characterCount}>
                  {formData.specialInstructions.length}/500 characters
                </Text>
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
                {isLogin
                  ? "Don't have an account? "
                  : 'Already have an account? '}
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  donorTypeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  donorTypeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  donorTypeOptionSelected: {
    backgroundColor: '#FF8A50',
    borderColor: '#FF8A50',
  },
  donorTypeOptionText: {
    fontSize: 14,
    color: '#718096',
  },
  donorTypeOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  frequencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  frequencyOptionSelected: {
    backgroundColor: '#FF8A50',
    borderColor: '#FF8A50',
  },
  frequencyOptionText: {
    fontSize: 14,
    color: '#718096',
  },
  frequencyOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pickupTimesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickupTimeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  pickupTimeSlotSelected: {
    backgroundColor: '#FF8A50',
    borderColor: '#FF8A50',
  },
  pickupTimeSlotText: {
    fontSize: 14,
    color: '#718096',
  },
  pickupTimeSlotTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  characterCount: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'right',
    marginTop: -12,
    marginBottom: 16,
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
