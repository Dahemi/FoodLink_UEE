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
import { useBeneficiaryAuth } from '../context/BeneficiaryAuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { BeneficiaryAuthApi } from '../services/beneficiaryAuthApi';
import { BeneficiaryRegisterData } from '../types/beneficiaryAuth';
import { loginStyles } from '../styles/beneficiary/loginStyles';

const { width } = Dimensions.get('window');

export default function BeneficiaryLoginScreen() {
  const router = useRouter();
  const { login, register, authState } = useBeneficiaryAuth(); // Use the new context
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
        latitude: null, // Change from 0 to null
        longitude: null // Change from 0 to null
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

  try {
    if (isLogin) {
      // Use context login only
      await login({
        email: formData.email,
        password: formData.password
      });
      router.replace('/beneficiary/dashboard');
    } else {
      // Registration flow remains the same
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
          country: formData.address.country || 'Sri Lanka',
          coordinates: {
            latitude: 6.9271, // Default to Colombo
            longitude: 79.8612
          }
        },
        householdSize: formData.householdSize,
        dietaryRestrictions: formData.dietaryRestrictions,
        emergencyContact: formData.emergencyContact
      };
      
      await register(registerData);
      router.replace('/beneficiary/dashboard');
    }
  } catch (error) {
    Alert.alert(
      'Error',
      error instanceof Error ? error.message : 'Authentication failed'
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

const styles = loginStyles;