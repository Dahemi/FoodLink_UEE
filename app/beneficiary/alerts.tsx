import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Chip, IconButton, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_KEY_CANDIDATES = [
  '@beneficiary_auth',
  'beneficiaryAuthToken',
  'beneficiary_token',
  'authToken',
  'ngoAuthToken',
];

function getBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
  return url.replace(/\/$/, '');
}

async function resolveToken(): Promise<string | null> {
  // Try common storage keys
  for (const k of BASE_KEY_CANDIDATES) {
    try {
      const raw = await AsyncStorage.getItem(k);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.token) return parsed.token;
        if (parsed?.accessToken) return parsed.accessToken;
      } catch {
        // raw token string
        return raw;
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function httpWithAuth<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = getBaseUrl();
  const token = await resolveToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = json?.message || `Request failed (${res.status})`;
    throw new Error(err);
  }
  return (json.data || json) as T;
}

export interface ServerNotification {
  _id?: string;
  notificationId?: string;
  title: string;
  body: string;
  shortText?: string;
  type?: string;
  createdAt?: string;
  isRead?: boolean;
  recipientId?: string;
  recipientType?: string;
  data?: any;
}

export const NotificationApi = {
  async getNotifications(recipientId?: string, recipientType: string = 'beneficiary'): Promise<ServerNotification[]> {
    const q = new URLSearchParams();
    if (recipientId) q.set('recipientId', recipientId);
    q.set('recipientType', recipientType);
    return await httpWithAuth<ServerNotification[]>(`/api/notifications?${q.toString()}`, { method: 'GET' });
  },

  async markAsRead(notificationId: string): Promise<void> {
    await httpWithAuth(`/api/notifications/${notificationId}/mark-read`, {
      method: 'POST',
      body: JSON.stringify({ notificationId }),
    });
  },

  async markMultipleAsRead(notificationIds: string[], recipientId?: string): Promise<void> {
    await httpWithAuth(`/api/notifications/mark-read`, {
      method: 'POST',
      body: JSON.stringify({ notificationIds, recipientId }),
    });
  },

  async deleteAllForRecipient(recipientId: string, recipientType: string = 'beneficiary'): Promise<void> {
    await httpWithAuth(`/api/notifications/clear`, {
      method: 'POST',
      body: JSON.stringify({ recipientId, recipientType }),
    });
  }
};

const { width } = Dimensions.get('window');

interface AlertItem {
    id: string;
    title: string;
    shortText?: string;
    time: string;
    type: 'donation' | 'task' | 'system' | 'general';
    read?: boolean;
}

const STORAGE_KEY = '@beneficiary_alerts_v1';

const DEFAULT_ALERTS: AlertItem[] = [
    { id: 'a1', title: 'New Donation Nearby', shortText: 'Fresh meals available 0.8 mi away', time: '10m ago', type: 'donation', read: false },
    { id: 'a2', title: 'Pickup Reminder', shortText: 'Your scheduled pickup at 3:00 PM', time: '1h ago', type: 'task', read: false },
    { id: 'a3', title: 'System Notice', shortText: 'Maintenance tonight 11PM - 12AM', time: 'Yesterday', type: 'system', read: true },
];

export default function BeneficiaryAlerts() {
    const router = useRouter();
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) {
                setAlerts(JSON.parse(raw));
            } else {
                setAlerts(DEFAULT_ALERTS);
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ALERTS));
            }
        } catch (err) {
            console.error('Failed to load alerts', err);
            setAlerts(DEFAULT_ALERTS);
        } finally {
            setLoading(false);
        }
    };

    const saveAlerts = async (next: AlertItem[]) => {
        try {
            setAlerts(next);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (err) {
            console.error('Failed to save alerts', err);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        // Simulate fetching a new alert: add simple mock alert on refresh
        const newAlert: AlertItem = {
            id: Date.now().toString(),
            title: 'New Nearby Food Point',
            shortText: 'A community kitchen just posted fresh meals nearby.',
            time: 'Just now',
            type: 'donation',
            read: false,
        };
        const next = [newAlert, ...alerts];
        await saveAlerts(next);
        setTimeout(() => setRefreshing(false), 600);
    };

    const openAlert = async (item: AlertItem) => {
        // Mark as read when opened
        if (!item.read) {
            const next = alerts.map(a => a.id === item.id ? { ...a, read: true } : a);
            await saveAlerts(next);
        }
        Alert.alert(item.title, item.shortText || '');
    };

    const markAllRead = async () => {
        const next = alerts.map(a => ({ ...a, read: true }));
        await saveAlerts(next);
    };

    const clearAll = () => {
        Alert.alert('Clear All Alerts', 'Are you sure you want to remove all alerts?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Clear',
                style: 'destructive',
                onPress: async () => {
                    await saveAlerts([]);
                },
            },
        ]);
    };

    const toggleRead = async (id: string) => {
        const next = alerts.map(a => a.id === id ? { ...a, read: !a.read } : a);
        await saveAlerts(next);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Alerts</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Button compact mode="text" onPress={markAllRead} labelStyle={{ color: '#FF8A50', fontWeight: '600' }}>
                        Mark all read
                    </Button>
                    <IconButton
                        icon="trash-can-outline"
                        size={22}
                        onPress={clearAll}
                        iconColor="#F56565"
                    />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF8A50']} />}
            >
                {alerts.map((a) => (
                    <TouchableOpacity
                        key={a.id}
                        activeOpacity={0.85}
                        onPress={() => openAlert(a)}
                        onLongPress={() => toggleRead(a.id)}
                        style={styles.touchable}
                    >
                        <Card style={[styles.card, a.read ? styles.readCard : null]}>
                            <View style={styles.cardContent}>
                                <View style={styles.left}>
                                    <Text style={styles.emoji}>
                                        {a.type === 'donation' ? '📦' : a.type === 'task' ? '📅' : a.type === 'system' ? '⚙️' : '🔔'}
                                    </Text>

                                    <View style={styles.info}>
                                        <Text style={[styles.alertTitle, a.read ? { color: '#A0AEC0' } : null]}>{a.title}</Text>
                                        {a.shortText ? <Text style={styles.subtitle}>{a.shortText}</Text> : null}
                                    </View>
                                </View>

                                <View style={styles.right}>
                                    <Text style={styles.time}>{a.time}</Text>
                                    <Chip style={styles.chip} textStyle={styles.chipText}>
                                        {a.type}
                                    </Chip>
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
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },

    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D3748',
    },

    list: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 24,
    },

    touchable: {
        marginVertical: 6,
    },

    card: {
        borderRadius: 10,
        backgroundColor: '#FFF8F0',
        elevation: 2,
    },

    readCard: {
        backgroundColor: '#F7FAFC',
    },

    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },

    left: {
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: width * 0.65,
    },

    emoji: {
        fontSize: 22,
        marginRight: 12,
    },

    info: {
        flexShrink: 1,
    },

    alertTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2D3748',
    },

    subtitle: {
        fontSize: 12,
        color: '#718096',
        marginTop: 4,
    },

    right: {
        alignItems: 'flex-end',
    },

    time: {
        fontSize: 11,
        color: '#A0AEC0',
    },

    chip: {
        marginTop: 6,
        backgroundColor: '#FFF8E6',
        borderColor: '#FFC107',
        borderWidth: 0.5,
    },

    chipText: {
        fontSize: 11,
        color: '#2D3748',
    },

    empty: {
        padding: 40,
        alignItems: 'center',
    },

    emptyText: {
        color: '#718096',
    },
});