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
import { Card, Chip, Searchbar, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
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
  const { authState } = useAuth();
  const [foodPoints, setFoodPoints] = useState<FoodPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('home');

  const userCoords = authState.user?.address?.coordinates ?? { latitude: 6.9271, longitude: 79.8612 };

  useEffect(() => {
    loadFoodPoints();
  }, []);

  const loadFoodPoints = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      const endpoints = [
        `${API_URL}/api/ngos`, // donor-facing list (preferred)
        `${API_URL}/api/ngos/locations`, // fallback locations endpoint
      ];

      let data: any[] | null = null;

      for (const url of endpoints) {
        try {
          const res = await fetch(url);
          if (!res.ok) {
            console.warn(`FoodPoints fetch failed (${res.status}) from ${url}`);
            continue;
          }
          const json = await res.json();
          if (Array.isArray(json)) {
            data = json;
          } else if (json && Array.isArray(json.ngos)) {
            data = json.ngos;
          } else if (json && Array.isArray((json as any).data)) {
            data = (json as any).data;
          } else {
            data = Array.isArray(json) ? json : null;
          }

          if (data && data.length) break;
        } catch (e) {
          console.warn('Fetch error for', url, e);
          continue;
        }
      }

      const enriched = (data || []).map((p: any) => {
        // normalize coordinates from different shapes
        let coords: { latitude: number; longitude: number } | null = null;
        if (p.coordinates && typeof p.coordinates === 'object') {
          coords = { latitude: Number(p.coordinates.latitude), longitude: Number(p.coordinates.longitude) };
        } else if (p.address && p.address.coordinates) {
          coords = { latitude: Number(p.address.coordinates.latitude), longitude: Number(p.address.coordinates.longitude) };
        } else if (p.location && p.location.coordinates) {
          if (Array.isArray(p.location.coordinates) && p.location.coordinates.length >= 2) {
            // GeoJSON style [lng, lat]
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

      // sort by distance when available
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

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Food Distributions</Text>
        <IconButton icon="filter-variant" size={22} onPress={() => Alert.alert('Filter', 'Filter not implemented yet')} />
      </View>

      <Searchbar
        placeholder="Search food points"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />

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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 18, fontWeight: '600', color: '#2D3748' },
  search: { margin: 12, marginBottom: 4 },
  listContainer: { paddingHorizontal: 12, paddingBottom: 24 },
  card: { marginVertical: 6, borderRadius: 10, backgroundColor: '#FFF8F0' },
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  left: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#FFF0E6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  icon: { fontSize: 20 },
  info: { maxWidth: width * 0.55 },
  name: { fontSize: 16, fontWeight: '600', color: '#2D3748' },
  sub: { fontSize: 12, color: '#718096', marginTop: 4 },
  right: { alignItems: 'flex-end' },
  openChip: { backgroundColor: '#FFF4EB', borderColor: '#FF8A50', borderWidth: 0.5 },
  pickupChip: { backgroundColor: '#FFF8E6', borderColor: '#FFC107', borderWidth: 0.5 },
  closedChip: { backgroundColor: '#FFF1F0', borderColor: '#F44336', borderWidth: 0.5 },
  chipText: { color: '#2D3748', fontSize: 12 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#718096' },
});