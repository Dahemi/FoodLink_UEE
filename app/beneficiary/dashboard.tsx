import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Chip, Searchbar, IconButton, Avatar, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBeneficiaryAuth } from '../../context/BeneficiaryAuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const { width } = Dimensions.get('window');

interface FoodPoint {
  id: string;
  name: string;
  distance?: number; // computed
  distanceLabel?: string;
  status?: 'Open Now' | 'Closed' | 'Next Pickup';
  nextPickup?: string | null;
  coordinates?: { latitude: number; longitude: number } | null;
  address?: string;
}

const EXAMPLE_FOOD_POINTS: FoodPoint[] = [
  { id: '1', name: 'Community Kitchen', distanceLabel: '0.5 mi away', status: 'Open Now' },
  { id: '2', name: 'Food Bank of Riverdale', distanceLabel: '1.2 mi away', status: 'Next Pickup', nextPickup: '3:00 PM' },
  { id: '3', name: 'Helping Hands Pantry', distanceLabel: '2.8 mi away', status: 'Open Now' },
  { id: '4', name: 'The Giving Table', distanceLabel: '3.5 mi away', status: 'Next Pickup', nextPickup: '4:30 PM' },
  { id: '5', name: 'Hope Center', distanceLabel: '4.1 mi away', status: 'Open Now' },
];

function haversineDistance(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aCalc = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(aCalc), Math.sqrt(1 - aCalc));
  const distKm = R * c;
  const distMiles = distKm * 0.621371;
  return distMiles;
}

export default function BeneficiaryDashboard() {
  const router = useRouter();
  const { authState } = useBeneficiaryAuth();
  const [foodPoints, setFoodPoints] = useState<FoodPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [showFilters, setShowFilters] = useState(false);

  const userCoords = authState.user?.address?.coordinates ?? { latitude: 6.9271, longitude: 79.8612 };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeftRow}>
        <Avatar.Text
          size={48}
          label={getInitials(authState.user?.name)}
          style={styles.avatar}
        />
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Hello, {authState.user?.name?.split(' ')[0] || 'Member'}! 👋</Text>
          <Text style={styles.location}>📍 {authState.user?.address?.city ?? 'Colombo'}</Text>
        </View>
      </View>

      <IconButton
        icon="map-marker"
        size={22}
        iconColor="#2D3748"
        onPress={() => router.push('/beneficiary/map')}
        style={styles.notificationIcon}
      />
    </View>
  );

  const renderTitleAndSearch = () => (
    <View style={styles.titleSearchContainer}>
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Food Distributions</Text>
        <Text style={styles.pageSubtitle}>Find nearby distribution points and schedules</Text>
      </View>

      <View style={styles.searchFilterRow}>
        <Searchbar
          placeholder="Search food points..."
          onChangeText={setQuery}
          value={query}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />

        <Button
          mode="outlined"
          onPress={() => setShowFilters(true)}
          style={styles.filterButton}
          contentStyle={{ flexDirection: 'row-reverse' }}
        >
          Filter
        </Button>
      </View>
    </View>
  );

  useEffect(() => {
    loadFoodPoints();
  }, []);

  const resolveToken = async (): Promise<string | null> => {
    const tFromCtx = (authState as any)?.token || (authState as any)?.accessToken;
    if (tFromCtx) return tFromCtx as string;

    const keys = ['@beneficiary_auth', 'beneficiaryAuthToken', 'beneficiary_token', 'authToken', 'ngoAuthToken'];
    for (const k of keys) {
      try {
        const raw = await AsyncStorage.getItem(k);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.token) return parsed.token;
          if (parsed?.accessToken) return parsed.accessToken;
        } catch {
          return raw;
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  };

  const loadFoodPoints = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      const endpoints = [`${API_URL}/api/ngos`, `${API_URL}/api/ngos/locations`];

      const token = await resolveToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let data: any[] | null = null;
      for (const url of endpoints) {
        try {
          const res = await fetch(url, { headers });
          if (res.status === 401 || res.status === 403) {
            console.warn(`FoodPoints endpoint requires auth: ${url} -> ${res.status}`);
            continue;
          }
          if (!res.ok) {
            console.warn(`FoodPoints fetch failed (${res.status}) from ${url}`);
            continue;
          }
          const json = await res.json();
          if (Array.isArray(json)) data = json;
          else if (json && Array.isArray(json.ngos)) data = json.ngos;
          else if (json && Array.isArray((json as any).data)) data = (json as any).data;
          else data = Array.isArray(json) ? json : null;

          if (data && data.length) break;
        } catch (e) {
          console.warn('Fetch error for', url, e);
          continue;
        }
      }

      const enriched = (data || []).map((p: any) => {
        let coords: { latitude: number; longitude: number } | null = null;
        if (p.coordinates && typeof p.coordinates === 'object') {
          coords = { latitude: Number(p.coordinates.latitude), longitude: Number(p.coordinates.longitude) };
        } else if (p.address && p.address.coordinates) {
          coords = { latitude: Number(p.address.coordinates.latitude), longitude: Number(p.address.coordinates.longitude) };
        } else if (p.location && p.location.coordinates) {
          if (Array.isArray(p.location.coordinates) && p.location.coordinates.length >= 2) {
            coords = { latitude: Number(p.location.coordinates[1]), longitude: Number(p.location.coordinates[0]) };
          } else if (typeof p.location.coordinates === 'object') {
            coords = { latitude: Number(p.location.coordinates.latitude), longitude: Number(p.location.coordinates.longitude) };
          }
        }

        const fp: FoodPoint = {
          id: p._id || String(p.id) || `${p.name}-${Math.random()}`,
          name: p.name || p.organizationName || 'Unknown',
          coordinates: coords,
          address: p.address?.street || p.address || p.location?.address || '',
          nextPickup: p.nextPickup || null,
          status: p.isOpen ? 'Open Now' : p.nextPickup ? 'Next Pickup' : 'Closed',
        };

        if (fp.coordinates) {
          const d = haversineDistance(userCoords, fp.coordinates);
          fp.distance = d;
          fp.distanceLabel = `${d.toFixed(1)} mi away`;
        }

        return fp;
      });

      enriched.sort((a: FoodPoint, b: FoodPoint) => {
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return (a.distance || 0) - (b.distance || 0);
      });

      setFoodPoints(enriched.length ? enriched : EXAMPLE_FOOD_POINTS);
    } catch (err) {
      console.error('Failed to load food points', err);
      setFoodPoints(EXAMPLE_FOOD_POINTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFoodPoints();
  };

  const filtered = foodPoints.filter(fp => fp.name.toLowerCase().includes(query.toLowerCase()) || (fp.address || '').toLowerCase().includes(query.toLowerCase()));

  const handlePress = (fp: FoodPoint) => {
    // Navigate to map with coordinates if available, otherwise to a detail screen (not implemented)
    if (fp.coordinates) {
      router.push(`/beneficiary/map?lat=${fp.coordinates.latitude}&lng=${fp.coordinates.longitude}&id=${fp.id}`);
    } else {
      Alert.alert('Info', 'Location details not available for this food point.');
    }
  };

  const handleTabPress = (tabName: string) => {
    switch(tabName) {
      case 'home':
        setActiveTab('home');
        // Use replace so pressing tabs doesn't push many routes onto the stack
        router.replace('/beneficiary/dashboard');
        break;
      case 'map':
        setActiveTab('map');
        // Map is a separate screen under the beneficiary stack
        router.replace('/beneficiary/map');
        break;
      case 'alerts':
        setActiveTab('alerts');
        router.replace('/beneficiary/alerts');
        break;
      case 'profile':
        setActiveTab('profile');
        // Keep profile as the current screen (no navigation needed if already here)
        router.replace('/beneficiary/profile');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading map..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderTitleAndSearch()}

      <ScrollView
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filtered.map(fp => (
          <TouchableOpacity key={fp.id} onPress={() => handlePress(fp)} activeOpacity={0.8}>
            <Card style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.left}>
                  <View style={styles.iconWrap}>
                    <Text style={styles.icon}>📍</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{fp.name}</Text>
                    <Text style={styles.sub}>{fp.distanceLabel || '—'}</Text>
                  </View>
                </View>
                <View style={styles.right}>
                  {fp.status === 'Open Now' && <Chip style={styles.openChip} textStyle={styles.chipText}>Open Now</Chip>}
                  {fp.status === 'Next Pickup' && <Chip style={styles.pickupChip} textStyle={styles.chipText}>{fp.nextPickup ? `Next Pickup: ${fp.nextPickup}` : 'Next Pickup'}</Chip>}
                  {fp.status === 'Closed' && <Chip style={styles.closedChip} textStyle={styles.chipText}>Closed</Chip>}
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No food points found.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  headerLeftRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerText: { marginLeft: 12, flex: 1 },
  greeting: { fontSize: 16, color: '#718096' },
  location: { fontSize: 12, color: '#718096', marginTop: 2 },
  notificationIcon: { marginLeft: 8 },

  titleSearchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#F7FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  titleRow: { marginBottom: 10 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#2D3748' },
  pageSubtitle: { fontSize: 13, color: '#718096', marginTop: 4 },

  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    elevation: 0,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    fontSize: 14,
  },
  filterButton: {
    marginLeft: 8,
    borderColor: '#E2E8F0',
  },

  listContainer: { paddingHorizontal: 12, paddingBottom: 24 },
  card: { marginVertical: 6, borderRadius: 10, backgroundColor: '#FFF8F0' },
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  left: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#FFF0E6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  icon: { fontSize: 20 },
  info: { maxWidth: 220 },
  name: { fontSize: 16, fontWeight: '600', color: '#2D3748' },
  sub: { fontSize: 12, color: '#718096', marginTop: 4 },
  right: { alignItems: 'flex-end' },

  openChip: { backgroundColor: '#FFF4EB', borderColor: '#FF8A50', borderWidth: 0.5 },
  pickupChip: { backgroundColor: '#FFF8E6', borderColor: '#FFC107', borderWidth: 0.5 },
  closedChip: { backgroundColor: '#FFF1F0', borderColor: '#F44336', borderWidth: 0.5 },
  chipText: { color: '#2D3748', fontSize: 12 },

  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#718096' },

  avatar: { backgroundColor: '#FF8A50' },
});