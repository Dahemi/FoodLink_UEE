import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Button,
  TextInput,
  Divider,
  Avatar,
  Switch,
  Chip,
  IconButton,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDonorAuth } from '../../context/DonorAuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LoadingSpinner from '../../components/LoadingSpinner';
import DonorBottomNav from '../../components/donor/DonorBottomNav';

const { width } = Dimensions.get('window');

export default function DonorProfile() {
  const router = useRouter();
  const { authState, updateProfile, logout } = useDonorAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: authState.user?.name || '',
    email: authState.user?.email || '',
    phone: authState.user?.phone || '',
    businessName: authState.user?.businessName || '',
    donorType: authState.user?.donorType || 'individual',
    averageDonationFrequency: authState.user?.averageDonationFrequency || 'occasional',
    preferredPickupTimes: authState.user?.preferredPickupTimes || [],
    specialInstructions: authState.user?.specialInstructions || '',
    address: authState.user?.address || '',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    donationReminders: true,
    communityUpdates: true,
    achievements: true,
  });

  const stats = {
    totalDonations: 45,
    mealsProvided: 1250,
    familiesHelped: 320,
    impactScore: 95,
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateProfile(formData);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/donor-login');
        },
      },
    ]);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3748" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Profile</Text>
      <Button mode="text" onPress={() => setEditing(!editing)} textColor="#FF8A50">
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
            label={getInitials(authState.user?.name || 'D')}
            style={styles.avatar}
          />
          {editing && (
            <TouchableOpacity style={styles.editAvatarButton}>
              <MaterialCommunityIcons name="camera" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{authState.user?.name}</Text>
          <Text style={styles.profileEmail}>{authState.user?.email}</Text>
          <View style={styles.verificationBadge}>
            <MaterialCommunityIcons name="check-decagram" size={16} color="#10B981" />
            <Text style={styles.verificationText}>Verified Donor</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderImpactStats = () => (
    <Card style={styles.statsCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Your Impact</Text>
        <View style={styles.statsGrid}>
          <View style={styles.impactStat}>
            <View style={[styles.impactIconContainer, { backgroundColor: '#FFF7ED' }]}>
              <MaterialCommunityIcons name="gift" size={24} color="#FF8A50" />
            </View>
            <Text style={styles.impactValue}>{stats.totalDonations}</Text>
            <Text style={styles.impactLabel}>Total Donations</Text>
          </View>

          <View style={styles.impactStat}>
            <View style={[styles.impactIconContainer, { backgroundColor: '#DBEAFE' }]}>
              <MaterialCommunityIcons name="food" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.impactValue}>{stats.mealsProvided.toLocaleString()}</Text>
            <Text style={styles.impactLabel}>Meals Provided</Text>
          </View>

          <View style={styles.impactStat}>
            <View style={[styles.impactIconContainer, { backgroundColor: '#D1FAE5' }]}>
              <MaterialCommunityIcons name="account-group" size={24} color="#10B981" />
            </View>
            <Text style={styles.impactValue}>{stats.familiesHelped}</Text>
            <Text style={styles.impactLabel}>Families Helped</Text>
          </View>

          <View style={styles.impactStat}>
            <View style={[styles.impactIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="star" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.impactValue}>{stats.impactScore}</Text>
            <Text style={styles.impactLabel}>Impact Score</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderPersonalInfo = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <TextInput
          label="Full Name"
          value={formData.name}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
          mode="outlined"
          disabled={!editing}
          style={styles.input}
        />

        <TextInput
          label="Email"
          value={formData.email}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
          mode="outlined"
          disabled={true}
          style={styles.input}
          keyboardType="email-address"
        />

        <TextInput
          label="Phone Number"
          value={formData.phone}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, phone: text }))}
          mode="outlined"
          disabled={!editing}
          style={styles.input}
          keyboardType="phone-pad"
        />

        <TextInput
          label="Address"
          value={formData.address}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, address: text }))}
          mode="outlined"
          disabled={!editing}
          style={styles.input}
          multiline
          numberOfLines={3}
        />
      </Card.Content>
    </Card>
  );

  const renderDonorDetails = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Donor Details</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Donor Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {['individual', 'restaurant', 'hotel', 'catering', 'grocery', 'bakery'].map((type) => (
              <Chip
                key={type}
                mode={formData.donorType === type ? 'flat' : 'outlined'}
                selected={formData.donorType === type}
                onPress={() => editing && setFormData((prev) => ({ ...prev, donorType: type as any }))}
                style={styles.chip}
                disabled={!editing}
                selectedColor={formData.donorType === type ? '#FF8A50' : undefined}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {formData.donorType !== 'individual' && (
          <TextInput
            label="Business Name"
            value={formData.businessName}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, businessName: text }))}
            mode="outlined"
            disabled={!editing}
            style={styles.input}
          />
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Donation Frequency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {['daily', 'weekly', 'monthly', 'occasional'].map((freq) => (
              <Chip
                key={freq}
                mode={formData.averageDonationFrequency === freq ? 'flat' : 'outlined'}
                selected={formData.averageDonationFrequency === freq}
                onPress={() =>
                  editing &&
                  setFormData((prev) => ({ ...prev, averageDonationFrequency: freq as any }))
                }
                style={styles.chip}
                disabled={!editing}
                selectedColor={formData.averageDonationFrequency === freq ? '#FF8A50' : undefined}
              >
                {freq.charAt(0).toUpperCase() + freq.slice(1)}
              </Chip>
            ))}
          </ScrollView>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Preferred Pickup Times</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {['morning', 'afternoon', 'evening', 'night'].map((time) => (
              <Chip
                key={time}
                mode={formData.preferredPickupTimes.includes(time) ? 'flat' : 'outlined'}
                selected={formData.preferredPickupTimes.includes(time)}
                onPress={() => {
                  if (editing) {
                    setFormData((prev) => ({
                      ...prev,
                      preferredPickupTimes: prev.preferredPickupTimes.includes(time)
                        ? prev.preferredPickupTimes.filter((t) => t !== time)
                        : [...prev.preferredPickupTimes, time],
                    }));
                  }
                }}
                style={styles.chip}
                disabled={!editing}
                selectedColor={formData.preferredPickupTimes.includes(time) ? '#FF8A50' : undefined}
              >
                {time.charAt(0).toUpperCase() + time.slice(1)}
              </Chip>
            ))}
          </ScrollView>
        </View>

        <TextInput
          label="Special Instructions"
          value={formData.specialInstructions}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, specialInstructions: text }))}
          mode="outlined"
          disabled={!editing}
          style={styles.input}
          multiline
          numberOfLines={3}
          placeholder="Any special instructions for pickup..."
        />
      </Card.Content>
    </Card>
  );

  const renderNotificationSettings = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Notification Settings</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Email Notifications</Text>
            <Text style={styles.settingDescription}>Receive updates via email</Text>
          </View>
          <Switch
            value={notifications.email}
            onValueChange={(value) => setNotifications((prev) => ({ ...prev, email: value }))}
            color="#FF8A50"
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDescription}>Get real-time alerts on your device</Text>
          </View>
          <Switch
            value={notifications.push}
            onValueChange={(value) => setNotifications((prev) => ({ ...prev, push: value }))}
            color="#FF8A50"
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Donation Reminders</Text>
            <Text style={styles.settingDescription}>Reminders for recurring donations</Text>
          </View>
          <Switch
            value={notifications.donationReminders}
            onValueChange={(value) =>
              setNotifications((prev) => ({ ...prev, donationReminders: value }))
            }
            color="#FF8A50"
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Community Updates</Text>
            <Text style={styles.settingDescription}>News and stories from your community</Text>
          </View>
          <Switch
            value={notifications.communityUpdates}
            onValueChange={(value) =>
              setNotifications((prev) => ({ ...prev, communityUpdates: value }))
            }
            color="#FF8A50"
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Achievement Alerts</Text>
            <Text style={styles.settingDescription}>Get notified of new badges and milestones</Text>
          </View>
          <Switch
            value={notifications.achievements}
            onValueChange={(value) => setNotifications((prev) => ({ ...prev, achievements: value }))}
            color="#FF8A50"
          />
        </View>
      </Card.Content>
    </Card>
  );

  const renderActionButtons = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Account Actions</Text>

        <Button
          mode="outlined"
          icon="shield-check"
          onPress={() => Alert.alert('Info', 'Change password feature coming soon')}
          style={styles.actionButton}
        >
          Change Password
        </Button>

        <Button
          mode="outlined"
          icon="download"
          onPress={() => Alert.alert('Info', 'Download impact report feature coming soon')}
          style={styles.actionButton}
        >
          Download Impact Report
        </Button>

        <Button
          mode="outlined"
          icon="file-document"
          onPress={() => Alert.alert('Info', 'Tax documents feature coming soon')}
          style={styles.actionButton}
        >
          View Tax Documents
        </Button>

        <Button
          mode="outlined"
          icon="help-circle"
          onPress={() => Alert.alert('Info', 'Help & Support feature coming soon')}
          style={styles.actionButton}
        >
          Help & Support
        </Button>

        <Button
          mode="contained"
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor="#F44336"
        >
          Logout
        </Button>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner message="Updating profile..." size="large" color="#FF8A50" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderProfileCard()}
        {renderImpactStats()}
        {renderPersonalInfo()}
        {renderDonorDetails()}
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
            buttonColor="#FF8A50"
            icon="content-save"
          >
            Save Changes
          </Button>
        </View>
      )}

      {/* Bottom Navigation */}
      <DonorBottomNav />
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
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: 20,
    marginBottom: 12,
    elevation: 3,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: '#FF8A50',
  },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF8A50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 4,
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  impactStat: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    marginBottom: 12,
  },
  impactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  impactValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  impactLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
  sectionCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#718096',
  },
  divider: {
    marginVertical: 8,
  },
  actionButton: {
    marginBottom: 12,
    borderColor: '#E2E8F0',
  },
  logoutButton: {
    marginTop: 8,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 4,
  },
  saveButton: {
    paddingVertical: 8,
  },
});