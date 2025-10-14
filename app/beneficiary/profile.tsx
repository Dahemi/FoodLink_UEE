import React, { useState, useEffect, useRef } from 'react';
import {
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
import { TextInput, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FoodPointReminderService } from '../../services/foodPointReminderService';
import { useBeneficiaryAuth } from '../../context/BeneficiaryAuthContext';
import { profileStyles } from '../../styles/beneficiary/profileStyles';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BeneficiaryProfile() {
  const router = useRouter();
  const params = useLocalSearchParams<{ open?: string; id?: string; name?: string; address?: string }>();
  const { authState, logout, updateProfile } = useBeneficiaryAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [reminders, setReminders] = useState<Record<string, any>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
  });

  // Sync edit form when authState.user changes
  useEffect(() => {
    const u: any = authState.user;
    if (u) {
      setEditForm({
        name: u.name || '',
        phone: u.phone || '',
        address: {
          street: u.address?.street || '',
          city: u.address?.city || '',
          state: u.address?.state || '',
          zipCode: u.address?.zipCode || '',
          country: u.address?.country || '',
        },
      });
    }
  }, [authState.user]);
 
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
      const data = await FoodPointReminderService.getSavedReminders();
      // If navigated from map with id/name/address and no persisted meta, add lightweight entry
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
        await FoodPointReminderService.toggleReminder(fp, true, meta.minutesFromNow ?? 30);
        setReminders(prev => ({ ...prev, [id]: { ...(prev[id] || {}), enabled: true } }));
      } else {
        await FoodPointReminderService.toggleReminder(fp, false);
        setReminders(prev => ({ ...prev, [id]: { ...(prev[id] || {}), enabled: false } }));
      }
    } catch (err) {
      console.error('Toggle reminder failed', err);
      Alert.alert('Error', 'Failed to toggle reminder');
    }
  };

  const openEdit = () => {
    // Ensure form is up to date before opening
    const u: any = authState.user;
    if (u) {
      setEditForm({
        name: u.name || '',
        phone: u.phone || '',
        address: {
          street: u.address?.street || '',
          city: u.address?.city || '',
          state: u.address?.state || '',
          zipCode: u.address?.zipCode || '',
          country: u.address?.country || '',
        },
      });
   }
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      Alert.alert('Error', 'Please fill in required fields (name and phone).');
      return;
    }

    const payload = {
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      address: {
        street: editForm.address.street.trim(),
        city: editForm.address.city.trim(),
        state: editForm.address.state.trim(),
        zipCode: editForm.address.zipCode.trim(),
        country: editForm.address.country.trim(),
        coordinates: authState.user?.address?.coordinates || {
          latitude: 6.9271,
          longitude: 79.8612
        }
      }
    };

    try {
      setEditLoading(true);
      await updateProfile(payload);
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      Alert.alert('Error', err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };
 
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top header with logged-in user's name */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEF2F7' }}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#2D3748' }}>Profile</Text>
          <Text style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
            {authState.user?.name ?? ''}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
       
       <ScrollView style={styles.content} contentContainerStyle={{ paddingTop: 8 }}>
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
           
           {/*<TouchableOpacity style={styles.settingItem}>
             <View style={styles.settingLeft}>
               <MaterialCommunityIcons name="history" size={24} color="#4A5568" />
               <Text style={styles.settingText}>Pickup History</Text>
             </View>
             <MaterialCommunityIcons name="chevron-right" size={24} color="#A0AEC0" />
           </TouchableOpacity>*/}
           
           <Divider style={styles.divider} />
           
           <TouchableOpacity style={styles.settingItem} onPress={() => openEdit()}>
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

      {/* Edit Profile modal */}
      <Modal visible={showEditModal} animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={modalStyles.header}>
            <IconButton icon="arrow-left" size={24} onPress={() => setShowEditModal(false)} />
            <Text style={modalStyles.title}>Edit Profile</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <TextInput
              label="Full Name"
              value={editForm.name}
              onChangeText={(t) => setEditForm(prev => ({ ...prev, name: t }))}
              mode="outlined"
              style={{ marginBottom: 12 }}
            />
            <TextInput
              label="Phone"
              value={editForm.phone}
              onChangeText={(t) => setEditForm(prev => ({ ...prev, phone: t }))}
              mode="outlined"
              keyboardType="phone-pad"
              style={{ marginBottom: 12 }}
            />
            <Text style={{ marginTop: 8, marginBottom: 6, color: '#4A5568', fontWeight: '600' }}>Address</Text>
            <TextInput
              label="Street"
              value={editForm.address.street}
              onChangeText={(t) => setEditForm(prev => ({ ...prev, address: { ...prev.address, street: t } }))}
              mode="outlined"
              style={{ marginBottom: 12 }}
            />
            <TextInput
              label="City"
              value={editForm.address.city}
              onChangeText={(t) => setEditForm(prev => ({ ...prev, address: { ...prev.address, city: t } }))}
              mode="outlined"
              style={{ marginBottom: 12 }}
            />
            <TextInput
              label="State"
              value={editForm.address.state}
              onChangeText={(t) => setEditForm(prev => ({ ...prev, address: { ...prev.address, state: t } }))}
              mode="outlined"
              style={{ marginBottom: 12 }}
            />
            <TextInput
              label="ZIP Code"
              value={editForm.address.zipCode}
              onChangeText={(t) => setEditForm(prev => ({ ...prev, address: { ...prev.address, zipCode: t } }))}
              mode="outlined"
              keyboardType="numeric"
              style={{ marginBottom: 12 }}
            />
            <TextInput
              label="Country"
              value={editForm.address.country}
              onChangeText={(t) => setEditForm(prev => ({ ...prev, address: { ...prev.address, country: t } }))}
              mode="outlined"
              style={{ marginBottom: 20 }}
            />
            <Button mode="contained" onPress={handleSaveEdit} loading={editLoading} disabled={editLoading} style={{ marginBottom: 12 }}>
              Save Changes
            </Button>
            <Button mode="text" onPress={() => setShowEditModal(false)}>Cancel</Button>
          </ScrollView>
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