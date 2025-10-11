import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Chip, FAB, Avatar, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNGOAuth } from '../../context/NGOAuthContext';

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

export default function NGOHome() {
  const { authState } = useNGOAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Dummy data for requirements
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

  // Dummy data for notifications
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

  // Dummy stats
  const stats = {
    totalRequirements: 12,
    activeRequirements: 8,
    peopleHelped: 1250,
    donationsReceived: 45,
    volunteersManaged: 15,
    impactScore: 950,
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 1500);
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
          <Text style={styles.statLabel}>Donations Received</Text>
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
      {requirements.slice(0, 3).map((requirement) => (
        <Card key={requirement.id} style={styles.requirementCard}>
          <Card.Content>
            <View style={styles.requirementHeader}>
              <Text style={styles.requirementTitle}>{requirement.title}</Text>
              <Chip
                mode="flat"
                style={[styles.urgencyChip, { backgroundColor: `${getUrgencyColor(requirement.urgency)}20` }]}
                textStyle={[styles.urgencyText, { color: getUrgencyColor(requirement.urgency) }]}
              >
                {requirement.urgency.toUpperCase()}
              </Chip>
            </View>
            <View style={styles.requirementDetails}>
              <Text style={styles.servingsText}>
                🍽️ {requirement.servings} servings needed
              </Text>
              <Chip
                mode="flat"
                style={[styles.statusChip, { backgroundColor: `${getStatusColor(requirement.status)}20` }]}
                textStyle={[styles.statusText, { color: getStatusColor(requirement.status) }]}
              >
                {requirement.status.replace('_', ' ').toUpperCase()}
              </Chip>
            </View>
            <Text style={styles.timeText}>
              Created {new Date(requirement.createdAt).toLocaleDateString()}
            </Text>
          </Card.Content>
        </Card>
      ))}
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
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
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
    textAlign: 'center',
    marginBottom: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  requirementCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
  },
  requirementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
    marginRight: 8,
  },
  urgencyChip: {
    height: 24,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  requirementDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  servingsText: {
    fontSize: 14,
    color: '#4A5568',
  },
  statusChip: {
    height: 24,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
    color: '#718096',
  },
  notificationCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    elevation: 1,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF8A50',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: '#718096',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 18,
  },
  actionGrid: {
    paddingHorizontal: 20,
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