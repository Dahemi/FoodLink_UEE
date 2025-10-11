import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, TextInput, Divider, Avatar, Switch, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useNGOAuth } from '../../context/NGOAuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LoadingSpinner from '../../components/LoadingSpinner';

const { width } = Dimensions.get('window');

export default function NGOProfile() {
  const router = useRouter();
  const { authState, updateProfile, logout } = useNGOAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: authState.user?.name || '',
    phone: authState.user?.phone || '',
    email: authState.user?.email || '',
    registrationNumber: authState.user?.registrationNumber || '',
    organizationType: authState.user?.organizationType || 'ngo',
    capacity: authState.user?.capacity || 100,
    website: authState.user?.website || '',
    description: authState.user?.description || '',
    address: {
      street: authState.user?.address?.street || '',
      city: authState.user?.address?.city || '',
      state: authState.user?.address?.state || '',
      zipCode: authState.user?.address?.zipCode || '',
      country: authState.user?.address?.country || 'Sri Lanka',
    },
    operatingHours: {
      start: authState.user?.operatingHours?.start || '09:00',
      end: authState.user?.operatingHours?.end || '17:00',
    },
  });

  const [notifications, setNotifications] = useState({
    donationAlerts: true,
    volunteerUpdates: true,
    requirementUpdates: true,
    emailNotifications: true,
    urgentAlerts: true,
  });

  // Update form data when authState changes
  useEffect(() => {
    if (authState.user) {
      setFormData({
        name: authState.user.name || '',
        phone: authState.user.phone || '',
        email: authState.user.email || '',
        registrationNumber: authState.user.registrationNumber || '',
        organizationType: authState.user.organizationType || 'ngo',
        capacity: authState.user.capacity || 100,
        website: authState.user.website || '',
        description: authState.user.description || '',
        address: {
          street: authState.user.address?.street || '',
          city: authState.user.address?.city || '',
          state: authState.user.address?.state || '',
          zipCode: authState.user.address?.zipCode || '',
          country: authState.user.address?.country || 'Sri Lanka',
        },
        operatingHours: {
          start: authState.user.operatingHours?.start || '09:00',
          end: authState.user.operatingHours?.end || '17:00',
        },
      });
    }
  }, [authState.user]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await updateProfile(formData);
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

  const renderHeader = () => (
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
  );

  const renderProfileCard = () => (
    <Card style={styles.profileCard}>
      <Card.Content style={styles.profileContent}>
        <View style={styles.avatarSection}>
          <Avatar.Text 
            size={80} 
            label={getInitials(authState.user?.name || 'NGO')}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {authState.user?.name || 'NGO'}
            </Text>
            <Text style={styles.profileEmail}>
              {authState.user?.email || 'ngo@example.com'}
            </Text>
            <Text style={styles.profileType}>
              {authState.user?.organizationType?.toUpperCase() || 'NGO'}
            </Text>
            <View style={styles.verificationBadge}>
              <Chip
                mode="flat"
                style={styles.verificationChip}
                textStyle={styles.verificationText}
                icon={authState.user?.isVerified ? 'check-circle' : 'clock'}
              >
                {authState.user?.isVerified ? 'Verified' : 'Pending Verification'}
              </Chip>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderOrganizationInfo = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Organization Information</Text>
        
        <TextInput
          label="Organization Name"
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          mode="outlined"
          disabled={!editing}
          style={styles.input}
        />

        <TextInput
          label="Registration Number"
          value={formData.registrationNumber}
          onChangeText={(text) => setFormData(prev => ({ ...prev, registrationNumber: text }))}
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
          label="Email Address"
          value={formData.email}
          mode="outlined"
          disabled={true}
          style={styles.input}
        />

        <TextInput
          label="Website (Optional)"
          value={formData.website}
          onChangeText={(text) => setFormData(prev => ({ ...prev, website: text }))}
          mode="outlined"
          disabled={!editing}
          style={styles.input}
        />

        <TextInput
          label="Description"
          value={formData.description}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          mode="outlined"
          multiline
          numberOfLines={3}
          disabled={!editing}
          style={styles.input}
        />
      </Card.Content>
    </Card>
  );

  const renderAddressInfo = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Address Information</Text>
        
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
  );

  const renderOperatingInfo = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Operating Information</Text>
        
        <TextInput
          label="Serving Capacity (people)"
          value={formData.capacity.toString()}
          onChangeText={(text) => setFormData(prev => ({ 
            ...prev, 
            capacity: parseInt(text) || 100 
          }))}
          mode="outlined"
          keyboardType="numeric"
          disabled={!editing}
          style={styles.input}
        />

        <Text style={styles.subsectionTitle}>Operating Hours</Text>
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
            disabled={!editing}
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
            disabled={!editing}
            style={[styles.input, styles.addressInput]}
          />
        </View>
      </Card.Content>
    </Card>
  );

  const renderNotificationSettings = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Notification Settings</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Donation Alerts</Text>
            <Text style={styles.settingDescription}>Get notified when new donations are available</Text>
          </View>
          <Switch
            value={notifications.donationAlerts}
            onValueChange={(value) => setNotifications(prev => ({ ...prev, donationAlerts: value }))}
            color="#FF8A50"
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Volunteer Updates</Text>
            <Text style={styles.settingDescription}>Updates about volunteer assignments and activities</Text>
          </View>
          <Switch
            value={notifications.volunteerUpdates}
            onValueChange={(value) => setNotifications(prev => ({ ...prev, volunteerUpdates: value }))}
            color="#FF8A50"
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Requirement Updates</Text>
            <Text style={styles.settingDescription}>Status updates on your food requirements</Text>
          </View>
          <Switch
            value={notifications.requirementUpdates}
            onValueChange={(value) => setNotifications(prev => ({ ...prev, requirementUpdates: value }))}
            color="#FF8A50"
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Email Notifications</Text>
            <Text style={styles.settingDescription}>Receive notifications via email</Text>
          </View>
          <Switch
            value={notifications.emailNotifications}
            onValueChange={(value) => setNotifications(prev => ({ ...prev, emailNotifications: value }))}
            color="#FF8A50"
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Urgent Alerts</Text>
            <Text style={styles.settingDescription}>Push notifications for urgent requests</Text>
          </View>
          <Switch
            value={notifications.urgentAlerts}
            onValueChange={(value) => setNotifications(prev => ({ ...prev, urgentAlerts: value }))}
            color="#FF8A50"
          />
        </View>
      </Card.Content>
    </Card>
  );

  const renderStatsCard = () => {
    const stats = {
      totalRequirements: 45,
      peopleHelped: 2340,
      activeVolunteers: 18,
      monthlyImpact: 1250,
    };

    return (
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Impact Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalRequirements}</Text>
              <Text style={styles.statLabel}>Total Requirements</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.peopleHelped.toLocaleString()}</Text>
              <Text style={styles.statLabel}>People Helped</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.activeVolunteers}</Text>
              <Text style={styles.statLabel}>Active Volunteers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.monthlyImpact.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Monthly Meals</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderActionButtons = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        
        <Button
          mode="outlined"
          icon="download"
          onPress={() => Alert.alert('Info', 'Impact report download will be implemented soon')}
          style={styles.actionButton}
        >
          Download Impact Report
        </Button>

        <Button
          mode="outlined"
          icon="file-document"
          onPress={() => Alert.alert('Info', 'Verification documents view will be implemented soon')}
          style={styles.actionButton}
        >
          View Verification Documents
        </Button>

        <Button
          mode="outlined"
          icon="cog"
          onPress={() => Alert.alert('Info', 'Advanced settings will be implemented soon')}
          style={styles.actionButton}
        >
          Advanced Settings
        </Button>

        <Button
          mode="outlined"
          icon="help-circle"
          onPress={() => Alert.alert('Info', 'Help & Support will be implemented soon')}
          style={styles.actionButton}
        >
          Help & Support
        </Button>

        <Divider style={styles.divider} />

        <Button
          mode="contained"
          icon="logout"
          onPress={handleLogout}
          style={[styles.actionButton, styles.logoutButton]}
          buttonColor="#F44336"
        >
          Logout
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderProfileCard()}
        {renderStatsCard()}
        {renderOrganizationInfo()}
        {renderAddressInfo()}
        {renderOperatingInfo()}
        {renderNotificationSettings()}
        {renderActionButtons()}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {editing && (
        <View style={styles.saveButtonContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            loading={loading}
            disabled={loading}
          >
            Save Changes
          </Button>
        </View>
      )}
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
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: 20,
    elevation: 4,
  },
  profileContent: {
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    width: '100%',
  },
  avatar: {
    backgroundColor: '#FF8A50',
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 4,
  },
  profileType: {
    fontSize: 14,
    color: '#FF8A50',
    fontWeight: '600',
    marginBottom: 12,
  },
  verificationBadge: {
    alignItems: 'center',
  },
  verificationChip: {
    backgroundColor: '#E6FFFA',
  },
  verificationText: {
    color: '#38A169',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 12,
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addressInput: {
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 18,
  },
  divider: {
    marginVertical: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: (width - 80) / 2,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF8A50',
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
    textAlign: 'center',
  },
  actionButton: {
    marginBottom: 12,
  },
  logoutButton: {
    marginTop: 8,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
  },
  saveButton: {
    backgroundColor: '#FF8A50',
  },
});