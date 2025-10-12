import React from 'react';
import { FlatList, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { VolunteerTask, TaskFilter } from '../../types/volunteer';
import TaskCard from './TaskCard';
import ClaimedDonationCard from './ClaimedDonationCard';
import LoadingSpinner from '../LoadingSpinner';

interface TaskListProps {
  tasks: VolunteerTask[];
  claimedDonations?: any[];
  loading?: boolean;
  refreshing?: boolean;
  error?: string | null;
  filter?: TaskFilter;
  showActions?: boolean;
  scrollable?: boolean; // New prop to control scrolling behavior
  onTaskPress: (task: VolunteerTask) => void;
  onDonationPress?: (donation: any) => void;
  onRefresh?: () => void;
  onAcceptTask?: (taskId: string) => void;
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onCancelTask?: (taskId: string) => void;
  onAcceptDonation?: (donationId: string) => void;
  emptyMessage?: string;
  emptyIcon?: string;
}

export default function TaskList({
  tasks,
  claimedDonations = [],
  loading = false,
  refreshing = false,
  error = null,
  filter,
  showActions = true,
  scrollable = true, // Default to scrollable for backward compatibility
  onTaskPress,
  onDonationPress,
  onRefresh,
  onAcceptTask,
  onStartTask,
  onCompleteTask,
  onCancelTask,
  onAcceptDonation,
  emptyMessage = "No tasks available",
  emptyIcon = "📋"
}: TaskListProps) {

  // Apply filters
  const getFilteredTasks = () => {
    if (!filter) return tasks;

    let filteredTasks = [...tasks];

    if (filter.status) {
      filteredTasks = filteredTasks.filter(task => task.status === filter.status);
    }

    if (filter.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filter.priority);
    }

    if (filter.dateRange) {
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.pickupTime);
        return taskDate >= filter.dateRange!.start && taskDate <= filter.dateRange!.end;
      });
    }

    return filteredTasks;
  };

  const filteredTasks = getFilteredTasks();
  
  // Combine tasks and claimed donations
  // If tasks already include mixed data (from dashboard filtering), use them directly
  const allItems = tasks.map(task => {
    // Check if this is a claimed donation (has different structure)
    if (task.status === 'claimed' && task.donorInfo && task.ngoInfo) {
      return { type: 'donation', data: task };
    } else {
      return { type: 'task', data: task };
    }
  });

  // Sort all items by priority and pickup time
  const sortedItems = allItems.sort((a, b) => {
    // First sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = a.data.priority || 'medium';
    const bPriority = b.data.priority || 'medium';
    const priorityDiff = priorityOrder[bPriority] - priorityOrder[aPriority];
    
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then sort by pickup time
    const aTime = a.data.pickupTime || a.data.pickupSchedule?.availableFrom;
    const bTime = b.data.pickupTime || b.data.pickupSchedule?.availableFrom;
    if (aTime && bTime) {
      return new Date(aTime).getTime() - new Date(bTime).getTime();
    }
    return 0;
  });

  const renderItem = ({ item }: { item: { type: string; data: any } }) => {
    if (item.type === 'task') {
      return (
        <TaskCard
          task={item.data}
          onPress={() => onTaskPress(item.data)}
          onAccept={onAcceptTask}
          onStart={onStartTask}
          onComplete={onCompleteTask}
          onCancel={onCancelTask}
          showActions={showActions}
        />
      );
    } else if (item.type === 'donation') {
      return (
        <ClaimedDonationCard
          donation={item.data}
          onPress={() => onDonationPress?.(item.data)}
          onAccept={onAcceptDonation}
          showActions={showActions}
        />
      );
    }
    return null;
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{emptyIcon}</Text>
      <Text style={styles.emptyTitle}>No Tasks Found</Text>
      <Text style={styles.emptyMessage}>{emptyMessage}</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error}</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <LoadingSpinner 
        message="Loading tasks..." 
        size="large" 
        color="#FF8A50" 
      />
    );
  }

  if (error && !refreshing) {
    return renderError();
  }

  if (scrollable) {
    return (
      <View style={styles.container}>
        <FlatList
          data={sortedItems}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.type}-${item.data.id}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContainer,
            sortedItems.length === 0 && styles.emptyListContainer
          ]}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#FF8A50']}
                tintColor="#FF8A50"
              />
            ) : undefined
          }
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    );
  }

  // Non-scrollable version for use inside ScrollView
  return (
    <View style={styles.container}>
      <View style={[
        styles.listContainer,
        sortedItems.length === 0 && styles.emptyListContainer
      ]}>
        {sortedItems.length === 0 ? (
          renderEmpty()
        ) : (
          sortedItems.map((item) => (
            <View key={`${item.type}-${item.data.id}`}>
              {renderItem({ item })}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  listContainer: {
    paddingVertical: 8,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
  },
});
