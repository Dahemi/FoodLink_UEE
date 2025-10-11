import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Chip, Searchbar, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Donation {
  id: string;
  title: string;
  donorName: string;
  donorType: string;
  foodType: string;
  category: string;
  quantity: string;
  estimatedServings: number;
  expiryDateTime: string;
  distance: string;
  address: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  status: 'available' | 'claimed' | 'expired';
  images: string[];
  description: string;
}

export default function NGODonations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filterBy, setFilterBy] = useState<'all' | 'urgent' | 'nearby'>('all');

  // Dummy donations data
  const [donations] = useState<Donation[]>([
    {
      id: '1',
      title: 'Fresh Vegetarian Meals - Restaurant Surplus',
      donorName: 'Green Valley Restaurant',
      donorType: 'restaurant',
      foodType: 'cooked_meal',
      category: 'vegetarian',
      quantity: '40 portions',
      estimatedServings: 40,
      expiryDateTime: '2025-01-08T20:00:00Z',
      distance: '2.5 km',
      address: '123 Main Street, Colombo 03',
      urgency: 'high',
      status: 'available',
      images: [],
      description: 'Fresh vegetarian rice and curry meals prepared this afternoon. Contains no meat, suitable for all dietary preferences.',
    },
    {
      id: '2',
      title: 'Bakery Items - End of Day',
      donorName: 'Sunshine Bakery',
      donorType: 'bakery',
      foodType: 'bakery',
      category: 'vegetarian',
      quantity: '60 items',
      estimatedServings: 60,
      expiryDateTime: '2025-01-09T08:00:00Z',
      distance: '1.8 km',
      address: '456 Baker Street, Colombo 05',
      urgency: 'medium',
      status: 'available',
      images: [],
      description: 'Fresh bread, pastries, and baked goods from today. Mix of sweet and savory items.',
    },
    {
      id: '3',
      title: 'Emergency Food Supplies',
      donorName: 'Metro Supermarket',
      donorType: 'grocery',
      foodType: 'packaged_food',
      category: 'mixed',
      quantity: '50 kg',
      estimatedServings: 200,
      expiryDateTime: '2025-01-15T23:59:00Z',
      distance: '3.2 km',
      address: '789 Commercial Ave, Colombo 07',
      urgency: 'urgent',
      status: 'available',
      images: [],
      description: 'Canned goods, rice, lentils, and other non-perishable items. Perfect for emergency distribution.',
    },
    {
      id: '4',
      title: 'Fresh Fruits and Vegetables',
      donorName: 'City Market',
      donorType: 'grocery',
      foodType: 'fruits_vegetables',
      category: 'vegetarian',
      quantity: '30 kg',
      estimatedServings: 120,
      expiryDateTime: '2025-01-09T18:00:00Z',
      distance: '4.1 km',
      address: '321 Market Road, Colombo 04',
      urgency: 'high',
      status: 'available',
      images: [],
      description: 'Fresh seasonal fruits and vegetables. Slightly overripe but still good for consumption.',
    },
    {
      id: '5',
      title: 'Cooked Rice & Curry',
      donorName: 'Hotel Paradise',
      donorType: 'hotel',
      foodType: 'cooked_meal',
      category: 'non_vegetarian',
      quantity: '25 portions',
      estimatedServings: 25,
      expiryDateTime: '2025-01-08T22:00:00Z',
      distance: '5.0 km',
      address: '555 Hotel Lane, Colombo 02',
      urgency: 'urgent',
      status: 'claimed',
      images: [],
      description: 'Traditional Sri Lankan rice and curry with chicken. Must be consumed tonight.',
    },
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const getFilteredDonations = () => {
    let filtered = donations.filter(donation =>
      donation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.foodType.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (filterBy) {
      case 'urgent':
        return filtered.filter(d => d.urgency === 'urgent' || d.urgency === 'high');
      case 'nearby':
        return filtered.filter(d => parseFloat(d.distance) <= 3.0);
      default:
        return filtered;
    }
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
      case 'available': return '#4CAF50';
      case 'claimed': return '#FF9800';
      case 'expired': return '#F44336';
      default: return '#718096';
    }
  };

  const getCategoryIcon = (foodType: string) => {
    switch (foodType) {
      case 'cooked_meal': return 'food';
      case 'bakery': return 'bread-slice';
      case 'fruits_vegetables': return 'fruit-pineapple';
      case 'packaged_food': return 'package-variant';
      case 'dairy': return 'glass-mug-variant';
      case 'beverages': return 'cup';
      default: return 'food-variant';
    }
  };

  const getTimeUntilExpiry = (expiryDateTime: string) => {
    const now = new Date();
    const expiry = new Date(expiryDateTime);
    const diff = expiry.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 0) return 'Expired';
    if (hours < 24) return `${hours}h left`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Available Donations</Text>
      <Text style={styles.headerSubtitle}>
        {getFilteredDonations().length} donations found
      </Text>
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.searchContainer}>
      <Searchbar
        placeholder="Search donations..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        <Button
          mode={filterBy === 'all' ? 'contained' : 'outlined'}
          onPress={() => setFilterBy('all')}
          style={styles.filterButton}
          compact
        >
          All ({donations.length})
        </Button>
        <Button
          mode={filterBy === 'urgent' ? 'contained' : 'outlined'}
          onPress={() => setFilterBy('urgent')}
          style={styles.filterButton}
          compact
        >
          Urgent ({donations.filter(d => d.urgency === 'urgent' || d.urgency === 'high').length})
        </Button>
        <Button
          mode={filterBy === 'nearby' ? 'contained' : 'outlined'}
          onPress={() => setFilterBy('nearby')}
          style={styles.filterButton}
          compact
        >
          Nearby ({donations.filter(d => parseFloat(d.distance) <= 3.0).length})
        </Button>
      </ScrollView>
    </View>
  );

  const renderDonationCard = (donation: Donation) => (
    <Card key={donation.id} style={styles.donationCard}>
      <Card.Content>
        <View style={styles.donationHeader}>
          <View style={styles.donationHeaderLeft}>
            <Text style={styles.donationTitle}>{donation.title}</Text>
            <Text style={styles.donorName}>by {donation.donorName}</Text>
          </View>
          <View style={styles.donationHeaderRight}>
            <Chip
              mode="flat"
              style={[styles.statusChip, { backgroundColor: `${getStatusColor(donation.status)}20` }]}
              textStyle={[styles.statusText, { color: getStatusColor(donation.status) }]}
            >
              {donation.status.toUpperCase()}
            </Chip>
          </View>
        </View>

        <View style={styles.donationDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name={getCategoryIcon(donation.foodType)}
              size={16}
              color="#718096"
            />
            <Text style={styles.detailText}>
              {donation.quantity} • {donation.estimatedServings} servings
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#718096" />
            <Text style={styles.detailText}>{donation.distance} away</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock" size={16} color="#718096" />
            <Text style={styles.detailText}>{getTimeUntilExpiry(donation.expiryDateTime)}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {donation.description}
        </Text>

        <View style={styles.donationFooter}>
          <Chip
            mode="flat"
            style={[styles.urgencyChip, { backgroundColor: `${getUrgencyColor(donation.urgency)}20` }]}
            textStyle={[styles.urgencyText, { color: getUrgencyColor(donation.urgency) }]}
          >
            {donation.urgency.toUpperCase()}
          </Chip>
          
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => {}}
              style={styles.actionButton}
              compact
            >
              View Details
            </Button>
            {donation.status === 'available' && (
              <Button
                mode="contained"
                onPress={() => {}}
                style={[styles.actionButton, styles.claimButton]}
                compact
              >
                Claim
              </Button>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

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
        {getFilteredDonations().map(donation => renderDonationCard(donation))}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB
        icon="filter"
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
  filterButton: {
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  donationCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  donationHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  donationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  donorName: {
    fontSize: 14,
    color: '#718096',
  },
  donationHeaderRight: {
    alignItems: 'flex-end',
  },
  statusChip: {
    height: 24,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  donationDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    marginBottom: 16,
  },
  donationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urgencyChip: {
    height: 24,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    minWidth: 80,
  },
  claimButton: {
    backgroundColor: '#FF8A50',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF8A50',
  },
});