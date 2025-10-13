import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, Image, Modal, SafeAreaView, ScrollView, Pressable, Dimensions } from 'react-native';
import MapView, { Marker, MapViewProps, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Chip, Card } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { NavigationService } from '../../services/navigationService';
import { FoodPointReminderService } from '../../services/foodPointReminderService';
import { DirectionsApi } from '../../services/directionsApi';
import { LocationService } from '../../services/LocationService';

interface NGOItem {
  id: string;
  name: string;
  address?: string;
  coordinates: { latitude: number; longitude: number } | null;
  website?: string;
  operatingHours?: { start?: string; end?: string };
  isVerified?: boolean;
  image?: string;
}

export default function FoodFinderMap() {
  const { authState } = useAuth();
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingNgos, setLoadingNgos] = useState(true);
  const [location, setLocation] = useState({
    latitude: authState.user?.address?.coordinates?.latitude ?? 6.9271,
    longitude: authState.user?.address?.coordinates?.longitude ?? 79.8612,
    latitudeDelta: 0.08,
    longitudeDelta: 0.04,
  });
  const [ngos, setNgos] = useState<NGOItem[]>([]);
  const [selectedNgo, setSelectedNgo] = useState<NGOItem | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceText?: string; durationText?: string } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // New: full/detail view visible state (replaces separate route)
  const [fullDetailsVisible, setFullDetailsVisible] = useState(false);

  // Read incoming query params when navigating from Home -> Map
  const params = useLocalSearchParams<{ lat?: string; lng?: string; id?: string; ts?: string }>();
  const lastPanRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to show nearby food points.');
        } else {
          const current = await Location.getCurrentPositionAsync({});
          setLocation(prev => ({
            ...prev,
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          }));
        }
      } catch (err) {
        console.error('Error getting location:', err);
      } finally {
        setLoadingLocation(false);
      }
    })();

    fetchNgos();
  }, []);

  useEffect(() => {
    if (!params?.lat || !params?.lng) return;

    const lat = Number(params.lat);
    const lng = Number(params.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    // Build a key that includes id + coordinates + timestamp (ts) so repeated taps always produce a new key
    const key = `${params.id ?? ''}@${params.lat},${params.lng}@${params.ts ?? ''}`;

    // If we've already panned for this exact key, skip; otherwise animate & select
    if (lastPanRef.current === key) return;
    lastPanRef.current = key;

    // Small timeout to ensure map has mounted/rendered
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
          350
        );
      }

      // Populate a minimal selectedNgo so the callout / bottom sheet can show if needed
      setSelectedNgo(prev => ({
        id: params.id || prev?.id || `p-${Date.now()}`,
        name: params?.name || prev?.name || 'Location',
        address: params?.address || prev?.address || '',
        coordinates: { latitude: lat, longitude: lng },
      } as any));
    }, 120);
  }, [params?.lat, params?.lng, params?.id, params?.ts]);

  const resolveToken = async (): Promise<string | null> => {
    const tFromCtx = (authState as any)?.token || (authState as any)?.accessToken;
    if (tFromCtx) return tFromCtx as string;
    const keys = ['@beneficiary_auth', 'beneficiaryAuthToken', 'authToken'];
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
      } catch {
        continue;
      }
    }
    return null;
  };

  const fetchNgos = async () => {
    setLoadingNgos(true);
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
            console.warn('NGO endpoint requires auth:', url, res.status);
            continue;
          }
          if (!res.ok) continue;
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

      const mapped: NGOItem[] = (data || []).map((n: any) => {
        let coords = null;
        if (n.coordinates && typeof n.coordinates === 'object') {
          coords = { latitude: Number(n.coordinates.latitude), longitude: Number(n.coordinates.longitude) };
        } else if (n.address && n.address.coordinates) {
          coords = { latitude: Number(n.address.coordinates.latitude), longitude: Number(n.address.coordinates.longitude) };
        } else if (n.location && n.location.coordinates) {
          if (Array.isArray(n.location.coordinates) && n.location.coordinates.length >= 2) {
            coords = { latitude: Number(n.location.coordinates[1]), longitude: Number(n.location.coordinates[0]) };
          } else if (typeof n.location.coordinates === 'object') {
            coords = { latitude: Number(n.location.coordinates.latitude), longitude: Number(n.location.coordinates.longitude) };
          }
        }
        return {
          id: n._id || n.id || String(Math.random()),
          name: n.name || n.organizationName || 'NGO',
          address: n.address?.street || n.address || n.location?.address || '',
          coordinates: coords,
          website: n.website,
          operatingHours: n.operatingHours || n.operatingHours || { start: n.openAt, end: n.closeAt },
          isVerified: !!n.isVerified,
          image: n.image || n.photoUrl || null,
        } as NGOItem;
      }).filter(i => i.coordinates && !Number.isNaN(i.coordinates.latitude) && !Number.isNaN(i.coordinates.longitude));

      if (mapped.length) setNgos(mapped);
      else {
        setNgos([
          { id: 'ex1', name: 'Community Kitchen', address: 'Colombo', coordinates: { latitude: location.latitude + 0.005, longitude: location.longitude + 0.005 } },
        ]);
      }
    } catch (err) {
      console.error('Error fetching NGO locations:', err);
      setNgos([{ id: 'ex1', name: 'Community Kitchen', address: 'Colombo', coordinates: { latitude: location.latitude + 0.005, longitude: location.longitude + 0.005 } }]);
    } finally {
      setLoadingNgos(false);
    }
  };

  const onMarkerPress = (ngo: NGOItem) => {
    setSelectedNgo(ngo);
    if (ngo.coordinates && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: ngo.coordinates.latitude,
        longitude: ngo.coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 300);
    }
  };

  const handleDirections = (ngo: NGOItem) => {
    const addr = ngo.address || ngo.name;
    NavigationService.openMaps(addr, ngo.name);
  };

  const handleGetDirections = async (ngo: NGOItem) => {
    if (!ngo?.coordinates) return Alert.alert('No coordinates available');
    try {
      setLoadingRoute(true);
      const origin = await LocationService.getCurrentLocation();
      if (!origin) {
        Alert.alert('Location required', 'Allow location access to show directions.');
        setLoadingRoute(false);
        return;
      }
      const res = await DirectionsApi.getDirections(origin, ngo.coordinates as { latitude: number; longitude: number });
      setRouteCoords(res.coordinates);
      setRouteInfo({ distanceText: res.distanceText, durationText: res.durationText });
      // Fit map to route: animate to first point then region covering middle - simple approach
      const middle = res.coordinates[Math.floor(res.coordinates.length / 2)];
      if (mapRef.current && middle) {
        mapRef.current.animateToRegion({ latitude: middle.latitude, longitude: middle.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 400);
      }
    } catch (err: any) {
      console.warn('Directions failed', err);
      Alert.alert('Directions error', err?.message || 'Could not get directions');
    } finally {
      setLoadingRoute(false);
    }
  };

  // Open the in-screen detail sheet (no new navigation)
  const handleSeeDetails = (ngo: NGOItem) => {
    setSelectedNgo(ngo);
    setFullDetailsVisible(true);
  };

  if (loadingLocation || loadingNgos) return <LoadingSpinner message="Loading map..." />;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={location}
        showsUserLocation
      >
        <Marker
          coordinate={{ latitude: location.latitude, longitude: location.longitude }}
          title="You"
          pinColor="#FF8A50"
        />

        {ngos.map((ngo) => (
          <Marker
            key={ngo.id}
            coordinate={ngo.coordinates as { latitude: number; longitude: number }}
            title={ngo.name}
            description={ngo.address}
            pinColor="#FF3B30"
            onPress={() => onMarkerPress(ngo)}
          />
        ))}

        {/* render route if available */}
        {routeCoords && routeCoords.length > 1 && (
          <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#FF8A50" lineCap="round" lineJoin="round" />
        )}
      </MapView>

      {/* small info bar when route is present */}
      {routeInfo && (
        <View style={{ position: 'absolute', top: 80, left: 12, right: 12, padding: 10, backgroundColor: '#FFFFFF', borderRadius: 8, elevation: 4 }}>
          <Text style={{ fontWeight: '700' }}>{routeInfo.durationText || '—'}</Text>
          <Text style={{ color: '#718096' }}>{routeInfo.distanceText || ''}</Text>
        </View>
      )}

      {/* Bottom callout */}
      {selectedNgo && !fullDetailsVisible && (
        <Card style={styles.calloutCard} mode="elevated">
          <View style={styles.calloutInner}>
            <View style={styles.left}>
              {selectedNgo.image ? (
                <Image source={{ uri: selectedNgo.image }} style={styles.thumbnail} />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Text style={{ fontSize: 18 }}>🏥</Text>
                </View>
              )}
            </View>

            <View style={styles.middle}>
              <Text style={styles.name}>{selectedNgo.name}</Text>
              <Text style={styles.address}>{selectedNgo.address}</Text>
              <Text style={styles.hours}>
                {selectedNgo.operatingHours?.start ? `Hours: ${selectedNgo.operatingHours.start} - ${selectedNgo.operatingHours.end ?? ''}` : ''}
              </Text>
            </View>

            <View style={styles.right}>
              <Chip compact style={styles.openChip}>{selectedNgo.isVerified ? 'Verified' : 'NGO'}</Chip>
              <Button mode="contained" onPress={() => handleDirections(selectedNgo)} style={styles.dirBtn} compact>Directions</Button>
              <Button mode="outlined" onPress={() => handleSeeDetails(selectedNgo)} compact>See Details</Button>
            </View>
          </View>
        </Card>
      )}

      {/* Full detail modal / sheet (matches wireframe; no new route) */}
      <Modal visible={fullDetailsVisible} animationType="slide" onRequestClose={() => setFullDetailsVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.handle} />
            {selectedNgo?.image ? (
              <Image source={{ uri: selectedNgo.image }} style={styles.modalImage} />
            ) : (
              <View style={styles.modalImagePlaceholder}><Text style={{fontSize:24}}>🏥</Text></View>
            )}

            <Text style={styles.modalTitle}>{selectedNgo?.name}</Text>
            <Text style={styles.modalSubtitle}>{selectedNgo?.address}</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hours</Text>
              <Text style={styles.sectionText}>
                {selectedNgo?.operatingHours?.start ? `Open Now • ${selectedNgo?.operatingHours.start} - ${selectedNgo?.operatingHours.end ?? ''}` : 'Not available'}
              </Text>
            </View>

            <Button mode="contained" onPress={() => {
              if (selectedNgo) {
                NavigationService.openMaps(selectedNgo.address || selectedNgo.name, selectedNgo.name);
              }
            }} style={styles.actionBtn}>
              Get Directions
            </Button>

            <Button
              mode="outlined"
              textColor="#2D3748"
              onPress={async () => {
                try {
                  if (selectedNgo?.id) {
                    await FoodPointReminderService.saveMetaEntry({
                      id: selectedNgo.id,
                      name: selectedNgo.name,
                      address: selectedNgo.address ?? '',
                      enabled: false,
                      minutesFromNow: 30,
                    });
                  }
                } catch (err) {
                  console.warn('Could not prepopulate reminder meta', err);
                }

                const q = `open=reminders&id=${encodeURIComponent(selectedNgo?.id || '')}&name=${encodeURIComponent(selectedNgo?.name || '')}&address=${encodeURIComponent(selectedNgo?.address || '')}`;
                // Use replace to avoid pushing duplicate history / re-trigger loops
                router.replace(`/beneficiary/profile?${q}`);
              }}
              style={[styles.actionBtn, { marginTop: 8 }]}
            >
              Set Reminder
            </Button>

            <Button mode="text" onPress={() => setFullDetailsVisible(false)} style={{ marginTop: 12 }}>
              Close
            </Button>

            <View style={{ height: 100 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  calloutCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 18,
    borderRadius: 12,
    padding: 8,
    elevation: 6,
  },
  calloutInner: { flexDirection: 'row', alignItems: 'center' },
  left: { marginRight: 12 },
  thumbnail: { width: 84, height: 64, borderRadius: 8 },
  thumbnailPlaceholder: { width: 84, height: 64, borderRadius: 8, backgroundColor: '#FFF4F0', alignItems: 'center', justifyContent: 'center' },
  middle: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#2D3748' },
  address: { fontSize: 12, color: '#718096', marginTop: 4 },
  hours: { fontSize: 12, color: '#48BB78', marginTop: 6 },
  right: { alignItems: 'flex-end', justifyContent: 'space-between' },
  openChip: { backgroundColor: '#FFF8E6', marginBottom: 6 },
  dirBtn: { backgroundColor: '#FF8A50', marginBottom: 6 },

  // New styles for modal
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalContent: { padding: 16, alignItems: 'center' },
  handle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginBottom: 12 },
  modalImage: { width: width - 32, height: 180, borderRadius: 8, marginBottom: 12 },
  modalImagePlaceholder: { width: width - 32, height: 180, borderRadius: 8, backgroundColor: '#FFF4F0', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2D3748', alignSelf: 'flex-start', marginLeft: 4 },
  modalSubtitle: { fontSize: 14, color: '#718096', alignSelf: 'flex-start', marginLeft: 4, marginTop: 4 },
  section: { width: '100%', marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#2D3748', marginBottom: 6 },
  sectionText: { fontSize: 14, color: '#4A5568' },
  actionBtn: { width: '100%', marginTop: 12, backgroundColor: '#FF8A50' },
});