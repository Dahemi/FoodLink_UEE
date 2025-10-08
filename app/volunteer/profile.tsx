import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, TextInput, Divider, Avatar, Switch } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const { width } = Dimensions.get('window');

export default function VolunteerProfile() {
  const router = useRouter();
  const { authState, updateProfile, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: authState.user?.name || '',
    phone: authState.user?.phone || '',
    email: authState.user?.email || '',
    address: {
      street: authState.user?.address?.street || '',
      city: authState.user?.address?.city || '',
      state: authState.user?.address?.state || '',
      zipCode: authState.user?.address?.zipCode || '',
      country: authState.user?.address?.country || 'India',
      coordinates: {
        latitude: authState.user?.address?.coordinates?.latitude || 6.9271,
        longitude: authState.user?.address?.coordinates?.longitude || 79.8612,
      },
    },
    vehicleType: authState.user?.vehicleType || 'bike',
    maxDistance: authState.user?.maxDistance || 10,
    availability: authState.user?.availability || {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
    preferredTimeSlots: authState.user?.preferredTimeSlots || ['morning', 'afternoon'],
  });

  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    emailNotifications: true,
    taskReminders: true,
    urgentAlerts: true,
  });

  // Update form data when authState changes
  useEffect(() => {
    if (authState.user) {
      setFormData({
        name: authState.user.name || '',
        phone: authState.user.phone || '',
        email: authState.user.email || '',
        address: {
          street: authState.user.address?.street || '',
          city: authState.user.address?.city || '',
          state: authState.user.address?.state || '',
          zipCode: authState.user.address?.zipCode || '',
          country: authState.user.address?.country || 'India',
          coordinates: {
            latitude: authState.user.address?.coordinates?.latitude || 6.9271,
            longitude: authState.user.address?.coordinates?.longitude || 79.8612,
          },
        },
        vehicleType: authState.user.vehicleType || 'bike',
        maxDistance: authState.user.maxDistance || 10,
        availability: authState.user.availability || {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false,
        },
        preferredTimeSlots: authState.user.preferredTimeSlots || ['morning', 'afternoon'],
      });
    }
  }, [authState.user]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Ensure coordinates are numbers
    const profileData = {
      ...formData,
      address: {
        ...formData.address,
        coordinates: {
          latitude: Number(formData.address.coordinates.latitude),
          longitude: Number(formData.address.coordinates.longitude),
        },
      },
    };

    setLoading(true);
    try {
      await updateProfile(profileData);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/role-selection');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <LoadingSpinner 
        message="Updating profile..." 
        size="large" 
        color="#FF8A50" 
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#F7FAFC" 
        translucent={false}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Button
          icon="arrow-left"
          mode="text"
          onPress={() => router.back()}
          textColor="#718096"
        >
          Back
        </Button>
        <Text style={styles.headerTitle}>Profile</Text>
        <Button
          mode="text"
          onPress={() => setEditing(!editing)}
          textColor="#FF8A50"
        >
          {editing ? 'Cancel' : 'Edit'}
        </Button>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <View style={styles.avatarSection}>
              <Avatar.Text 
                size={80} 
                label={getInitials(authState.user?.name || 'V')}
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {authState.user?.name || 'Volunteer'}
                </Text>
                <Text style={styles.profileEmail}>
                  {authState.user?.email || 'volunteer@example.com'}
                </Text>
                <Text style={styles.profileRole}>Volunteer</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Personal Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <TextInput
              label="Full Name"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              mode="outlined"
              disabled={!editing}
              style={styles.input}
            />

            <TextInput
              label="Phone Number"
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              mode="outlined"
              keyboardType="phone-pad"
              disabled={!editing}
              style={styles.input}
            />

            <TextInput
              label="Email"
              value={formData.email}
              mode="outlined"
              disabled={true}
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {/* Address Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Address</Text>
            
            <TextInput
              label="Street Address"
              value={formData.address.street}
              onChangeText={(text) => setFormData(prev => ({ 
                ...prev, 
                address: { ...prev.address, street: text } 
              }))}
              mode="outlined"
              disabled={!editing}
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
                disabled={!editing}
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
                disabled={!editing}
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
                disabled={!editing}
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
                disabled={!editing}
                style={[styles.input, styles.addressInput]}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Volunteer Preferences */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Volunteer Preferences</Text>
            
            <Text style={styles.preferenceLabel}>Vehicle Type</Text>
            <Text style={styles.preferenceValue}>
              {formData.vehicleType.charAt(0).toUpperCase() + formData.vehicleType.slice(1)}
            </Text>

            <Text style={styles.preferenceLabel}>Maximum Distance</Text>
            <Text style={styles.preferenceValue}>
              {formData.maxDistance} km
            </Text>
          </Card.Content>
        </Card>

        {/* Notifications */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Notifications</Text>
            
            <View style={styles.notificationRow}>
              <Text style={styles.notificationLabel}>Push Notifications</Text>
              <Switch
                value={notifications.pushNotifications}
                onValueChange={(value) => setNotifications(prev => ({ 
                  ...prev, 
                  pushNotifications: value 
                }))}
                color="#FF8A50"
              />
            </View>

            <View style={styles.notificationRow}>
              <Text style={styles.notificationLabel}>Email Notifications</Text>
              <Switch
                value={notifications.emailNotifications}
                onValueChange={(value) => setNotifications(prev => ({ 
                  ...prev, 
                  emailNotifications: value 
                }))}
                color="#FF8A50"
              />
            </View>

            <View style={styles.notificationRow}>
              <Text style={styles.notificationLabel}>Task Reminders</Text>
              <Switch
                value={notifications.taskReminders}
                onValueChange={(value) => setNotifications(prev => ({ 
                  ...prev, 
                  taskReminders: value 
                }))}
                color="#FF8A50"
              />
            </View>

            <View style={styles.notificationRow}>
              <Text style={styles.notificationLabel}>Urgent Alerts</Text>
              <Switch
                value={notifications.urgentAlerts}
                onValueChange={(value) => setNotifications(prev => ({ 
                  ...prev, 
                  urgentAlerts: value 
                }))}
                color="#FF8A50"
              />
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        {editing && (
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveButton}
              labelStyle={styles.saveButtonText}
            >
              Save Changes
            </Button>
          </View>
        )}

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            labelStyle={styles.logoutButtonText}
            icon="logout"
          >
            Logout
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: 20,
    elevation: 2,
    borderRadius: 12,
  },
  profileContent: {
    padding: 20,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#FF8A50',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 12,
    color: '#FF8A50',
    fontWeight: '500',
  },
  sectionCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
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
  preferenceLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  preferenceValue: {
    fontSize: 16,
    color: '#2D3748',
    marginBottom: 12,
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  notificationLabel: {
    fontSize: 16,
    color: '#2D3748',
  },
  actionButtons: {
    margin: 20,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#FF8A50',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    borderColor: '#E53E3E',
  },
  logoutButtonText: {
    color: '#E53E3E',
    fontSize: 16,
    fontWeight: '600',
  },
});
