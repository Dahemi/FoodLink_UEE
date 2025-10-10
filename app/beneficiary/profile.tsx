import React, { useState } from 'react'; // Add useState import
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BeneficiaryProfile() {
  const router = useRouter();
  const { authState, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // Initialize activeTab state

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
          
          <TouchableOpacity style={styles.settingItem}>
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

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {['home', 'map', 'alerts', 'profile'].map((tab) => (
          <TouchableOpacity 
            key={tab}
            style={styles.navItem} 
            onPress={() => handleTabPress(tab)}
          >
            <MaterialCommunityIcons 
              name={
                tab === 'home' ? 'home' :
                tab === 'map' ? 'map-marker' :
                tab === 'alerts' ? 'bell' : 'account'
              } 
              size={24} 
              color={activeTab === tab ? '#FF8A50' : '#718096'} 
            />
            <Text style={[styles.navText, activeTab === tab ? styles.navTextActive : styles.navTextInactive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    marginBottom: 12,
    backgroundColor: '#FF8A50',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#718096',
  },
  metricsContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF8A50',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#718096',
  },
  settingsContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#2D3748',
    marginLeft: 12,
  },
  logoutText: {
    color: '#F56565',
  },
  divider: {
    backgroundColor: '#E2E8F0',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navItem: {
    alignItems: 'center',
    minWidth: 64,
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
  },
  navTextActive: {
    color: '#FF8A50',
    fontWeight: '500',
  },
  navTextInactive: {
    color: '#718096',
  }
});