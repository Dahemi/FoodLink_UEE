import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Chip, Searchbar, Button, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DonorHistoryApi } from '../../services/donorHistoryApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import DonorBottomNav from '../../components/donor/DonorBottomNav';

const { width } = Dimensions.get('window');

interface DonationHistory {
  _id: string;
  title: string;
  status: 'available' | 'claimed' | 'pickup_scheduled' | 'picked_up' | 'delivered' | 'expired' | 'cancelled';
  foodDetails: {
    type: string;
    category: string;
    quantity: string;
    estimatedServings: number;
  };
  pickupSchedule: {
    urgency: string;
  };
  claimedBy?: {
    _id: string;
    name: string;
    organizationType: string;
  };
  createdAt: string;
  expiryDateTime: string;
  claimedAt?: string;
  deliveredAt?: string;
}

interface HistoryStats {
  totalDonations: number;
  activeDonations: number;
  completedDonations: number;
  totalServings: number;
  totalImpact: number;
}

export default function DonorHistory() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [donations, setDonations] = useState<DonationHistory[]>([]);
  const [stats, setStats] = useState<HistoryStats>({
    totalDonations: 0,
    activeDonations: 0,
    completedDonations: 0,
    totalServings: 0,
    totalImpact: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [filterBy]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!DonorHistoryApi.isEnabled()) {
        setError('API not configured');
        return;
      }

      let statusFilter: string | undefined;
      if (filterBy === 'active') {
        statusFilter = 'available,claimed,pickup_scheduled,picked_up';
      } else if (filterBy === 'completed') {
        statusFilter = 'delivered';
      } else if (filterBy === 'cancelled') {
        statusFilter = 'cancelled,expired';
      }

      const response = await DonorHistoryApi.getDonationHistory({
        page: 1,
        limit: 50,
        status: statusFilter,
      });

      setDonations(response.donations);
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching history:', error);
      setError(error instanceof Error ? error.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const getFilteredDonations = () => {
    let filtered = donations;

    if (searchQuery) {
      filtered = filtered.filter(
        (donation) =>
          donation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          donation.foodDetails.quantity.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#10B981';
      case 'claimed':
        return '#3B82F6';
      case 'pickup_scheduled':
        return '#8B5CF6';
      case 'picked_up':
        return '#6366F1';
      case 'delivered':
        return '#059669';
      case 'cancelled':
        return '#EF4444';
      case 'expired':
        return '#9CA3AF';
      default:
        return '#718096';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return 'clock-outline';
      case 'claimed':
        return 'handshake';
      case 'pickup_scheduled':
        return 'calendar-check';
      case 'picked_up':
        return 'truck-delivery';
      case 'delivered':
        return 'check-circle';
      case 'cancelled':
        return 'close-circle';
      case 'expired':
        return 'timer-off';
      default:
        return 'help-circle';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cooked_meal':
        return 'food';
      case 'raw_ingredients':
        return 'food-variant';
      case 'packaged_food':
        return 'package-variant';
      case 'bakery':
        return 'bread-slice';
      case 'fruits_vegetables':
        return 'fruit-pineapple';
      case 'dairy':
        return 'glass-mug-variant';
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3748" />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Donation History</Text>
        <Text style={styles.headerSubtitle}>Track your impact</Text>
      </View>
      <View style={{ width: 24 }} />
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <Card style={styles.statsCard}>
        <Card.Content>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FFF7ED' }]}>
                <MaterialCommunityIcons name="gift" size={24} color="#FF8A50" />
              </View>
              <Text style={styles.statValue}>{stats.totalDonations}</Text>
              <Text style={styles.statLabel}>Total Donations</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="clock-outline" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>{stats.activeDonations}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#DCFCE7' }]}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />
              </View>
              <Text style={styles.statValue}>{stats.completedDonations}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#F3E8FF' }]}>
                <MaterialCommunityIcons name="food" size={24} color="#9333EA" />
              </View>
              <Text style={styles.statValue}>{stats.totalImpact}</Text>
              <Text style={styles.statLabel}>Meals Served</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.searchContainer}>
      <Searchbar
        placeholder="Search donations..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor="#FF8A50"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        <Chip
          mode={filterBy === 'all' ? 'flat' : 'outlined'}
          selected={filterBy === 'all'}
          onPress={() => setFilterBy('all')}
          style={[styles.filterChip, filterBy === 'all' && styles.filterChipSelected]}
          textStyle={filterBy === 'all' ? styles.filterTextSelected : styles.filterText}
        >
          All
        </Chip>

        <Chip
          mode={filterBy === 'active' ? 'flat' : 'outlined'}
          selected={filterBy === 'active'}
          onPress={() => setFilterBy('active')}
          style={[styles.filterChip, filterBy === 'active' && styles.filterChipSelected]}
          textStyle={filterBy === 'active' ? styles.filterTextSelected : styles.filterText}
        >
          Active
        </Chip>

        <Chip
          mode={filterBy === 'completed' ? 'flat' : 'outlined'}
          selected={filterBy === 'completed'}
          onPress={() => setFilterBy('completed')}
          style={[styles.filterChip, filterBy === 'completed' && styles.filterChipSelected]}
          textStyle={filterBy === 'completed' ? styles.filterTextSelected : styles.filterText}
        >
          Completed
        </Chip>

        <Chip
          mode={filterBy === 'cancelled' ? 'flat' : 'outlined'}
          selected={filterBy === 'cancelled'}
          onPress={() => setFilterBy('cancelled')}
          style={[styles.filterChip, filterBy === 'cancelled' && styles.filterChipSelected]}
          textStyle={filterBy === 'cancelled' ? styles.filterTextSelected : styles.filterText}
        >
          Cancelled
        </Chip>
      </ScrollView>
    </View>
  );

  const renderDonationCard = (donation: DonationHistory) => (
    <TouchableOpacity
      key={donation._id}
      activeOpacity={0.7}
      onPress={() => {
        // Navigate to donation details if you have that screen
        // router.push(`/donor/donation-details/${donation._id}`);
      }}
    >
      <Card style={styles.donationCard}>
        <Card.Content>
          {/* Header with Status */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.typeIcon, { backgroundColor: '#FFF7ED' }]}>
                <MaterialCommunityIcons
                  name={getTypeIcon(donation.foodDetails.type)}
                  size={20}
                  color="#FF8A50"
                />
              </View>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {donation.title}
                </Text>
                <Text style={styles.cardDate}>
                  {formatDate(donation.createdAt)} • {formatTime(donation.createdAt)}
                </Text>
              </View>
            </View>
            <Chip
              mode="flat"
              style={[
                styles.statusChip,
                { backgroundColor: `${getStatusColor(donation.status)}15` },
              ]}
              textStyle={[styles.statusText, { color: getStatusColor(donation.status) }]}
              icon={getStatusIcon(donation.status)}
            >
              {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
            </Chip>
          </View>

          {/* Donation Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="food-variant" size={16} color="#718096" />
              <Text style={styles.detailText}>{donation.foodDetails.quantity}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="account-group" size={16} color="#718096" />
              <Text style={styles.detailText}>
                ~{donation.foodDetails.estimatedServings} servings
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="speedometer" size={16} color="#718096" />
              <Text style={styles.detailText}>
                {donation.pickupSchedule.urgency.charAt(0).toUpperCase() +
                  donation.pickupSchedule.urgency.slice(1)}{' '}
                urgency
              </Text>
            </View>
          </View>

          {/* NGO Info (if claimed) */}
          {donation.claimedBy && (
            <View style={styles.ngoContainer}>
              <MaterialCommunityIcons name="handshake" size={16} color="#10B981" />
              <Text style={styles.ngoText}>
                Claimed by <Text style={styles.ngoName}>{donation.claimedBy.name}</Text>
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <Button
              mode="outlined"
              onPress={() => {}}
              style={styles.actionButton}
              textColor="#FF8A50"
              compact
            >
              View Details
            </Button>

            {donation.status === 'delivered' && (
              <Button
                mode="text"
                onPress={() => {}}
                textColor="#10B981"
                icon="share-variant"
                compact
              >
                Share Impact
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="history" size={80} color="#CBD5E0" />
      <Text style={styles.emptyTitle}>No donations yet</Text>
      <Text style={styles.emptyText}>
        Start making a difference by creating your first donation
      </Text>
      <Button
        mode="contained"
        onPress={() => router.push('/donor/create-donation')}
        style={styles.emptyButton}
        icon="plus"
      >
        Create Donation
      </Button>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8A50" />
          <Text style={styles.loadingText}>Loading donation history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={fetchHistory} buttonColor="#FF8A50">
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const filteredDonations = getFilteredDonations();

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderStats()}
      {renderSearchAndFilters()}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF8A50']} />
        }
      >
        {filteredDonations.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {filteredDonations.map((donation) => renderDonationCard(donation))}
            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/donor/create-donation')}
        color="#FFFFFF"
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#718096',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statsCard: {
    elevation: 2,
    borderRadius: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#718096',
    textAlign: 'center',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBar: {
    marginBottom: 12,
    elevation: 0,
    backgroundColor: '#F7FAFC',
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  filterChipSelected: {
    backgroundColor: '#FF8A50',
  },
  filterText: {
    color: '#718096',
    fontSize: 12,
  },
  filterTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  donationCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#718096',
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#4A5568',
  },
  ngoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  ngoText: {
    fontSize: 13,
    color: '#15803D',
  },
  ngoName: {
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F7FAFC',
    paddingTop: 12,
  },
  actionButton: {
    borderColor: '#FF8A50',
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
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#FF8A50',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    marginVertical: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF8A50',
  },
});
