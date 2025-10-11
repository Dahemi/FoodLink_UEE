import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Chip, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface HistoryItem {
  id: string;
  type: 'requirement' | 'donation' | 'distribution';
  title: string;
  description: string;
  date: string;
  status: 'completed' | 'in_progress' | 'cancelled';
  details: {
    servings?: number;
    beneficiaries?: number;
    volunteers?: number;
    location?: string;
  };
}

export default function NGOHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filterBy, setFilterBy] = useState<'all' | 'requirements' | 'donations' | 'distributions'>('all');

  // Dummy history data
  const [historyItems] = useState<HistoryItem[]>([
    {
      id: '1',
      type: 'requirement',
      title: 'Emergency Food for Flood Victims',
      description: 'Successfully fulfilled requirement for emergency food supplies during recent flood crisis',
      date: '2025-01-07T15:30:00Z',
      status: 'completed',
      details: {
        servings: 500,
        beneficiaries: 125,
        volunteers: 8,
        location: 'Kelaniya Relief Center',
      },
    },
    {
      id: '2',
      type: 'donation',
      title: 'Bakery Items from Sunshine Bakery',
      description: 'Received and distributed fresh bakery items to families in need',
      date: '2025-01-06T09:15:00Z',
      status: 'completed',
      details: {
        servings: 80,
        beneficiaries: 20,
        volunteers: 4,
        location: 'Community Center',
      },
    },
    {
      id: '3',
      type: 'distribution',
      title: 'Weekly Community Kitchen',
      description: 'Regular weekly distribution event for elderly residents',
      date: '2025-01-05T12:00:00Z',
      status: 'completed',
      details: {
        servings: 150,
        beneficiaries: 50,
        volunteers: 6,
        location: 'Elderly Care Center',
      },
    },
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const getFilteredHistory = () => {
    let filtered = historyItems;
    
    if (filterBy !== 'all') {
      filtered = filtered.filter(item => item.type === filterBy.slice(0, -1));
    }
    
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'requirement': return '#FF8A50';
      case 'donation': return '#4CAF50';
      case 'distribution': return '#2196F3';
      default: return '#718096';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'requirement': return 'clipboard-list';
      case 'donation': return 'gift';
      case 'distribution': return 'truck-delivery';
      default: return 'file-document';
    }
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
        placeholder="Search activities..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['all', 'requirements', 'donations', 'distributions'].map((filter) => (
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

  const renderSummaryStats = () => {
    const completedItems = historyItems.filter(item => item.status === 'completed');
    const totalServings = completedItems.reduce((sum, item) => sum + (item.details.servings || 0), 0);
    const totalBeneficiaries = completedItems.reduce((sum, item) => sum + (item.details.beneficiaries || 0), 0);
    const totalVolunteers = completedItems.reduce((sum, item) => sum + (item.details.volunteers || 0), 0);

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Impact Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{totalServings.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Servings</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{totalBeneficiaries.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>People Helped</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{totalVolunteers}</Text>
            <Text style={styles.summaryLabel}>Volunteers Engaged</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{completedItems.length}</Text>
            <Text style={styles.summaryLabel}>Activities Completed</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHistoryCard = (item: HistoryItem) => (
    <Card key={item.id} style={styles.historyCard}>
      <Card.Content>
        <View style={styles.historyHeader}>
          <View style={styles.typeSection}>
            <MaterialCommunityIcons
              name={getTypeIcon(item.type)}
              size={20}
              color={getTypeColor(item.type)}
            />
            <Chip
              mode="flat"
              style={[styles.typeChip, { backgroundColor: `${getTypeColor(item.type)}20` }]}
              textStyle={[styles.typeText, { color: getTypeColor(item.type) }]}
            >
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Chip>
          </View>
          <Text style={styles.dateText}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.historyTitle}>{item.title}</Text>
        <Text style={styles.historyDescription}>{item.description}</Text>

        {item.details && (
          <View style={styles.detailsContainer}>
            <View style={styles.metric}>
              <MaterialCommunityIcons name="food" size={16} color="#718096" />
              <Text style={styles.metricText}>{item.details.servings} servings</Text>
            </View>
            <View style={styles.metric}>
              <MaterialCommunityIcons name="account-group" size={16} color="#718096" />
              <Text style={styles.metricText}>{item.details.beneficiaries} people</Text>
            </View>
            <View style={styles.metric}>
              <MaterialCommunityIcons name="account-heart" size={16} color="#718096" />
              <Text style={styles.metricText}>{item.details.volunteers} volunteers</Text>
            </View>
          </View>
        )}

        {item.details.location && (
          <View style={styles.locationContainer}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#718096" />
            <Text style={styles.locationText}>{item.details.location}</Text>
          </View>
        )}

        <View style={styles.actionContainer}>
          <Button
            mode="outlined"
            onPress={() => {}}
            style={styles.actionButton}
            compact
          >
            View Details
          </Button>
          {item.status === 'completed' && (
            <Button
              mode="text"
              onPress={() => {}}
              textColor="#FF8A50"
              compact
            >
              Share Impact
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
        {renderSummaryStats()}
        {getFilteredHistory().map(item => renderHistoryCard(item))}
        
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
  typeChip: {
    height: 24,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
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
  },
});