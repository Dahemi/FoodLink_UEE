import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Chip, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { dashboardStyles } from '../styles/beneficiary/loginStyles';

const { width } = Dimensions.get('window');

export default function BeneficiaryDashboard() {
  const router = useRouter();
  const { authState } = useAuth();

  const foodPoints = [
    {
      id: 1,
      name: 'Community Kitchen',
      distance: '0.5 mi away',
      status: 'Open Now',
      nextPickup: null,
    },
    {
      id: 2,
      name: 'Riverdale',
      distance: '1.2 mi away',
      status: null,
      nextPickup: '3:00 PM',
    },
    // Add more food points as needed
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{authState.user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/beneficiary/profile')}>
            <IconButton icon="account-circle" size={32} />
          </TouchableOpacity>
        </View>

        {/* Filter and Sort Section */}
        <View style={styles.filterSection}>
          <Button 
            mode="outlined" 
            icon="filter-variant" 
            onPress={() => {/* Handle filter */}}
            style={styles.filterButton}
          >
            Filter
          </Button>
          <Button 
            mode="outlined" 
            icon="sort" 
            onPress={() => {/* Handle sort */}}
            style={styles.sortButton}
          >
            Sort by Distance
          </Button>
        </View>

        {/* Food Points List */}
        <View style={styles.foodPointsContainer}>
          {foodPoints.map((point) => (
            <Card key={point.id} style={styles.foodPointCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.foodPointName}>{point.name}</Text>
                    <Text style={styles.distanceText}>{point.distance}</Text>
                  </View>
                  <View>
                    {point.status && (
                      <Chip mode="outlined" style={styles.statusChip}>
                        {point.status}
                      </Chip>
                    )}
                    {point.nextPickup && (
                      <Text style={styles.pickupText}>
                        Next Pickup: {point.nextPickup}
                      </Text>
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="home" size={24} color="#FF8A50" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="compass" size={24} color="#718096" />
          <Text style={[styles.navText, styles.navTextInactive]}>Explore</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="clock" size={24} color="#718096" />
          <Text style={[styles.navText, styles.navTextInactive]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="account" size={24} color="#718096" />
          <Text style={[styles.navText, styles.navTextInactive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = dashboardStyles;