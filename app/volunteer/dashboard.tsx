import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Alert,
  Dimensions 
} from 'react-native';
import { Card, Button, Chip, FAB, Portal, Modal, Menu, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useVolunteerTasks } from '../../hooks/useVolunteerTasks';
import { useVolunteerNotifications } from '../../hooks/useVolunteerNotifications';
import { useAuth } from '../../context/AuthContext';
import TaskList from '../../components/volunteer/TaskList';
import StatsCard from '../../components/volunteer/StatsCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { VolunteerTask } from '../../types/volunteer';

const { width } = Dimensions.get('window');

export default function VolunteerDashboard() {
  const router = useRouter();
  const { authState, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'urgent' | 'today'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const {
    tasks,
    stats,
    loading,
    error,
    refreshing,
    refreshTasks,
    acceptTask,
    startTask,
    completeTask,
    cancelTask,
    urgentTasks,
    todaysTasks,
    activeTasks,
    acceptedTasks,
    inProgressTasks,
  } = useVolunteerTasks();

  const { isInitialized: notificationsInitialized } = useVolunteerNotifications();

  // Initialize notifications on mount
  useEffect(() => {
    if (!notificationsInitialized) {
      console.log('Initializing notifications...');
    }
  }, [notificationsInitialized]);

  const handleTaskPress = (task: VolunteerTask) => {
    router.push(`/volunteer/task-detail?taskId=${task.id}`);
  };

  const handleAcceptTask = async (taskId: string) => {
    try {
      await acceptTask(taskId);
      Alert.alert('Success', 'Task accepted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept task. Please try again.');
    }
  };

  const handleStartTask = async (taskId: string) => {
    Alert.alert(
      'Start Task',
      'Are you ready to start the pickup?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: async () => {
            try {
              await startTask(taskId);
              Alert.alert('Success', 'Task started! Safe travels!');
            } catch (error) {
              Alert.alert('Error', 'Failed to start task. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleCompleteTask = async (taskId: string) => {
    Alert.alert(
      'Complete Task',
      'Have you successfully delivered the food?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete', 
          onPress: async () => {
            try {
              await completeTask(taskId);
              Alert.alert('Congratulations!', 'Task completed successfully! Thank you for making a difference.');
            } catch (error) {
              Alert.alert('Error', 'Failed to complete task. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleCancelTask = async (taskId: string) => {
    Alert.alert(
      'Cancel Task',
      'Are you sure you want to decline this task?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelTask(taskId, 'Cancelled by volunteer');
              Alert.alert('Task Cancelled', 'The task has been cancelled.');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel task. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/role-selection');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        },
      ]
    );
  };

  const getDisplayTasks = () => {
    switch (activeTab) {
      case 'urgent':
        return urgentTasks;
      case 'today':
        return todaysTasks;
      default:
        return tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Good {getGreeting()},</Text>
        <Text style={styles.volunteerName}>
          {authState.user?.name || 'Volunteer'}! 👋
        </Text>
      </View>
      
      <View style={styles.headerRight}>
        {urgentTasks.length > 0 && (
          <Chip 
            mode="flat"
            style={styles.urgentBadge}
            textStyle={styles.urgentBadgeText}
            icon="alert-circle"
          >
            {urgentTasks.length} Urgent
          </Chip>
        )}
        
        <Menu
          visible={showMenu}
          onDismiss={() => setShowMenu(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={() => setShowMenu(true)}
              iconColor="#718096"
            />
          }
        >
          <Menu.Item onPress={() => {
            setShowMenu(false);
            // Navigate to profile
          }} title="Profile" />
          <Menu.Item onPress={() => {
            setShowMenu(false);
            // Navigate to settings
          }} title="Settings" />
          <Menu.Item onPress={() => {
            setShowMenu(false);
            handleLogout();
          }} title="Logout" />
        </Menu>
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <StatsCard
          title="Completed"
          value={stats?.completedTasks || 0}
          icon="✅"
          color="#4CAF50"
          onPress={() => router.push('/volunteer/completed-tasks')}
        />
        <StatsCard
          title="Active"
          value={activeTasks.length + acceptedTasks.length + inProgressTasks.length}
          icon="🚚"
          color="#FF9800"
        />
        <StatsCard
          title="Impact Score"
          value={stats?.impactScore || 0}
          icon="🌟"
          color="#9C27B0"
        />
      </View>
      
      <View style={styles.statsRow}>
        <StatsCard
          title="Meals Delivered"
          value={stats?.mealsDelivered || 0}
          subtitle="people helped"
          icon="🍽️"
          color="#2196F3"
        />
        <StatsCard
          title="Hours Volunteered"
          value={stats?.totalHours || 0}
          subtitle="this month"
          icon="⏰"
          color="#FF5722"
        />
      </View>
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <Button
        mode={activeTab === 'all' ? 'contained' : 'outlined'}
        onPress={() => setActiveTab('all')}
        style={[styles.tabButton, activeTab === 'all' && styles.activeTab]}
        labelStyle={styles.tabLabel}
      >
        All Tasks
      </Button>
      <Button
        mode={activeTab === 'urgent' ? 'contained' : 'outlined'}
        onPress={() => setActiveTab('urgent')}
        style={[styles.tabButton, activeTab === 'urgent' && styles.activeTab]}
        labelStyle={styles.tabLabel}
      >
        Urgent ({urgentTasks.length})
      </Button>
      <Button
        mode={activeTab === 'today' ? 'contained' : 'outlined'}
        onPress={() => setActiveTab('today')}
        style={[styles.tabButton, activeTab === 'today' && styles.activeTab]}
        labelStyle={styles.tabLabel}
      >
        Today ({todaysTasks.length})
      </Button>
    </View>
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'urgent':
        return 'No urgent tasks at the moment. Great job staying on top of things!';
      case 'today':
        return 'No tasks scheduled for today. Check back later or view all tasks.';
      default:
        return 'No active tasks available. New tasks will appear here when assigned.';
    }
  };

  const getEmptyIcon = () => {
    switch (activeTab) {
      case 'urgent':
        return '🎯';
      case 'today':
        return '📅';
      default:
        return '📋';
    }
  };

  if (loading && !refreshing) {
    return (
      <LoadingSpinner 
        message="Loading your dashboard..." 
        size="large" 
        color="#FF8A50" 
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshTasks}
            colors={['#FF8A50']}
            tintColor="#FF8A50"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderStats()}
        {renderTabBar()}
      </ScrollView>

      {/* Task List */}
      <View style={styles.taskListContainer}>
        <TaskList
          tasks={getDisplayTasks()}
          loading={false}
          refreshing={refreshing}
          error={error}
          onTaskPress={handleTaskPress}
          onRefresh={refreshTasks}
          onAcceptTask={handleAcceptTask}
          onStartTask={handleStartTask}
          onCompleteTask={handleCompleteTask}
          onCancelTask={handleCancelTask}
          emptyMessage={getEmptyMessage()}
          emptyIcon={getEmptyIcon()}
        />
      </View>

      {/* Floating Action Button */}
      <FAB
        icon="refresh"
        style={styles.fab}
        onPress={refreshTasks}
        color="#FFFFFF"
      />

      {/* Quick Action FAB Group could be added here */}
      <Portal>
        <Modal
          visible={showFilters}
          onDismiss={() => setShowFilters(false)}
          contentContainerStyle={styles.filterModal}
        >
          <Text style={styles.filterTitle}>Filter Tasks</Text>
          <Text style={styles.filterSubtitle}>Coming soon...</Text>
          <Button onPress={() => setShowFilters(false)}>Close</Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  greeting: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greetingText: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
  },
  volunteerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
  },
  urgentBadge: {
    backgroundColor: '#FFF5F5',
    borderColor: '#F44336',
  },
  urgentBadgeText: {
    color: '#F44336',
    fontWeight: '600',
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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabButton: {
    flex: 1,
  },
  activeTab: {
    backgroundColor: '#FF8A50',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskListContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF8A50',
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 16,
  },
});
