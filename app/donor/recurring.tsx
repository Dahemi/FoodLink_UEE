import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Chip, FAB, Switch, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDonorAuth } from '../../context/DonorAuthContext';
import DonorBottomNav from '../../components/donor/DonorBottomNav';

const { width } = Dimensions.get('window');

interface RecurringDonation {
  id: string;
  title: string;
  foodType: string;
  quantity: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: string;
  dayOfMonth?: number;
  time: string;
  isActive: boolean;
  nextScheduledDate: string;
  totalDonations: number;
  startDate: string;
  ngo?: string;
}

export default function RecurringDonations() {
  const router = useRouter();
  const { authState } = useDonorAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [recurringDonations, setRecurringDonations] = useState<RecurringDonation[]>([
    {
      id: '1',
      title: 'Daily Breakfast Surplus',
      foodType: 'Cooked Meal',
      quantity: '5-10 portions',
      frequency: 'daily',
      time: '09:00 AM',
      isActive: true,
      nextScheduledDate: '2024-01-15',
      totalDonations: 45,
      startDate: '2023-11-01',
      ngo: 'Hope Foundation',
    },
    {
      id: '2',
      title: 'Weekly Bakery Items',
      foodType: 'Bakery',
      quantity: '20-30 portions',
      frequency: 'weekly',
      dayOfWeek: 'Sunday',
      time: '06:00 PM',
      isActive: true,
      nextScheduledDate: '2024-01-14',
      totalDonations: 12,
      startDate: '2023-12-01',
    },
    {
      id: '3',
      title: 'Monthly Food Drive',
      foodType: 'Raw Ingredients',
      quantity: '50+ portions',
      frequency: 'monthly',
      dayOfMonth: 1,
      time: '10:00 AM',
      isActive: false,
      nextScheduledDate: '2024-02-01',
      totalDonations: 3,
      startDate: '2023-11-01',
    },
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const toggleDonationStatus = (id: string) => {
    setRecurringDonations((prev) =>
      prev.map((donation) =>
        donation.id === id ? { ...donation, isActive: !donation.isActive } : donation
      )
    );
  };

  const deleteDonation = (id: string) => {
    Alert.alert(
      'Delete Recurring Donation',
      'Are you sure you want to delete this recurring donation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setRecurringDonations((prev) => prev.filter((d) => d.id !== id));
            Alert.alert('Success', 'Recurring donation deleted successfully');
          },
        },
      ]
    );
  };

  const getFrequencyLabel = (donation: RecurringDonation) => {
    switch (donation.frequency) {
      case 'daily':
        return 'Every day';
      case 'weekly':
        return `Every ${donation.dayOfWeek}`;
      case 'monthly':
        return `Every ${donation.dayOfMonth}${getOrdinalSuffix(donation.dayOfMonth!)} of the month`;
      default:
        return '';
    }
  };

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return 'calendar-today';
      case 'weekly':
        return 'calendar-week';
      case 'monthly':
        return 'calendar-month';
      default:
        return 'calendar';
    }
  };

  const getFoodTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cooked meal':
        return 'food';
      case 'bakery':
        return 'bread-slice';
      case 'raw ingredients':
        return 'food-variant';
      case 'packaged food':
        return 'package-variant';
      default:
        return 'food-apple';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3748" />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Recurring Donations</Text>
        <Text style={styles.headerSubtitle}>Automate your giving</Text>
      </View>
      <View style={{ width: 24 }} />
    </View>
  );

  const renderStats = () => {
    const activeCount = recurringDonations.filter((d) => d.isActive).length;
    const totalDonations = recurringDonations.reduce((sum, d) => sum + d.totalDonations, 0);

    return (
      <View style={styles.statsContainer}>
        <Card style={styles.statsCard}>
          <Card.Content>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: '#FFF7ED' }]}>
                  <MaterialCommunityIcons name="calendar-sync" size={24} color="#FF8A50" />
                </View>
                <Text style={styles.statValue}>{recurringDonations.length}</Text>
                <Text style={styles.statLabel}>Total Schedules</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
                  <MaterialCommunityIcons name="calendar-check" size={24} color="#10B981" />
                </View>
                <Text style={styles.statValue}>{activeCount}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <MaterialCommunityIcons name="gift" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.statValue}>{totalDonations}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderBenefits = () => (
    <Card style={styles.benefitsCard}>
      <Card.Content>
        <View style={styles.benefitsHeader}>
          <MaterialCommunityIcons name="lightbulb-on" size={24} color="#FF8A50" />
          <Text style={styles.benefitsTitle}>Why Set Up Recurring Donations?</Text>
        </View>
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
            <Text style={styles.benefitText}>Save time with automated scheduling</Text>
          </View>
          <View style={styles.benefitItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
            <Text style={styles.benefitText}>Consistent support for your community</Text>
          </View>
          <View style={styles.benefitItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
            <Text style={styles.benefitText}>Greater tax benefits with regular giving</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderDonationCard = (donation: RecurringDonation) => (
    <Card key={donation.id} style={styles.donationCard}>
      <Card.Content>
        {/* Header with Status Toggle */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <MaterialCommunityIcons
              name={getFoodTypeIcon(donation.foodType)}
              size={24}
              color="#FF8A50"
            />
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.cardTitle}>{donation.title}</Text>
              <Text style={styles.cardSubtitle}>{donation.foodType}</Text>
            </View>
          </View>
          <Switch
            value={donation.isActive}
            onValueChange={() => toggleDonationStatus(donation.id)}
            color="#FF8A50"
          />
        </View>

        {/* Status Badge */}
        {donation.isActive ? (
          <Chip
            mode="flat"
            style={styles.activeChip}
            textStyle={styles.activeChipText}
            icon="check-circle"
          >
            Active
          </Chip>
        ) : (
          <Chip
            mode="flat"
            style={styles.pausedChip}
            textStyle={styles.pausedChipText}
            icon="pause-circle"
          >
            Paused
          </Chip>
        )}

        {/* Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name={getFrequencyIcon(donation.frequency)}
              size={16}
              color="#718096"
            />
            <Text style={styles.detailText}>{getFrequencyLabel(donation)}</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#718096" />
            <Text style={styles.detailText}>{donation.time}</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="food-variant" size={16} color="#718096" />
            <Text style={styles.detailText}>{donation.quantity}</Text>
          </View>

          {donation.ngo && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="hand-heart" size={16} color="#718096" />
              <Text style={styles.detailText}>{donation.ngo}</Text>
            </View>
          )}
        </View>

        {/* Next Schedule */}
        <View style={styles.scheduleSection}>
          <Text style={styles.scheduleLabel}>Next scheduled donation:</Text>
          <Text style={styles.scheduleDate}>{formatDate(donation.nextScheduledDate)}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statBadgeValue}>{donation.totalDonations}</Text>
            <Text style={styles.statBadgeLabel}>donations</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statBadgeValue}>
              Since {formatDate(donation.startDate).split(',')[0]}
            </Text>
            <Text style={styles.statBadgeLabel}>started</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Button
            mode="outlined"
            onPress={() => Alert.alert('Edit', `Edit ${donation.title}`)}
            style={styles.actionButton}
            textColor="#FF8A50"
            compact
          >
            Edit Schedule
          </Button>
          <IconButton
            icon="delete-outline"
            size={20}
            iconColor="#F44336"
            onPress={() => deleteDonation(donation.id)}
          />
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="calendar-sync" size={80} color="#CBD5E0" />
      <Text style={styles.emptyTitle}>No Recurring Donations Yet</Text>
      <Text style={styles.emptyText}>
        Set up a recurring donation schedule to automate your giving and make a consistent impact
        in your community.
      </Text>
      <Button
        mode="contained"
        onPress={() => Alert.alert('Info', 'Create recurring donation feature coming soon')}
        style={styles.emptyButton}
        buttonColor="#FF8A50"
        icon="plus"
      >
        Create Recurring Donation
      </Button>
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
        {renderStats()}
        {renderBenefits()}

        {recurringDonations.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Your Schedules</Text>
            </View>
            {recurringDonations.map((donation) => renderDonationCard(donation))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => Alert.alert('Info', 'Create recurring donation feature coming soon')}
        color="#FFFFFF"
        label="New Schedule"
      />

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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsCard: {
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
    textAlign: 'center',
  },
  benefitsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FFE5CC',
    elevation: 1,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 8,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 8,
    flex: 1,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  donationCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardHeaderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#718096',
  },
  activeChip: {
    backgroundColor: '#D1FAE5',
    alignSelf: 'flex-start',
    marginBottom: 12,
    height: 28,
  },
  activeChipText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  pausedChip: {
    backgroundColor: '#FEE2E2',
    alignSelf: 'flex-start',
    marginBottom: 12,
    height: 28,
  },
  pausedChipText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  detailsSection: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 8,
  },
  scheduleSection: {
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  scheduleLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  scheduleDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF8A50',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBadge: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  statBadgeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  statBadgeLabel: {
    fontSize: 11,
    color: '#718096',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  actionButton: {
    borderColor: '#FF8A50',
    flex: 1,
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#FF8A50',
  },
});