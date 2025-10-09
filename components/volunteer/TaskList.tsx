import React from 'react';
import { FlatList, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { VolunteerTask, TaskFilter } from '../../types/volunteer';
import TaskCard from './TaskCard';
import LoadingSpinner from '../LoadingSpinner';

interface TaskListProps {
  tasks: VolunteerTask[];
  loading?: boolean;
  refreshing?: boolean;
  error?: string | null;
  filter?: TaskFilter;
  showActions?: boolean;
  onTaskPress: (task: VolunteerTask) => void;
  onRefresh?: () => void;
  onAcceptTask?: (taskId: string) => void;
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onCancelTask?: (taskId: string) => void;
  emptyMessage?: string;
  emptyIcon?: string;
}

export default function TaskList({
  tasks,
  loading = false,
  refreshing = false,
  error = null,
  filter,
  showActions = true,
  onTaskPress,
  onRefresh,
  onAcceptTask,
  onStartTask,
  onCompleteTask,
  onCancelTask,
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

  // Sort tasks by priority and pickup time
  const sortedTasks = filteredTasks.sort((a, b) => {
    // First sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then sort by pickup time
    return new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime();
  });

  const renderTask = ({ item }: { item: VolunteerTask }) => (
    <TaskCard
      task={item}
      onPress={() => onTaskPress(item)}
      onAccept={onAcceptTask}
      onStart={onStartTask}
      onComplete={onCompleteTask}
      onCancel={onCancelTask}
      showActions={showActions}
    />
  );

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

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          sortedTasks.length === 0 && styles.emptyListContainer
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
