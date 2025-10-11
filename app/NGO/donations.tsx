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
  donor: string;
  foodType: string;
  quantity: string;
  estimatedServings: number;
  expiryTime: string;
  status: 'available' | 'claimed' | 'expired';
  distance: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
}

export default function NGODonations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filterBy, setFilterBy] = useState<'all' | 'available' | 'claimed'>('all');

  // Dummy donations data
  const [donations] = useState<Donation[]>([
    {
      id: '1',
      title: 'Fresh Vegetables & Fruits',
      donor: 'Green Valley Restaurant',
      foodType: 'fruits_vegetables',
      quantity: '30kg mixed',
      estimatedServings: 80,
      expiryTime: '4 hours',
      status: 'available',
      distance: '2.3km',
      urgency: 'high',
    },
    {
      id: '2',
      title: 'Cooked Rice & Curry',
      donor: 'Hotel Paradise',
      foodType: 'cooked_meal',
      quantity: '50 portions',
      estimatedServings: 50,
      expiryTime: '2 hours',
      status: 'available',
      distance: '1.8km',
      urgency: 'urgent',
    },
    {
      id: '3',
      title: 'Bakery Items',
      donor: 'Sunshine Bakery',
      foodType: 'bakery',
      quantity: '40 pieces',
      estimatedServings: 40,
      expiryTime: '6 hours',
      status: 'claimed',
      distance: '3.1km',
      urgency: 'medium',
    },
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 1500);
  };

  const getFilteredDonations = () => {
    let filtered = donations;
    
    if (filterBy !== 'all') {
      filtered = filtered.filter(donation => donation.status === filterBy);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(donation =>
        donation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        donation.donor.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
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
      default: return 'food-apple';
    }
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
        {['all', 'available', 'claimed'].map((filter) => (
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

  const renderDonationCard = (donation: Donation) => (
    <Card key={donation.id} style={styles.donationCard}>
      <Card.Content>
        <View style={styles.donationHeader}>
          <View style={styles.donationTitleSection}>
            <Text style={styles.donationTitle}>{donation.title}</Text>
            <Text style={styles.donorName}>by {donation.donor}</Text>
          </View>
          <View style={styles.urgencySection}>
            <Chip
              mode="flat"
              style={[styles.urgencyChip, { backgroundColor: `${getUrgencyColor(donation.urgency)}20` }]}
              textStyle={[styles.urgencyText, { color: getUrgencyColor(donation.urgency) }]}
            >
              {donation.urgency.toUpperCase()}
            </Chip>
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
            <Text style={styles.detailText}>Expires in {donation.expiryTime}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
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
              Claim Donation
            </Button>
          )}
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
  filterChip: {
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  donationCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  donationTitleSection: {
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
  urgencySection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  urgencyChip: {
    height: 24,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusChip: {
    height: 24,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  donationDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4A5568',
  },
  actionRow: {
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