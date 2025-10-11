import React, { useState } from 'react'; // Add useState import
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { profileStyles } from '../../styles/beneficiary/profileStyles';

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

const styles = profileStyles;