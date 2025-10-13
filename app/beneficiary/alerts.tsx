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
import { NotificationApi, ServerNotification } from '../../services/notificationApi';
import { useBeneficiaryAuth } from '../../context/BeneficiaryAuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const { width } = Dimensions.get('window');

interface AlertItem {
    id: string;
    title: string;
    shortText?: string;
    time: string;
    type: string;
    read?: boolean;
    raw?: ServerNotification; // Store original notification data
}

export default function BeneficiaryAlerts() {
    const router = useRouter();
    const { authState } = useBeneficiaryAuth();
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load notifications from server
    const loadAlerts = async () => {
        try {
            setLoading(true);
            if (!authState.user?.id) {
                console.warn('No user ID available');
                return;
            }

            const serverNotifications = await NotificationApi.getNotifications(
                authState.user.id,
                'beneficiary'
            );

            // Transform server notifications to AlertItem format
            const transformed: AlertItem[] = serverNotifications
                .filter(n => n.recipientType === 'beneficiary') // Show all beneficiary notifications
                .map(notification => ({
                    id: notification.notificationId || notification._id || String(Math.random()),
                    title: notification.title,
                    shortText: notification.shortText || notification.body,
                    time: formatTime(notification.createdAt || new Date()),
                    type: notification.type || 'general',
                    read: notification.isRead,
                    raw: notification
                }));

            setAlerts(transformed);
        } catch (err) {
            console.error('Failed to load notifications:', err);
            Alert.alert('Error', 'Failed to load notifications. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAlerts();
    }, [authState.user?.id]);

    const formatTime = (date: string | Date) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diff = now.getTime() - notifDate.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days === 1) return 'Yesterday';
        return notifDate.toLocaleDateString();
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAlerts();
        setRefreshing(false);
    };

    const openAlert = async (item: AlertItem) => {
        try {
            if (!item.read && item.raw?.notificationId) {
                await NotificationApi.markAsRead(item.raw.notificationId);
                setAlerts(prev => 
                    prev.map(a => a.id === item.id ? { ...a, read: true } : a)
                );
            }

            // Handle donation notifications by navigating to map
            if (item.raw?.type === 'donation_available' && item.raw.data?.location) {
                const { location } = item.raw.data;
                router.push(`/beneficiary/map?lat=${location.coordinates.latitude}&lng=${location.coordinates.longitude}&id=${item.raw.data.ngoId}`);
            } else {
                Alert.alert(item.title, item.shortText || '');
            }
        } catch (err) {
            console.error('Failed to handle notification:', err);
        }
    };

    const markAllRead = async () => {
        try {
            const unreadIds = alerts
                .filter(a => !a.read && a.raw?.notificationId)
                .map(a => a.raw!.notificationId!);

            if (unreadIds.length > 0) {
                await NotificationApi.markMultipleAsRead(unreadIds, authState.user?.id);
                setAlerts(prev => prev.map(a => ({ ...a, read: true })));
            }
        } catch (err) {
            console.error('Failed to mark all as read:', err);
            Alert.alert('Error', 'Failed to update notifications');
        }
    };

    const clearAll = () => {
        Alert.alert(
            'Clear All Alerts',
            'Are you sure you want to remove all alerts?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (authState.user?.id) {
                                await NotificationApi.deleteAllForRecipient(
                                    authState.user.id,
                                    'beneficiary'
                                );
                                setAlerts([]);
                            }
                        } catch (err) {
                            console.error('Failed to clear notifications:', err);
                            Alert.alert('Error', 'Failed to clear notifications');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return <LoadingSpinner message="Loading notifications..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Alerts</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Button 
                        compact 
                        mode="text" 
                        onPress={markAllRead}
                        labelStyle={{ color: '#FF8A50', fontWeight: '600' }}
                    >
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
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh}
                        colors={['#FF8A50']}
                    />
                }
            >
                {alerts.map((alert) => (
                    <TouchableOpacity
                        key={alert.id}
                        activeOpacity={0.85}
                        onPress={() => openAlert(alert)}
                        style={styles.touchable}
                    >
                        <Card style={[styles.card, alert.read && styles.readCard]}>
                            <View style={styles.cardContent}>
                                <View style={styles.left}>
                                    <Text style={styles.emoji}>
                                        {getEmojiForType(alert.type)}
                                    </Text>
                                    <View style={styles.info}>
                                        <Text style={[
                                            styles.alertTitle,
                                            alert.read && { color: '#A0AEC0' }
                                        ]}>
                                            {alert.title}
                                        </Text>
                                        {alert.shortText ? (
                                            <Text style={styles.subtitle}>
                                                {alert.shortText}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>
                                <View style={styles.right}>
                                    <Text style={styles.time}>{alert.time}</Text>
                                    <Chip style={styles.chip} textStyle={styles.chipText}>
                                        {formatType(alert.type)}
                                    </Chip>
                                </View>
                            </View>
                        </Card>
                    </TouchableOpacity>
                ))}

                {alerts.length === 0 && (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>
                            No notifications yet
                        </Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// Helper functions
const getEmojiForType = (type: string) => {
    switch (type) {
        case 'donation_available': return '🍽️';
        case 'distribution': return '🍽️';
        case 'reminder': return '⏰';
        case 'system': return '⚙️';
        default: return '🔔';
    }
};

const formatType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
};

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