import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Button, Chip, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useVolunteerTasks } from '../../hooks/useVolunteerTasks';
import TaskList from '../../components/volunteer/TaskList';
import StatsCard from '../../components/volunteer/StatsCard';
import { VolunteerTask } from '../../types/volunteer';

export default function CompletedTasks() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    completedTasks,
    stats,
    loading,
    refreshTasks,
  } = useVolunteerTasks();

  const handleTaskPress = (task: VolunteerTask) => {
    router.push(`/volunteer/task-detail?taskId=${task.id}`);
  };

  // Filter completed tasks based on search query
  const filteredTasks = completedTasks.filter(task => 
    task.donorInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.ngoInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.foodDetails.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          value={stats?.completedTasks || 0}
          icon="✅"
          color="#4CAF50"
        />
        <StatsCard
          title="Meals Delivered"
          value={stats?.mealsDelivered || 0}
          icon="🍽️"
          color="#2196F3"
        />
      </View>
      
      <View style={styles.statsRow}>
        <StatsCard
          title="Hours Volunteered"
          value={stats?.totalHours || 0}
          subtitle="estimated"
          icon="⏰"
          color="#FF5722"
        />
        <StatsCard
          title="Impact Score"
          value={stats?.impactScore || 0}
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
          {stats && stats.completedTasks >= 1 && (
            <Chip icon="check-circle" mode="flat" style={styles.achievementChip}>
              First Task Complete
            </Chip>
          )}
          {stats && stats.completedTasks >= 5 && (
            <Chip icon="star" mode="flat" style={styles.achievementChip}>
              5 Tasks Champion
            </Chip>
          )}
          {stats && stats.completedTasks >= 10 && (
            <Chip icon="trophy" mode="flat" style={styles.achievementChip}>
              Dedicated Volunteer
            </Chip>
          )}
          {stats && stats.mealsDelivered >= 50 && (
            <Chip icon="heart" mode="flat" style={styles.achievementChip}>
              Community Hero
            </Chip>
          )}
          {(!stats || stats.completedTasks === 0) && (
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderStats()}
        {renderAchievements()}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search completed tasks..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor="#FF8A50"
          />
        </View>
      </ScrollView>

      {/* Task List */}
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
  scrollView: {
    flex: 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    lineHeight: 22,
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
  achievementChip: {
    backgroundColor: '#E6FFFA',
    borderColor: '#4CAF50',
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
  searchBar: {
    backgroundColor: '#F7FAFC',
    elevation: 0,
  },
  taskListContainer: {
    flex: 1,
  },
});
