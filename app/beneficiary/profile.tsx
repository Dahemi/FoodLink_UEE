import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import { Avatar, Divider, Card, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import LoadingSpinner from '../../components/LoadingSpinner';
import { NotificationService } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { profileStyles } from '../../styles/beneficiary/profileStyles';

export default function BeneficiaryProfile() {
  const router = useRouter();
  const params = useLocalSearchParams<{ open?: string; id?: string; name?: string; address?: string }>();
  const { authState, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [reminders, setReminders] = useState<Record<string, any>>({});

  // Guard so we auto-open reminders only once per navigation
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    if (params?.open === 'reminders' && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      openReminders();
    }
  }, [params?.open]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/role-selection');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleTabPress = (tabName: string) => {
    switch(tabName) {
      case 'home':
        setActiveTab('home');
        router.push('/beneficiary/dashboard');
        break;
      case 'map':
        setActiveTab('map');
        router.push('/beneficiary/map');
        break;
      case 'alerts':
        setActiveTab('alerts');
        router.push('/beneficiary/alerts');
        break;
      case 'profile':
        setActiveTab('profile');
        break;
    }
  };

  // Ensure openReminders / loadReminders are defined above or in scope
  const openReminders = async () => {
    setShowRemindersModal(true);
    await loadReminders();
  };

  const loadReminders = async () => {
    setLoadingReminders(true);
    try {
      const data = await NotificationService.getSavedReminders();
      const map = data || {};
      if (params?.id && !map[params.id]) {
        map[params.id] = {
          id: params.id,
          name: params.name ?? 'Food Point',
          address: params.address ?? '',
          enabled: false,
          minutesFromNow: 30,
        };
      }
      setReminders(map);
    } catch (err) {
      console.error('Failed to load reminders', err);
      setReminders({});
    } finally {
      setLoadingReminders(false);
    }
  };

  const toggleReminder = async (id: string, enable: boolean) => {
    try {
      const meta = reminders[id] || { id, name: 'Food Point', address: '' };
      const fp = { id: meta.id, name: meta.name, address: meta.address, nextPickup: meta.nextPickup ?? null };
      if (enable) {
        await NotificationService.toggleFoodPointReminder(fp, true, meta.minutesFromNow ?? 30);
        setReminders(prev => ({ ...prev, [id]: { ...(prev[id] || {}), enabled: true } }));
      } else {
        await NotificationService.toggleFoodPointReminder(fp, false);
        setReminders(prev => ({ ...prev, [id]: { ...(prev[id] || {}), enabled: false } }));
      }
    } catch (err) {
      console.error('Toggle reminder failed', err);
      Alert.alert('Error', 'Failed to toggle reminder');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Avatar.Text 
            size={80} 
            label={authState.user?.name?.substring(0, 2).toUpperCase() || 'B'} 
            style={styles.avatar}
          />
          <Text style={styles.name}>{authState.user?.name}</Text>
          <Text style={styles.email}>{authState.user?.email}</Text>
        </View>

        {/* Impact Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>Impact Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>15</Text>
              <Text style={styles.metricLabel}>Donations Made</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>200</Text>
              <Text style={styles.metricLabel}>Meals Served</Text>
            </View>
          </View>
        </View>

        {/* Settings List */}
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => openReminders()}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#4A5568" />
              <Text style={styles.settingText}>My Reminders</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#A0AEC0" />
          </TouchableOpacity>
          
          <Divider style={styles.divider} />
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons name="history" size={24} color="#4A5568" />
              <Text style={styles.settingText}>Pickup History</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#A0AEC0" />
          </TouchableOpacity>
          
          <Divider style={styles.divider} />
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons name="account-edit-outline" size={24} color="#4A5568" />
              <Text style={styles.settingText}>Edit Profile</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#A0AEC0" />
          </TouchableOpacity>
          
          <Divider style={styles.divider} />
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons name="bell-ring-outline" size={24} color="#4A5568" />
              <Text style={styles.settingText}>Notification Settings</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#A0AEC0" />
          </TouchableOpacity>
          
          <Divider style={styles.divider} />
          
          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons name="logout" size={24} color="#F56565" />
              <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#A0AEC0" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Reminders modal */}
      <Modal visible={showRemindersModal} animationType="slide" onRequestClose={() => setShowRemindersModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={modalStyles.header}>
            <IconButton icon="arrow-left" size={24} onPress={() => setShowRemindersModal(false)} />
            <Text style={modalStyles.title}>My Reminders</Text>
            <View style={{ width: 40 }} />
          </View>

          {loadingReminders ? (
            <LoadingSpinner message="Loading reminders..." />
          ) : (
            <FlatList
              data={Object.values(reminders)}
              keyExtractor={(item: any) => item.id}
              contentContainerStyle={{ padding: 12 }}
              renderItem={({ item }: { item: any }) => (
                <Card style={modalStyles.card}>
                  <View style={modalStyles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={modalStyles.name}>{item.name}</Text>
                      <Text style={modalStyles.sub}>{item.nextPickup ? `Next pickup: ${item.nextPickup}` : (item.address || '')}</Text>
                    </View>
                    <Switch
                      value={!!item.enabled}
                      onValueChange={(val) => toggleReminder(item.id, val)}
                      trackColor={{ true: '#FF8A50', false: '#E2E8F0' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </Card>
              )}
              ListEmptyComponent={() => (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ color: '#718096' }}>No reminders configured yet. Set a reminder from the Map.</Text>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const modalStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEF2F7' },
  title: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center', color: '#2D3748' },
  card: { marginVertical: 8, padding: 12, borderRadius: 8, backgroundColor: '#FFF8F0' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '600', color: '#2D3748' },
  sub: { fontSize: 12, color: '#718096', marginTop: 4 },
});

const styles = profileStyles;