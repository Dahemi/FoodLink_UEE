import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Chip, FAB, Avatar, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNGOAuth } from '../../context/NGOAuthContext';
import { DonationApi } from '../../services/createDonation';
import LoadingSpinner from '../../components/LoadingSpinner';
import { NGODonationApi } from '../../services/ngoDonationApi';


const { width } = Dimensions.get('window');

interface Requirement {
  id: string;
  title: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  servings: number;
  status: 'open' | 'partially_fulfilled' | 'fulfilled';
  createdAt: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'donation' | 'volunteer' | 'requirement' | 'system';
  time: string;
  read: boolean;
}

interface RecentDonation {
  id: string;
  title: string;
  donorName: string;
  quantity: string;
  servings: number;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  expiryTime: string;
  distance?: string;
}

export default function NGOHome() {
  const { authState } = useNGOAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const [totalAvailableDonations, setTotalAvailableDonations] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Dummy data for requirements (keep for now)
  const [requirements] = useState<Requirement[]>([
    {
      id: '1',
      title: 'Emergency Food for Flood Victims',
      urgency: 'urgent',
      servings: 200,
      status: 'open',
      createdAt: '2025-01-08T10:00:00Z',
    },
    {
      id: '2',
      title: 'Daily Meal Support - Children',
      urgency: 'high',
      servings: 150,
      status: 'partially_fulfilled',
      createdAt: '2025-01-07T14:00:00Z',
    },
    {
      id: '3',
      title: 'Weekend Community Kitchen',
      urgency: 'medium',
      servings: 100,
      status: 'open',
      createdAt: '2025-01-06T09:00:00Z',
    },
  ]);

  // Dummy data for notifications (keep for now)
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Donation Available',
      message: 'Fresh vegetables from Green Valley Restaurant - 30kg',
      type: 'donation',
      time: '10 mins ago',
      read: false,
    },
    {
      id: '2',
      title: 'Volunteer Assignment',
      message: 'John Doe accepted pickup task for Requirement #2',
      type: 'volunteer',
      time: '1 hour ago',
      read: false,
    },
    {
      id: '3',
      title: 'Requirement Update',
      message: 'Emergency Food requirement 50% fulfilled',
      type: 'requirement',
      time: '2 hours ago',
      read: true,
    },
  ]);

  // Stats with real donation count
  const stats = {
    totalRequirements: 12,
    activeRequirements: 8,
    peopleHelped: 1250,
    donationsReceived: totalAvailableDonations,
    volunteersManaged: 15,
    impactScore: 950,
  };

  // Fetch available donations
  const fetchDonations = async () => {
    try {
      console.log('=== Starting donation fetch ===');
      console.log('Auth state:', { 
        isAuthenticated: authState.isAuthenticated,
        hasUser: !!authState.user,
        userName: authState.user?.name 
      });

      if (!NGODonationApi.isEnabled()) {
        console.error('NGO Donation API not enabled - API_URL missing');
        setError('API not configured');
        setLoading(false);
        return;
      }

      console.log('Calling NGODonationApi.getAvailableDonations...');
      const response = await NGODonationApi.getAvailableDonations({
        status: 'available',
        limit: 5,
        page: 1,
      });

      console.log('Donations fetched successfully:', {
        count: response.donations.length,
        total: response.pagination.total,
        donations: response.donations.map(d => ({
          id: d._id,
          title: d.title,
          status: d.status,
          donorId: typeof d.donorId === 'object' ? d.donorId._id : d.donorId
        }))
      });

      // Filter out claimed donations (extra safety check)
      const availableDonations = response.donations.filter(
        donation => donation.status === 'available'
      );

      console.log('Available donations after filter:', availableDonations.length);

      if (availableDonations.length === 0) {
        console.log('No available donations found');
        setRecentDonations([]);
        setTotalAvailableDonations(0);
        setError(null);
        setLoading(false);
        return;
      }

      // Transform API response to match RecentDonation interface
      const transformedDonations: RecentDonation[] = availableDonations.map((donation) => {
        // Calculate time until expiry
        const expiryDate = new Date(donation.expiryDateTime);
        const now = new Date();
        const diffMs = expiryDate.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        
        let expiryTime: string;
        if (diffHours < 1) {
          expiryTime = 'Less than 1 hour';
        } else if (diffHours < 24) {
          expiryTime = `${diffHours} hours`;
        } else {
          expiryTime = `${diffDays} days`;
        }

        // Determine urgency based on expiry time
        let urgency: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
        if (diffHours < 2) {
          urgency = 'urgent';
        } else if (diffHours < 6) {
          urgency = 'high';
        } else if (diffHours < 24) {
          urgency = 'medium';
        } else {
          urgency = 'low';
        }

        // Get donor name - handle both populated and non-populated donorId
        let donorName = 'Unknown Donor';
        if (donation.donorId) {
          if (typeof donation.donorId === 'object' && donation.donorId !== null) {
            donorName = donation.donorId.businessName || donation.donorId.name || 'Donor';
          } else {
            donorName = 'Donor';
          }
        }

        console.log('Transformed donation:', {
          id: donation._id,
          title: donation.title,
          donorName,
          urgency,
          expiryTime
        });

        return {
          id: donation._id,
          title: donation.title,
          donorName: donorName,
          quantity: donation.foodDetails.quantity,
          servings: donation.foodDetails.estimatedServings,
          urgency: urgency,
          expiryTime: expiryTime,
          distance: undefined,
        };
      });

      console.log('Final transformed donations:', transformedDonations.length);

      setRecentDonations(transformedDonations);
      setTotalAvailableDonations(response.pagination.total);
      setError(null);
      
      console.log('=== Donation fetch completed successfully ===');
    } catch (error) {
      console.error('=== Error fetching donations ===');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      
      setError(error instanceof Error ? error.message : 'Failed to load donations');
      setRecentDonations([]);
      
      Alert.alert(
        'Error Loading Donations',
        'Failed to load donations. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: () => fetchDonations() },
          { text: 'OK' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      fetchDonations();
    } else {
      setLoading(false);
    }
  }, [authState.isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDonations();
    setRefreshing(false);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#FFC107';
      case 'low': return '#4CAF50';
      default: return '#718096';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#2196F3';
      case 'partially_fulfilled': return '#FF9800';
      case 'fulfilled': return '#4CAF50';
      default: return '#718096';
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.userInfo}>
        <Avatar.Text 
          size={50} 
          label={authState.user?.name?.charAt(0) || 'N'}
          style={styles.avatar}
        />
        <View style={styles.userDetails}>
          <Text style={styles.greeting}>Good morning!</Text>
          <Text style={styles.userName}>{authState.user?.name || 'NGO'}</Text>
          <Text style={styles.userType}>{authState.user?.organizationType}</Text>
        </View>
      </View>
      <IconButton
        icon="bell"
        size={24}
        iconColor="#FF8A50"
        onPress={() => {}}
        style={styles.notificationIcon}
      />
    </View>
  );

  const renderQuickStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>Quick Overview</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.activeRequirements}</Text>
          <Text style={styles.statLabel}>Active Requirements</Text>
          <MaterialCommunityIcons name="food" size={20} color="#FF8A50" />
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.peopleHelped}</Text>
          <Text style={styles.statLabel}>People Helped</Text>
          <MaterialCommunityIcons name="account-group" size={20} color="#4CAF50" />
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.donationsReceived}</Text>
          <Text style={styles.statLabel}>Available Donations</Text>
          <MaterialCommunityIcons name="gift" size={20} color="#2196F3" />
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.volunteersManaged}</Text>
          <Text style={styles.statLabel}>Active Volunteers</Text>
          <MaterialCommunityIcons name="account-heart" size={20} color="#9C27B0" />
        </View>
      </View>
    </View>
  );

  const renderActiveRequirements = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Requirements</Text>
        <Button mode="text" textColor="#FF8A50" onPress={() => {}}>
          View All
        </Button>
      </View>
      {requirements.slice(0, 2).map((requirement) => (
        <Card key={requirement.id} style={styles.requirementCard}>
          <Card.Content>
            <View style={styles.requirementHeader}>
              <View style={styles.requirementTitleContainer}>
                <Text style={styles.requirementTitle}>{requirement.title}</Text>
                <Text style={styles.servingsText}>
                  🍽️ {requirement.servings} servings needed
                </Text>
              </View>
              <View style={[
                styles.urgencyTag,
                { backgroundColor: getUrgencyColor(requirement.urgency) }
              ]}>
                <MaterialCommunityIcons 
                  name={requirement.urgency === 'urgent' ? 'alert-circle' : requirement.urgency === 'high' ? 'fire' : requirement.urgency === 'medium' ? 'clock-fast' : 'clock-outline'} 
                  size={14} 
                  color="#FFFFFF" 
                />
                <Text style={styles.urgencyTagText}>
                  {requirement.urgency.charAt(0).toUpperCase() + requirement.urgency.slice(1)}
                </Text>
              </View>
            </View>
            <View style={styles.requirementDetails}>
              <Chip
                mode="flat"
                style={[styles.statusChip, { backgroundColor: `${getStatusColor(requirement.status)}15` }]}
                textStyle={[styles.statusText, { color: getStatusColor(requirement.status) }]}
                icon={() => <MaterialCommunityIcons 
                  name={requirement.status === 'open' ? 'clock-outline' : requirement.status === 'fulfilled' ? 'check-circle' : 'progress-clock'} 
                  size={14} 
                  color={getStatusColor(requirement.status)} 
                />}
              >
                {requirement.status.replace('_', ' ')}
              </Chip>
              <Text style={styles.timeText}>
                {new Date(requirement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  const renderRecentDonations = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Available Donations</Text>
        <Button mode="text" textColor="#FF8A50" onPress={() => router.push('/NGO/donations')}>
          View All ({totalAvailableDonations})
        </Button>
      </View>
      
      {loading && recentDonations.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <LoadingSpinner message="Loading donations..." size="small" color="#FF8A50" />
          </Card.Content>
        </Card>
      ) : error ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <MaterialCommunityIcons name="alert-circle" size={48} color="#F44336" style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={styles.emptyText}>{error}</Text>
            <Button mode="outlined" onPress={fetchDonations} style={{ marginTop: 12 }}>
              Retry
            </Button>
          </Card.Content>
        </Card>
      ) : recentDonations.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <MaterialCommunityIcons name="food-off" size={48} color="#CBD5E0" style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={styles.emptyText}>No donations available at the moment</Text>
            <Text style={styles.emptySubtext}>New donations will appear here when donors post them</Text>
          </Card.Content>
        </Card>
      ) : (
        recentDonations.map((donation) => (
          <Card key={donation.id} style={styles.donationCard}>
            <Card.Content>
              <View style={styles.donationHeader}>
                <View style={styles.donationTitleContainer}>
                  <Text style={styles.donationTitle}>{donation.title}</Text>
                  <Text style={styles.donorText}>From: {donation.donorName}</Text>
                </View>
                <View style={[
                  styles.urgencyTag,
                  { backgroundColor: getUrgencyColor(donation.urgency) }
                ]}>
                  <MaterialCommunityIcons 
                    name={donation.urgency === 'urgent' ? 'alert-circle' : donation.urgency === 'high' ? 'fire' : donation.urgency === 'medium' ? 'clock-fast' : 'clock-outline'} 
                    size={14} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.urgencyTagText}>
                    {donation.urgency.charAt(0).toUpperCase() + donation.urgency.slice(1)}
                  </Text>
                </View>
              </View>
              <View style={styles.donationDetails}>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="food" size={16} color="#718096" />
                  <Text style={styles.detailText}>{donation.quantity}</Text>
                </View>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="account-group" size={16} color="#718096" />
                  <Text style={styles.detailText}>{donation.servings} servings</Text>
                </View>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="clock" size={16} color="#718096" />
                  <Text style={styles.detailText}>Expires in {donation.expiryTime}</Text>
                </View>
                {donation.distance && (
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="map-marker" size={16} color="#718096" />
                    <Text style={styles.detailText}>{donation.distance}</Text>
                  </View>
                )}
              </View>
              <Button
                mode="contained"
                onPress={() => router.push(`/NGO/donation-details?id=${donation.id}`)}
                style={styles.claimButton}
                labelStyle={styles.claimButtonText}
                icon="arrow-right"
                contentStyle={{ flexDirection: 'row-reverse' }}
              >
                View & Claim
              </Button>
            </Card.Content>
          </Card>
        ))
      )}
    </View>
  );

  const renderRecentNotifications = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Updates</Text>
        <Button mode="text" textColor="#FF8A50" onPress={() => {}}>
          View All
        </Button>
      </View>
      {notifications.slice(0, 3).map((notification) => (
        <Card key={notification.id} style={[styles.notificationCard, !notification.read && styles.unreadNotification]}>
          <Card.Content>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </View>
            <Text style={styles.notificationMessage}>{notification.message}</Text>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        <Button
          mode="contained"
          icon="plus"
          style={[styles.actionButton, { backgroundColor: '#FF8A50' }]}
          onPress={() => {}}
        >
          Create Requirement
        </Button>
        <Button
          mode="outlined"
          icon="food-apple"
          style={styles.actionButton}
          onPress={() => {}}
        >
          Browse Donations
        </Button>
        <Button
          mode="outlined"
          icon="account-group"
          style={styles.actionButton}
          onPress={() => {}}
        >
          Manage Volunteers
        </Button>
        <Button
          mode="outlined"
          icon="chart-line"
          style={styles.actionButton}
          onPress={() => {}}
        >
          View Reports
        </Button>
      </View>
    </View>
  );

  if (loading) {
    return (
      <LoadingSpinner 
        message="Loading dashboard..." 
        size="large" 
        color="#FF8A50" 
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF8A50']} />
        }
      >
        {renderQuickStats()}
        {renderActiveRequirements()}
        {renderRecentDonations()}
        {renderRecentNotifications()}
        {renderQuickActions()}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {}}
      />
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: '#FF8A50',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#718096',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  userType: {
    fontSize: 12,
    color: '#FF8A50',
    textTransform: 'capitalize',
  },
  notificationIcon: {
    margin: 0,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: (width - 56) / 2,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 8,
  },
  section: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requirementCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  requirementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requirementTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 6,
    lineHeight: 22,
  },
  urgencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  urgencyTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  urgencyChip: {
    height: 24,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '700',
  },
  requirementDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F7FAFC',
  },
  servingsText: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
  },
  statusChip: {
    height: 26,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timeText: {
    fontSize: 12,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  donationCard: {
    marginBottom: 12,
    elevation: 3,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  donationTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  donationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
    lineHeight: 22,
  },
  donorText: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
  },
  donationDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '500',
  },
  claimButton: {
    backgroundColor: '#FF8A50',
    borderRadius: 8,
  },
  claimButtonText: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#718096',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
  },
  notificationCard: {
    marginBottom: 12,
    elevation: 1,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF8A50',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#718096',
  },
  actionGrid: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF8A50',
  },
});