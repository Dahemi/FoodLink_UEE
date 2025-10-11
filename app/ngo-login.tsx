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
import { useNGOAuth } from '../context/NGOAuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const { width, height } = Dimensions.get('window');

export default function NGOLoginScreen() {
  const router = useRouter();
  const { login, register, authState } = useNGOAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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
      country: 'Sri Lanka',
      coordinates: {
        latitude: 6.9271, // Default to Colombo, Sri Lanka
        longitude: 79.8612,
      },
    },
    registrationNumber: '',
    organizationType: 'ngo' as 'charity' | 'ngo' | 'religious' | 'community' | 'government',
    servingAreas: [] as string[],
    capacity: 100,
    operatingHours: {
      start: '09:00',
      end: '17:00',
    },
    website: '',
    description: '',
    certifications: [] as string[],
  });

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

    if (!isLogin && (!formData.name || !formData.phone || !formData.registrationNumber || 
        !formData.address.street || !formData.address.city || !formData.address.state || 
        !formData.address.zipCode)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

  setLoading(true);
  try {
    if (isLogin) {
      console.log('Attempting login with:', formData.email); // Debug log
      await login({
        email: formData.email,
        password: formData.password,
      });
      console.log('Login successful, navigating to NGO home'); // Debug log
      
      // Wait a moment for auth state to update, then navigate
      setTimeout(() => {
        router.replace('/NGO');
      }, 100);
    } else {
      // Prepare registration data
      const registrationData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        registrationNumber: formData.registrationNumber,
        organizationType: formData.organizationType,
        servingAreas: formData.servingAreas,
        capacity: formData.capacity,
        operatingHours: formData.operatingHours,
        website: formData.website || undefined,
        description: formData.description || undefined,
        certifications: formData.certifications,
      };

      console.log('Attempting registration for:', formData.name); // Debug log
      await register(registrationData);
      console.log('Registration successful, navigating to NGO home'); // Debug log
      
      // Wait a moment for auth state to update, then navigate
      setTimeout(() => {
        router.replace('/NGO');
      }, 100);
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


  if (loading) {
    return (
      <LoadingSpinner 
        message={isLogin ? "Signing you in..." : "Creating your NGO account..."} 
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
            {isLogin ? 'Welcome Back, NGO!' : 'Register Your NGO'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin 
              ? 'Sign in to your NGO account to continue helping your community'
              : 'Create your NGO account to start receiving food donations and coordinating with volunteers'
            }
          </Text>
        </View>

        {/* Form */}
        <Card style={styles.formCard}>
          <Card.Content style={styles.formContent}>
            <TextInput
              label="Email Address"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              mode="outlined"
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(!showPassword)} 
                />
              }
              style={styles.input}
            />

            {/* Registration Fields */}
            {!isLogin && (
              <>
                <TextInput
                  label="NGO Name"
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  mode="outlined"
                  style={styles.input}
                />

                <TextInput
                  label="Registration Number"
                  value={formData.registrationNumber}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, registrationNumber: text }))}
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

                {/* Organization Type */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Organization Type</Text>
                  <View style={styles.organizationOptions}>
                    {['charity', 'ngo', 'religious', 'community', 'government'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.organizationOption,
                          formData.organizationType === type && styles.organizationOptionSelected,
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, organizationType: type as any }))}
                      >
                        <Text style={[
                          styles.organizationOptionText,
                          formData.organizationType === type && styles.organizationOptionTextSelected,
                        ]}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Address Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>NGO Address</Text>
                  
                  <TextInput
                    label="Street Address"
                    value={formData.address.street}
                    onChangeText={(text) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, street: text } 
                    }))}
                    mode="outlined"
                    style={styles.input}
                  />

                  <View style={styles.addressRow}>
                    <TextInput
                      label="City"
                      value={formData.address.city}
                      onChangeText={(text) => setFormData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, city: text } 
                      }))}
                      mode="outlined"
                      style={[styles.input, styles.addressInput]}
                    />
                    <TextInput
                      label="State"
                      value={formData.address.state}
                      onChangeText={(text) => setFormData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, state: text } 
                      }))}
                      mode="outlined"
                      style={[styles.input, styles.addressInput]}
                    />
                  </View>

                  <View style={styles.addressRow}>
                    <TextInput
                      label="ZIP Code"
                      value={formData.address.zipCode}
                      onChangeText={(text) => setFormData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, zipCode: text } 
                      }))}
                      mode="outlined"
                      keyboardType="numeric"
                      style={[styles.input, styles.addressInput]}
                    />
                    <TextInput
                      label="Country"
                      value={formData.address.country}
                      onChangeText={(text) => setFormData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, country: text } 
                      }))}
                      mode="outlined"
                      style={[styles.input, styles.addressInput]}
                    />
                  </View>
                </View>

                {/* Capacity */}
                <TextInput
                  label="Serving Capacity (number of people)"
                  value={formData.capacity.toString()}
                  onChangeText={(text) => setFormData(prev => ({ 
                    ...prev, 
                    capacity: parseInt(text) || 100 
                  }))}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                />

                {/* Operating Hours */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Operating Hours</Text>
                  <View style={styles.addressRow}>
                    <TextInput
                      label="Start Time"
                      value={formData.operatingHours.start}
                      onChangeText={(text) => setFormData(prev => ({ 
                        ...prev, 
                        operatingHours: { ...prev.operatingHours, start: text } 
                      }))}
                      mode="outlined"
                      placeholder="09:00"
                      style={[styles.input, styles.addressInput]}
                    />
                    <TextInput
                      label="End Time"
                      value={formData.operatingHours.end}
                      onChangeText={(text) => setFormData(prev => ({ 
                        ...prev, 
                        operatingHours: { ...prev.operatingHours, end: text } 
                      }))}
                      mode="outlined"
                      placeholder="17:00"
                      style={[styles.input, styles.addressInput]}
                    />
                  </View>
                </View>

                {/* Optional Fields */}
                <TextInput
                  label="Website (Optional)"
                  value={formData.website}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, website: text }))}
                  mode="outlined"
                  keyboardType="url"
                  style={styles.input}
                />

                <TextInput
                  label="Description (Optional)"
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />
              </>
            )}

            <Divider style={{ marginVertical: 20 }} />

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              labelStyle={styles.submitButtonText}
              loading={loading}
              disabled={loading}
            >
              {isLogin ? 'Sign In' : 'Create NGO Account'}
            </Button>

            {/* Toggle Login/Register */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </Text>
              <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                <Text style={styles.toggleLink}>
                  {isLogin ? 'Register NGO' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Keep all the existing styles...
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
  organizationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  organizationOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  organizationOptionSelected: {
    backgroundColor: '#FF8A50',
    borderColor: '#FF8A50',
  },
  organizationOptionText: {
    fontSize: 14,
    color: '#718096',
  },
  organizationOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
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