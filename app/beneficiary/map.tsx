import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

interface NGOItem {
  id: string;
  name: string;
  address?: string;
  coordinates: { latitude: number; longitude: number } | null;
}

export default function FoodFinderMap() {
  const { authState } = useAuth();
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [location, setLocation] = useState({
    latitude: authState.user?.address?.coordinates?.latitude ?? 6.9271,
    longitude: authState.user?.address?.coordinates?.longitude ?? 79.8612,
    latitudeDelta: 0.08,
    longitudeDelta: 0.04,
  });

  const [ngos, setNgos] = useState<NGOItem[]>([]);
  const [loadingNgos, setLoadingNgos] = useState(true);

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

  // Try donor-facing endpoints first, then fallback to /api/ngos/locations and example data
  const fetchNgos = async () => {
    setLoadingNgos(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      const endpoints = [
        `${API_URL}/api/ngos`, // donor-facing list (preferred)
        `${API_URL}/api/ngos/locations`, // existing locations endpoint
      ];

      let data: any[] | null = null;

      for (const url of endpoints) {
        try {
          const res = await fetch(url);
          if (!res.ok) {
            console.warn(`NGO fetch failed (${res.status}) from ${url}`);
            continue;
          }
          const json = await res.json();
          // The donor-facing /api/ngos may return { ngos: [...] } or an array
          if (Array.isArray(json)) {
            data = json;
          } else if (json && Array.isArray(json.ngos)) {
            data = json.ngos;
          } else if (json && Array.isArray((json as any).data)) {
            data = (json as any).data;
          } else {
            // If response looks like a success wrapper
            data = Array.isArray(json) ? json : null;
          }

          if (data && data.length) {
            break; // stop at first successful endpoint with data
          }
        } catch (e) {
          console.warn('Fetch error for', url, e);
          continue;
        }
      }

      // Map/normalize the response to NGOItem[]
      const mapped = (data || []).map((n: any) => {
        // Support different shapes: n.address, n.location, n.address?.coordinates, n.coordinates
        let coords = null;
        if (n.coordinates && typeof n.coordinates === 'object') {
          coords = { latitude: Number(n.coordinates.latitude), longitude: Number(n.coordinates.longitude) };
        } else if (n.address && n.address.coordinates) {
          coords = { latitude: Number(n.address.coordinates.latitude), longitude: Number(n.address.coordinates.longitude) };
        } else if (n.location && n.location.coordinates) {
          // GeoJSON style [lng, lat] or object
          if (Array.isArray(n.location.coordinates) && n.location.coordinates.length >= 2) {
            coords = { latitude: Number(n.location.coordinates[1]), longitude: Number(n.location.coordinates[0]) };
          } else if (typeof n.location.coordinates === 'object') {
            coords = { latitude: Number(n.location.coordinates.latitude), longitude: Number(n.location.coordinates.longitude) };
          }
        }

        return {
          id: n._id || n.id || String(Math.random()),
          name: n.name || n.organizationName || n.businessName || 'NGO',
          address: n.address?.street || n.address || n.location?.address || '',
          coordinates: coords,
        } as NGOItem;
      }).filter(i => i.coordinates && !Number.isNaN(i.coordinates.latitude) && !Number.isNaN(i.coordinates.longitude));

      if (mapped.length) {
        setNgos(mapped);
      } else {
        // Fallback example data for UI
        setNgos([
          { id: 'ex1', name: 'Community Kitchen', address: 'Colombo', coordinates: { latitude: location.latitude + 0.005, longitude: location.longitude + 0.005 } },
          { id: 'ex2', name: 'Hope Center', address: 'Colombo', coordinates: { latitude: location.latitude + 0.01, longitude: location.longitude - 0.005 } },
        ]);
      }
    } catch (err) {
      console.error('Error fetching NGO locations:', err);
      setNgos([
        { id: 'ex1', name: 'Community Kitchen', address: 'Colombo', coordinates: { latitude: location.latitude + 0.005, longitude: location.longitude + 0.005 } },
      ]);
    } finally {
      setLoadingNgos(false);
    }
  };

  if (loadingLocation || loadingNgos) {
    return <LoadingSpinner message="Loading map..." />;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={location}
        region={location}
        showsUserLocation
      >
        {/* User location marker */}
        <Marker
          coordinate={{ latitude: location.latitude, longitude: location.longitude }}
          title="You"
          description={authState.user?.address?.city || 'You'}
          pinColor="#FF8A50"
        />

        {/* NGO markers as red pins */}
        {ngos.map((ngo) => (
          <Marker
            key={ngo.id}
            coordinate={ngo.coordinates as { latitude: number; longitude: number }}
            title={ngo.name}
            description={ngo.address}
            pinColor="#FF3B30"
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
});