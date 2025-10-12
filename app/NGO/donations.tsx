import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, Searchbar, Menu, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NGODonationApi } from '../../services/ngoDonationApi';
import LoadingSpinner from '../../components/LoadingSpinner';

const { width } = Dimensions.get('window');

interface Donation {
  _id: string;
  title: string;
  donorId: {
    _id: string;
    name: string;
    businessName?: string;
    address?: {
      city?: string;
      state?: string;
    };
  };
  foodDetails: {
    type: string;
    category: string;
    quantity: string;
    estimatedServings: number;
    description: string;
  };
  images?: string[];
  expiryDateTime: string;
  pickupLocation: {
    address: string;
    city: string;
    state: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  pickupSchedule: {
    urgency: string;
  };
  status: string;
  createdAt: string;
}

export default function NGODonations() {
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [foodTypeFilter, setFoodTypeFilter] = useState<string>('all');
  const [expiryFilter, setExpiryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Menu visibility states
  const [foodTypeMenuVisible, setFoodTypeMenuVisible] = useState(false);
  const [expiryMenuVisible, setExpiryMenuVisible] = useState(false);
  const [locationMenuVisible, setLocationMenuVisible] = useState(false);

  // Available cities for location filter
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [donations, foodTypeFilter, expiryFilter, locationFilter]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await NGODonationApi.getAvailableDonations({
        status: 'available',
        page: 1,
        limit: 50,
      });

      console.log('Fetched donations:', response.donations.length);
      
      setDonations(response.donations as unknown as Donation[]);
      
      // Extract unique cities for location filter
      const cities = [...new Set(
        response.donations
          .map((d: any) => d.pickupLocation?.city)
          .filter((city: string) => city)
      )];
      setAvailableCities(cities);

    } catch (err) {
      console.error('Error fetching donations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load donations');
      Alert.alert('Error', 'Failed to load donations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDonations();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...donations];

    // Food Type Filter
    if (foodTypeFilter !== 'all') {
      filtered = filtered.filter(d => d.foodDetails.type === foodTypeFilter);
    }

    // Expiry Date Filter
    if (expiryFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(d => {
        const expiryDate = new Date(d.expiryDateTime);
        const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        switch (expiryFilter) {
          case 'today':
            return hoursUntilExpiry <= 24;
          case '2days':
            return hoursUntilExpiry <= 48;
          case '3days':
            return hoursUntilExpiry <= 72;
          case 'week':
            return hoursUntilExpiry <= 168;
          default:
            return true;
        }
      });
    }

    // Location Filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(d => 
        d.pickupLocation?.city?.toLowerCase() === locationFilter.toLowerCase()
      );
    }

    setFilteredDonations(filtered);
  };

  const getExpiryLabel = (expiryDateTime: string): string => {
    const now = new Date();
    const expiry = new Date(expiryDateTime);
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 0) return 'Expired';
    if (diffHours === 0) return 'Expires in <1 hour';
    if (diffHours < 24) return `Expires in ${diffHours} hours`;
    if (diffDays === 1) return 'Expires in 1 day';
    return `Expires in ${diffDays} days`;
  };

  const getExpiryColor = (expiryDateTime: string): string => {
    const now = new Date();
    const expiry = new Date(expiryDateTime);
    const diffHours = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) return '#F44336'; // Red - expired
    if (diffHours <= 6) return '#F44336'; // Red - critical
    if (diffHours <= 24) return '#FF9800'; // Orange - urgent
    if (diffHours <= 48) return '#FFC107'; // Yellow - soon
    return '#4CAF50'; // Green - plenty of time
  };

  const getFoodTypeIcon = (type: string): string => {
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

  const getFoodTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      cooked_meal: 'Cooked Meal',
      raw_ingredients: 'Raw Ingredients',
      packaged_food: 'Packaged Food',
      bakery: 'Bakery',
      fruits_vegetables: 'Produce',
      dairy: 'Dairy',
      beverages: 'Beverages',
    };
    return labels[type] || type;
  };

  const getDonorName = (donation: Donation): string => {
    return donation.donorId.businessName || donation.donorId.name;
  };

  const getDonorLocation = (donation: Donation): string => {
    const donor = donation.donorId;
    if (donor.address?.city) {
      return donor.address.city;
    }
    return donation.pickupLocation?.city || 'Unknown location';
  };

  const getDistance = (donation: Donation): string => {
    // For now, return a placeholder
    // In production, calculate distance based on NGO's coordinates vs donation coordinates
    return '2.3 km away';
  };

  const renderDonationCard = (donation: Donation) => {
    const expiryLabel = getExpiryLabel(donation.expiryDateTime);
    const expiryColor = getExpiryColor(donation.expiryDateTime);
    const donorName = getDonorName(donation);
    const location = getDonorLocation(donation);
    const distance = getDistance(donation);
    
    // Get image URL - handle both string and object formats
    const imageUrl = donation.images && donation.images.length > 0
      ? (typeof donation.images[0] === 'string' 
          ? donation.images[0] 
          : (donation.images[0] as any).url)
      : null;

    return (
      <TouchableOpacity
        key={donation._id}
        style={styles.donationCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/NGO/donation-details?id=${donation._id}`)}
      >
        {/* Donation Image */}
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.donationImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialCommunityIcons
                name={getFoodTypeIcon(donation.foodDetails.type) as any}
                size={40}
                color="#CBD5E0"
              />
            </View>
          )}
        </View>

        {/* Donation Details */}
        <View style={styles.donationContent}>
          {/* Expiry Badge */}
          <View style={[styles.expiryBadge, { backgroundColor: expiryColor }]}>
            <Text style={styles.expiryText}>{expiryLabel}</Text>
          </View>

          {/* Title */}
          <Text style={styles.donationTitle} numberOfLines={1}>
            {donation.title}
          </Text>

          {/* Description */}
          <Text style={styles.donationDescription} numberOfLines={2}>
            {donation.foodDetails.description}
          </Text>

          {/* Donor Info */}
          <View style={styles.donorSection}>
            <Avatar.Text
              size={32}
              label={donorName.charAt(0).toUpperCase()}
              style={styles.donorAvatar}
            />
            <View style={styles.donorInfo}>
              <Text style={styles.donorName} numberOfLines={1}>
                {donorName}
              </Text>
              <Text style={styles.donorLocation} numberOfLines={1}>
                {distance}
              </Text>
            </View>
          </View>

          {/* View Details Button */}
          <Button
            mode="contained"
            onPress={() => router.push(`/NGO/donation-details?id=${donation._id}`)}
            style={styles.viewDetailsButton}
            labelStyle={styles.viewDetailsText}
            compact
          >
            View Details
          </Button>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && donations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading donations..." size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="menu" size={24} color="#2D3748" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Donations</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="bell-outline" size={24} color="#2D3748" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {/* Food Type Filter */}
        <Menu
          visible={foodTypeMenuVisible}
          onDismiss={() => setFoodTypeMenuVisible(false)}
          anchor={
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setFoodTypeMenuVisible(true)}
            >
              <Text style={styles.filterButtonText}>
                {foodTypeFilter === 'all' ? 'Food Type' : getFoodTypeLabel(foodTypeFilter)}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#4A5568" />
            </TouchableOpacity>
          }
        >
          <Menu.Item onPress={() => { setFoodTypeFilter('all'); setFoodTypeMenuVisible(false); }} title="All Types" />
          <Menu.Item onPress={() => { setFoodTypeFilter('cooked_meal'); setFoodTypeMenuVisible(false); }} title="Cooked Meal" />
          <Menu.Item onPress={() => { setFoodTypeFilter('raw_ingredients'); setFoodTypeMenuVisible(false); }} title="Raw Ingredients" />
          <Menu.Item onPress={() => { setFoodTypeFilter('packaged_food'); setFoodTypeMenuVisible(false); }} title="Packaged Food" />
          <Menu.Item onPress={() => { setFoodTypeFilter('bakery'); setFoodTypeMenuVisible(false); }} title="Bakery" />
          <Menu.Item onPress={() => { setFoodTypeFilter('fruits_vegetables'); setFoodTypeMenuVisible(false); }} title="Produce" />
          <Menu.Item onPress={() => { setFoodTypeFilter('dairy'); setFoodTypeMenuVisible(false); }} title="Dairy" />
        </Menu>

        {/* Expiry Date Filter */}
        <Menu
          visible={expiryMenuVisible}
          onDismiss={() => setExpiryMenuVisible(false)}
          anchor={
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setExpiryMenuVisible(true)}
            >
              <Text style={styles.filterButtonText}>
                {expiryFilter === 'all' ? 'Expiry Date' : 
                 expiryFilter === 'today' ? 'Today' :
                 expiryFilter === '2days' ? 'Within 2 days' :
                 expiryFilter === '3days' ? 'Within 3 days' :
                 expiryFilter === 'week' ? 'Within a week' : 'Expiry Date'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#4A5568" />
            </TouchableOpacity>
          }
        >
          <Menu.Item onPress={() => { setExpiryFilter('all'); setExpiryMenuVisible(false); }} title="All" />
          <Menu.Item onPress={() => { setExpiryFilter('today'); setExpiryMenuVisible(false); }} title="Expires Today" />
          <Menu.Item onPress={() => { setExpiryFilter('2days'); setExpiryMenuVisible(false); }} title="Within 2 Days" />
          <Menu.Item onPress={() => { setExpiryFilter('3days'); setExpiryMenuVisible(false); }} title="Within 3 Days" />
          <Menu.Item onPress={() => { setExpiryFilter('week'); setExpiryMenuVisible(false); }} title="Within a Week" />
        </Menu>

        {/* Location Filter */}
        <Menu
          visible={locationMenuVisible}
          onDismiss={() => setLocationMenuVisible(false)}
          anchor={
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setLocationMenuVisible(true)}
            >
              <Text style={styles.filterButtonText}>
                {locationFilter === 'all' ? 'Location' : locationFilter}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#4A5568" />
            </TouchableOpacity>
          }
        >
          <Menu.Item onPress={() => { setLocationFilter('all'); setLocationMenuVisible(false); }} title="All Locations" />
          {availableCities.map(city => (
            <Menu.Item 
              key={city}
              onPress={() => { setLocationFilter(city); setLocationMenuVisible(false); }} 
              title={city} 
            />
          ))}
        </Menu>
      </View>

{/* Active Filters Display */}
      {(foodTypeFilter !== 'all' || expiryFilter !== 'all' || locationFilter !== 'all') && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {foodTypeFilter !== 'all' && (
              <Chip
                mode="flat"
                onClose={() => setFoodTypeFilter('all')}
                style={styles.activeFilterChip}
                textStyle={styles.activeFilterChipText}
              >
                {getFoodTypeLabel(foodTypeFilter)}
              </Chip>
            )}
            {expiryFilter !== 'all' && (
              <Chip
                mode="flat"
                onClose={() => setExpiryFilter('all')}
                style={styles.activeFilterChip}
                textStyle={styles.activeFilterChipText}
              >
                {expiryFilter === 'today' ? 'Today' :
                 expiryFilter === '2days' ? '2 Days' :
                 expiryFilter === '3days' ? '3 Days' :
                 expiryFilter === 'week' ? 'Week' : expiryFilter}
              </Chip>
            )}
            {locationFilter !== 'all' && (
              <Chip
                mode="flat"
                onClose={() => setLocationFilter('all')}
                style={styles.activeFilterChip}
                textStyle={styles.activeFilterChipText}
              >
                {locationFilter}
              </Chip>
            )}
          </ScrollView>
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredDonations.length} donation{filteredDonations.length !== 1 ? 's' : ''} available
        </Text>
      </View>

      {/* Donations List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF8A50']}
          />
        }
      >
        {error ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="alert-circle" size={64} color="#F44336" />
            <Text style={styles.emptyTitle}>Error Loading Donations</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <Button mode="contained" onPress={fetchDonations} style={{ marginTop: 16 }}>
              Retry
            </Button>
          </View>
        ) : filteredDonations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="food-off" size={64} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>No Donations Found</Text>
            <Text style={styles.emptyText}>
              {donations.length === 0
                ? 'No donations are currently available'
                : 'No donations match your filters. Try adjusting your search criteria.'}
            </Text>
            {(foodTypeFilter !== 'all' || expiryFilter !== 'all' || locationFilter !== 'all') && (
              <Button
                mode="outlined"
                onPress={() => {
                  setFoodTypeFilter('all');
                  setExpiryFilter('all');
                  setLocationFilter('all');
                }}
                style={{ marginTop: 16 }}
              >
                Clear Filters
              </Button>
            )}
          </View>
        ) : (
          filteredDonations.map(donation => renderDonationCard(donation))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#4A5568',
    fontWeight: '500',
  },
  activeFiltersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  activeFilterChip: {
    marginRight: 8,
    backgroundColor: '#FF8A50',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  donationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#F7FAFC',
  },
  donationImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
  },
  donationContent: {
    padding: 16,
  },
  expiryBadge: {
    position: 'absolute',
    top: -72,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  expiryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  donationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 6,
  },
  donationDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
    marginBottom: 12,
  },
  donorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  donorAvatar: {
    backgroundColor: '#FF8A50',
  },
  donorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  donorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  donorLocation: {
    fontSize: 13,
    color: '#718096',
  },
  viewDetailsButton: {
    backgroundColor: '#FF8A50',
    borderRadius: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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