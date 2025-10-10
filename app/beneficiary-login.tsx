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
import { TextInput, Button, Card, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { BeneficiaryAuthApi } from '../services/beneficiaryAuthApi';
import { BeneficiaryRegisterData } from '../types/beneficiaryAuth';

const { width } = Dimensions.get('window');

export default function BeneficiaryLoginScreen() {
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
      country: '',
      coordinates: {
        latitude: 0,
        longitude: 0,
      },
    },
    householdSize: 1,
    dietaryRestrictions: [] as string[],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
  });
  const [showPassword, setShowPassword] = useState(false);

  const dietaryOptions = [
    'vegetarian',
    'vegan',
    'halal',
    'kosher',
    'gluten-free',
    'dairy-free',
    'nut-free',
  ];

  const toggleDietaryRestriction = (restriction: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      if (isLogin) {
        await BeneficiaryAuthApi.login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        const registerData: BeneficiaryRegisterData = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          address: {
            street: formData.address.street,
            city: formData.address.city,
            state: formData.address.state,
            zipCode: formData.address.zipCode,
            country: formData.address.country,
            coordinates: {
              latitude: formData.address.coordinates.latitude,
              longitude: formData.address.coordinates.longitude,
            }
          },
          householdSize: formData.householdSize,
          dietaryRestrictions: formData.dietaryRestrictions,
          emergencyContact: formData.emergencyContact
        };
        
        await BeneficiaryAuthApi.register(registerData);
      }
      router.replace('/beneficiary/dashboard');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Registration failed'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
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
            {isLogin ? 'Welcome Back!' : 'Join as Beneficiary'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? 'Sign in to access food assistance'
              : 'Register to receive food support'}
          </Text>
        </View>

        <Card style={styles.formCard}>
          <Card.Content style={styles.formContent}>
            <TextInput
              label="Email"
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
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
            />

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
                  label="Address"
                  value={formData.address.street}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, address: { ...prev.address, street: text } }))}
                  mode="outlined"
                  multiline
                  numberOfLines={2}
                  style={styles.input}
                />

                <TextInput
                  label="City"
                  value={formData.address.city}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, address: { ...prev.address, city: text } }))}
                  mode="outlined"
                  style={styles.input}
                />

                <TextInput
                  label="State"
                  value={formData.address.state}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, address: { ...prev.address, state: text } }))}
                  mode="outlined"
                  style={styles.input}
                />

                <TextInput
                  label="ZIP Code"
                  value={formData.address.zipCode}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, address: { ...prev.address, zipCode: text } }))}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                />

                <TextInput
                  label="Country"
                  value={formData.address.country}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, address: { ...prev.address, country: text } }))}
                  mode="outlined"
                  style={styles.input}
                />

                <TextInput
                  label="Household Size"
                  value={String(formData.householdSize)}
                  onChangeText={(text) => {
                    const size = parseInt(text) || 1;
                    setFormData(prev => ({ ...prev, householdSize: size }));
                  }}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                />

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
                  <View style={styles.dietaryContainer}>
                    {dietaryOptions.map((restriction) => (
                      <Chip
                        key={restriction}
                        selected={formData.dietaryRestrictions.includes(restriction)}
                        onPress={() => toggleDietaryRestriction(restriction)}
                        style={styles.dietaryChip}
                        mode="outlined"
                      >
                        {restriction}
                      </Chip>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Emergency Contact</Text>
                  <TextInput
                    label="Contact Name"
                    value={formData.emergencyContact.name}
                    onChangeText={(text) =>
                      setFormData(prev => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, name: text },
                      }))
                    }
                    mode="outlined"
                    style={styles.input}
                  />
                  <TextInput
                    label="Contact Phone"
                    value={formData.emergencyContact.phone}
                    onChangeText={(text) =>
                      setFormData(prev => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, phone: text },
                      }))
                    }
                    mode="outlined"
                    keyboardType="phone-pad"
                    style={styles.input}
                  />
                  <TextInput
                    label="Relationship"
                    value={formData.emergencyContact.relationship}
                    onChangeText={(text) =>
                      setFormData(prev => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, relationship: text },
                      }))
                    }
                    mode="outlined"
                    style={styles.input}
                  />
                </View>
              </>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              loading={authState.loading}
              disabled={authState.loading}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>

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
    paddingHorizontal: 20,
  },
  formCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  formContent: {
    padding: 16,
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
  dietaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietaryChip: {
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: '#FF8A50',
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