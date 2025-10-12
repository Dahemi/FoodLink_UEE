import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Chip, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NGOHistoryApi } from '../../services/ngoHistoryApi';
import LoadingSpinner from '../../components/LoadingSpinner';

interface ClaimHistory {
  _id: string;
  donationId: {
    _id: string;
    title: string;
    foodDetails: {
      type: string;
      category: string;
      quantity: string;
      estimatedServings: number;
      description: string;
    };
    pickupLocation: {
      address: string;
      city: string;
      state: string;
    };
    images?: string[];
  };
  donorId: {
    _id: string;
    name: string;
    businessName?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'picked_up' | 'delivered' | 'cancelled';
  requestMessage?: string;
  pickupScheduledAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  beneficiariesServed?: number;
  volunteersInvolved?: number;
  distributionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface HistoryStats {
  totalClaims: number;
  approvedClaims: number;
  completedClaims: number;
  totalServings: number;
  totalBeneficiaries: number;
}

export default function NGOHistory() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterBy, setFilterBy] = useState<'all' | 'pending' | 'approved' | 'delivered' | 'cancelled'>('all');
  const [claims, setClaims] = useState<ClaimHistory[]>([]);
  const [stats, setStats] = useState<HistoryStats>({
    totalClaims: 0,
    approvedClaims: 0,
    completedClaims: 0,
    totalServings: 0,
    totalBeneficiaries: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [filterBy]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!NGOHistoryApi.isEnabled()) {
        setError('API not configured');
        setLoading(false);
        return;
      }

      // Fetch claims and stats in parallel
      const [historyResponse, statsResponse] = await Promise.all([
        NGOHistoryApi.getClaimHistory({
          status: filterBy === 'all' ? undefined : filterBy,
          page: 1,
          limit: 50,
        }),
        NGOHistoryApi.getClaimStats(),
      ]);

      console.log('History fetched:', historyResponse.claims.length, 'claims');
      console.log('Stats fetched:', statsResponse);

      setClaims(historyResponse.claims);
      setStats(statsResponse);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load history');
      Alert.alert('Error', 'Failed to load claim history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const getFilteredHistory = () => {
    let filtered = claims;

    if (searchQuery) {
      filtered = filtered.filter(
        (claim) =>
          claim.donationId.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          claim.donationId.foodDetails.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          claim.donorId.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          claim.donorId.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return '#4CAF50';
      case 'approved':
      case 'picked_up':
        return '#2196F3';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
      case 'rejected':
        return '#F44336';
      default:
        return '#718096';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Approval';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'picked_up':
        return 'Picked Up';
      case 'delivered':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'check-circle';
      case 'approved':
        return 'clock-check';
      case 'picked_up':
        return 'truck';
      case 'pending':
        return 'clock-outline';
      case 'cancelled':
      case 'rejected':
        return 'close-circle';
      default:
        return 'information';
    }
  };

  const getFoodTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      cooked_meal: 'food',
      raw_ingredients: 'food-variant',
      packaged_food: 'package-variant',
      bakery: 'bread-slice',
      fruits_vegetables: 'fruit-pineapple',
      dairy: 'glass-mug-variant',
      beverages: 'cup',
    };
    return icons[type] || 'food-apple';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDonorName = (claim: ClaimHistory) => {
    return claim.donorId.businessName || claim.donorId.name;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Activity History</Text>
      <Text style={styles.headerSubtitle}>
        Track your NGO's impact and past activities
      </Text>
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.searchContainer}>
      <Searchbar
        placeholder="Search claims..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor="#FF8A50"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['all', 'pending', 'approved', 'delivered', 'cancelled'].map((filter) => (
          <Chip
            key={filter}
            mode={filterBy === filter ? 'flat' : 'outlined'}
            selected={filterBy === filter}
            onPress={() => setFilterBy(filter as any)}
            style={styles.filterChip}
            textStyle={filterBy === filter ? { color: '#FFFFFF' } : undefined}
            selectedColor={filterBy === filter ? '#FF8A50' : undefined}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );

  const renderSummaryStats = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Impact Summary</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{stats.totalServings.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Total Servings</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{stats.totalBeneficiaries.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>People Helped</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{stats.completedClaims}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{stats.totalClaims}</Text>
          <Text style={styles.summaryLabel}>Total Claims</Text>
        </View>
      </View>
    </View>
  );

  const renderClaimCard = (claim: ClaimHistory) => {
    const donorName = getDonorName(claim);
    const statusColor = getStatusColor(claim.status);
    const statusLabel = getStatusLabel(claim.status);
    const statusIcon = getStatusIcon(claim.status);

    return (
      <Card key={claim._id} style={styles.historyCard}>
        <Card.Content>
          {/* Header with Status */}
          <View style={styles.historyHeader}>
            <View style={styles.typeSection}>
              <MaterialCommunityIcons
                name={getFoodTypeIcon(claim.donationId.foodDetails.type) as any}
                size={20}
                color="#FF8A50"
              />
              <Chip
                mode="flat"
                style={[styles.statusChip, { backgroundColor: statusColor }]}
                textStyle={styles.statusText}
                icon={statusIcon as any}
              >
                {statusLabel}
              </Chip>
            </View>
            <Text style={styles.dateText}>{formatDate(claim.createdAt)}</Text>
          </View>

          {/* Donation Title */}
          <Text style={styles.historyTitle}>{claim.donationId.title}</Text>

          {/* Description */}
          <Text style={styles.historyDescription} numberOfLines={2}>
            {claim.donationId.foodDetails.description}
          </Text>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.metric}>
              <MaterialCommunityIcons name="food" size={16} color="#718096" />
              <Text style={styles.metricText}>
                {claim.donationId.foodDetails.estimatedServings} servings
              </Text>
            </View>
            <View style={styles.metric}>
              <MaterialCommunityIcons name="package-variant" size={16} color="#718096" />
              <Text style={styles.metricText}>{claim.donationId.foodDetails.quantity}</Text>
            </View>
            {claim.beneficiariesServed && claim.beneficiariesServed > 0 && (
              <View style={styles.metric}>
                <MaterialCommunityIcons name="account-group" size={16} color="#718096" />
                <Text style={styles.metricText}>{claim.beneficiariesServed} beneficiaries</Text>
              </View>
            )}
          </View>

          {/* Donor Info */}
          <View style={styles.donorContainer}>
            <MaterialCommunityIcons name="store" size={16} color="#718096" />
            <Text style={styles.donorText}>
              From <Text style={styles.donorName}>{donorName}</Text>
            </Text>
          </View>

          {/* Location */}
          <View style={styles.locationContainer}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#718096" />
            <Text style={styles.locationText}>
              {claim.donationId.pickupLocation.city}, {claim.donationId.pickupLocation.state}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <Button
              mode="outlined"
              onPress={() => {
                // Navigate to claim details
                console.log('View claim details:', claim._id);
              }}
              style={styles.actionButton}
              compact
            >
              View Details
            </Button>
            {claim.status === 'delivered' && (
              <Button mode="text" onPress={() => {}} textColor="#FF8A50" compact>
                Share Impact
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="history" size={64} color="#CBD5E0" />
      <Text style={styles.emptyTitle}>No Claim History</Text>
      <Text style={styles.emptyText}>
        {filterBy === 'all'
          ? "You haven't made any claims yet. Start by browsing available donations."
          : `No ${filterBy} claims found. Try a different filter.`}
      </Text>
      {filterBy === 'all' && (
        <Button
          mode="contained"
          onPress={() => router.push('/NGO/donations')}
          style={{ marginTop: 16 }}
          buttonColor="#FF8A50"
        >
          Browse Donations
        </Button>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading history..." size="large" />
      </SafeAreaView>
    );
  }

  const filteredClaims = getFilteredHistory();

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderSearchAndFilters()}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF8A50']} />
        }
      >
        {error ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="alert-circle" size={64} color="#F44336" />
            <Text style={styles.emptyTitle}>Error Loading History</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <Button mode="contained" onPress={fetchHistory} style={{ marginTop: 16 }}>
              Retry
            </Button>
          </View>
        ) : filteredClaims.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {renderSummaryStats()}
            {filteredClaims.map((claim) => renderClaimCard(claim))}
          </>
        )}

        <View style={{ height: 100 }} />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBar: {
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    marginBottom: 12,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF8A50',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
    textAlign: 'center',
  },
  historyCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: 12,
    color: '#718096',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  historyDescription: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: '#718096',
  },
  donorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  donorText: {
    fontSize: 13,
    color: '#718096',
  },
  donorName: {
    fontWeight: '600',
    color: '#2D3748',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#718096',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    minWidth: 100,
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
    lineHeight: 20,
  },
});