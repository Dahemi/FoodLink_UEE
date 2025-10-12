import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Button, Chip, Searchbar, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useVolunteerTasks } from '../../hooks/useVolunteerTasks';
import TaskList from '../../components/volunteer/TaskList';
import StatsCard from '../../components/volunteer/StatsCard';
import { VolunteerTask } from '../../types/volunteer';

const { width } = Dimensions.get('window');

export default function CompletedTasks() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    completedTasks,
    stats,
    loading,
    refreshTasks,
  } = useVolunteerTasks();

  // Calculate meals delivered from completed tasks
  const calculatedStats = useMemo(() => {
    const mealsDelivered = completedTasks.reduce((sum, task) => {
      try {
        const foodDetails = typeof task.foodDetails === 'string' 
          ? JSON.parse(task.foodDetails) 
          : task.foodDetails;
        
        const quantity = foodDetails?.quantity || '';
        const match = String(quantity).match(/\d+/);
        return sum + (match ? parseInt(match[0]) : 0);
      } catch (error) {
        console.log('Error parsing foodDetails:', error);
        return sum;
      }
    }, 0);

    return {
      ...stats,
      mealsDelivered,
      completedTasks: completedTasks.length,
      totalHours: completedTasks.length * 2,
      impactScore: completedTasks.length * 10,
    };
  }, [completedTasks, stats]);

  const handleTaskPress = (task: VolunteerTask) => {
    router.push(`/volunteer/task-detail?taskId=${task.id}`);
  };

  // Filter completed tasks based on search query
  const filteredTasks = completedTasks.filter(task => {
    const donorName = task.donorInfo?.name || '';
    const ngoName = task.ngoInfo?.name || '';
    const foodType = typeof task.foodDetails === 'string' 
      ? JSON.parse(task.foodDetails).type || ''
      : task.foodDetails?.type || '';
    
    return donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           ngoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           foodType.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Completed Tasks</Text>
      <Text style={styles.subtitle}>
        Great work! Here's a summary of your contributions.
      </Text>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <StatsCard
          title="Total Completed"
          value={calculatedStats.completedTasks}
          icon="✅"
          color="#4CAF50"
        />
        <StatsCard
          title="Meals Delivered"
          value={calculatedStats.mealsDelivered}
          icon="🍽️"
          color="#2196F3"
        />
      </View>
      
      <View style={styles.statsRow}>
        <StatsCard
          title="Hours Volunteered"
          value={calculatedStats.totalHours}
          subtitle="estimated"
          icon="⏰"
          color="#FF5722"
        />
        <StatsCard
          title="Impact Score"
          value={calculatedStats.impactScore}
          subtitle="community points"
          icon="🌟"
          color="#9C27B0"
        />
      </View>
    </View>
  );

  const renderAchievements = () => (
    <Card style={styles.achievementsCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>🏆 Achievements</Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.achievementsList}>
          {calculatedStats.completedTasks >= 1 && (
            <Chip icon="check-circle" mode="flat" style={styles.achievementChip}>
              First Task Complete
            </Chip>
          )}
          {calculatedStats.completedTasks >= 5 && (
            <Chip icon="star" mode="flat" style={styles.achievementChip}>
              5 Tasks Champion
            </Chip>
          )}
          {calculatedStats.completedTasks >= 10 && (
            <Chip icon="trophy" mode="flat" style={styles.achievementChip}>
              Dedicated Volunteer
            </Chip>
          )}
          {calculatedStats.mealsDelivered >= 50 && (
            <Chip icon="heart" mode="flat" style={styles.achievementChip}>
              Community Hero
            </Chip>
          )}
          {calculatedStats.completedTasks === 0 && (
            <Text style={styles.noAchievements}>
              Complete your first task to unlock achievements! 🌟
            </Text>
          )}
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      {renderHeader()}
      
      {/* Stats Section - Compact */}
      <Surface style={styles.statsSurface} elevation={1}>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{calculatedStats.completedTasks}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{calculatedStats.mealsDelivered}</Text>
            <Text style={styles.statLabel}>Meals</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{calculatedStats.totalHours}h</Text>
            <Text style={styles.statLabel}>Volunteered</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{calculatedStats.impactScore}</Text>
            <Text style={styles.statLabel}>Impact</Text>
          </View>
        </View>
      </Surface>

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search completed tasks..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#FF8A50"
        />
        {searchQuery && (
          <Text style={styles.searchResults}>
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
          </Text>
        )}
      </View>

      {/* Achievements - Compact */}
      {calculatedStats.completedTasks > 0 && (
        <View style={styles.achievementsSection}>
          <Text style={styles.achievementsTitle}>🏆 Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll}>
            {calculatedStats.completedTasks >= 1 && (
              <Chip icon="check-circle" mode="flat" style={styles.achievementChip}>
                First Task
              </Chip>
            )}
            {calculatedStats.completedTasks >= 5 && (
              <Chip icon="star" mode="flat" style={styles.achievementChip}>
                5 Tasks
              </Chip>
            )}
            {calculatedStats.completedTasks >= 10 && (
              <Chip icon="trophy" mode="flat" style={styles.achievementChip}>
                Dedicated
              </Chip>
            )}
            {calculatedStats.mealsDelivered >= 50 && (
              <Chip icon="heart" mode="flat" style={styles.achievementChip}>
                Hero
              </Chip>
            )}
          </ScrollView>
        </View>
      )}

      {/* Task List - Takes remaining space */}
      <View style={styles.taskListContainer}>
        <TaskList
          tasks={filteredTasks}
          loading={loading}
          onTaskPress={handleTaskPress}
          onRefresh={refreshTasks}
          showActions={false}
          emptyMessage={
            searchQuery 
              ? "No completed tasks match your search."
              : "No completed tasks yet. Complete your first task to see it here!"
          }
          emptyIcon="🎯"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  statsSurface: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    paddingVertical: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBar: {
    backgroundColor: '#F7FAFC',
    elevation: 0,
    borderRadius: 8,
  },
  searchResults: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  achievementsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  achievementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  achievementsScroll: {
    flexDirection: 'row',
  },
  achievementChip: {
    backgroundColor: '#E6FFFA',
    borderColor: '#4CAF50',
    marginRight: 8,
  },
  taskListContainer: {
    flex: 1,
  },
  // Legacy styles for old components (keeping for compatibility)
  scrollView: {
    flex: 0,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  achievementsCard: {
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  cardHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noAchievements: {
    fontSize: 14,
    color: '#718096',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
});
