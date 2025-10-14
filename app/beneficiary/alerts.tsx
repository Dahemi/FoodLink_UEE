import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, RefreshControl, 
    StyleSheet, TouchableOpacity, Dimensions, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Chip, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { NotificationApi } from '../../services/notificationApi';
import { useBeneficiaryAuth } from '../../context/BeneficiaryAuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const { width } = Dimensions.get('window');

interface AlertItem {
    id: string;
    title: string;
    shortText?: string;
    time: string;
    type: string;
    raw?: any;
}

export default function BeneficiaryAlerts() {
    const router = useRouter();
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load notifications from server
    const loadAlerts = async () => {
        try {
            setLoading(true);
            const notifications = await NotificationApi.getAllBeneficiaryNotifications();
            console.log('Received notifications:', notifications); // Debug log

            // Transform notifications to AlertItem format
            const transformed: AlertItem[] = notifications.map(notification => ({
                id: notification._id || String(Math.random()),
                title: notification.title,
                shortText: notification.body,
                time: formatTime(notification.createdAt || new Date()),
                type: 'distribution', // Default type for food distribution notifications
                raw: notification
            }));

            setAlerts(transformed);
        } catch (err) {
            console.error('Failed to load notifications:', err);
            // Set empty array to avoid showing stale data
            setAlerts([]);
            Alert.alert('Error', 'Unable to load notifications. Please try again later.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadAlerts();
    }, []);

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
                            await NotificationApi.deleteAllForRecipient('beneficiary');
                            setAlerts([]);
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
                        <Card style={[styles.card]}>
                            <View style={styles.cardContent}>
                                <View style={styles.left}>
                                    <Text style={styles.emoji}>
                                        {getEmojiForType(alert.type)}
                                    </Text>
                                    <View style={styles.info}>
                                        <Text style={[
                                            styles.alertTitle,
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