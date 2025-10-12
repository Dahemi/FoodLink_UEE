import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Card, Chip, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface AlertItem {
  id: string;
  title: string;
  shortText?: string;
  time: string;
  type: 'donation' | 'task' | 'system' | 'general';
  read?: boolean;
}

const EXAMPLE_ALERTS: AlertItem[] = [
  { id: 'a1', title: 'New Donation Nearby', shortText: 'Fresh meals available 0.8 mi away', time: '10m ago', type: 'donation', read: false },
  { id: 'a2', title: 'Pickup Reminder', shortText: 'Your scheduled pickup at 3:00 PM', time: '1h ago', type: 'task', read: false },
  { id: 'a3', title: 'System Notice', shortText: 'Maintenance tonight 11PM - 12AM', time: 'Yesterday', type: 'system', read: true },
];

export default function BeneficiaryAlerts() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Load real alerts from API when available. For now use example data.
    setAlerts(EXAMPLE_ALERTS);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: replace with real fetch call
    setTimeout(() => {
      setAlerts(EXAMPLE_ALERTS);
      setRefreshing(false);
    }, 800);
  };

  const openAlert = (item: AlertItem) => {
    // If you have an alert details page, navigate there. Use the same navigation style used in map/profile.
    // e.g. router.push(`/beneficiary/alert-details?id=${item.id}`)
    Alert.alert(item.title, item.shortText || '');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <IconButton icon="bell-outline" size={22} onPress={() => Alert.alert('Notifications', 'Manage alert settings in Profile')} />
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {alerts.map((a) => (
          <TouchableOpacity key={a.id} activeOpacity={0.85} onPress={() => openAlert(a)}>
            <Card style={[styles.card, a.read ? styles.readCard : null]}>
              <View style={styles.cardContent}>
                <View style={styles.left}>
                  <Text style={styles.emoji}>
                    {a.type === 'donation' ? '📦' : a.type === 'task' ? '📅' : a.type === 'system' ? '⚙️' : '🔔'}
                  </Text>
                  <View style={styles.info}>
                    <Text style={styles.alertTitle}>{a.title}</Text>
                    {a.shortText ? <Text style={styles.subtitle}>{a.shortText}</Text> : null}
                  </View>
                </View>

                <View style={styles.right}>
                  <Text style={styles.time}>{a.time}</Text>
                  <Chip style={styles.chip} textStyle={styles.chipText}>{a.type}</Chip>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {alerts.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No alerts right now.</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 },
  title: { fontSize: 18, fontWeight: '600', color: '#2D3748' },
  list: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 24 },
  card: { marginVertical: 6, borderRadius: 10, backgroundColor: '#FFF8F0' },
  readCard: { backgroundColor: '#F7FAFC' },
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  left: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 22, marginRight: 12 },
  info: { maxWidth: width * 0.55 },
  alertTitle: { fontSize: 15, fontWeight: '600', color: '#2D3748' },
  subtitle: { fontSize: 12, color: '#718096', marginTop: 4 },
  right: { alignItems: 'flex-end' },
  time: { fontSize: 11, color: '#A0AEC0' },
  chip: { marginTop: 6, backgroundColor: '#FFF8E6', borderColor: '#FFC107', borderWidth: 0.5 },
  chipText: { fontSize: 11, color: '#2D3748' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#718096' },
});