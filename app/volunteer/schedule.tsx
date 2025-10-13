import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Button, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useVolunteerTasks } from '../../hooks/useVolunteerTasks';
import TaskCard from '../../components/volunteer/TaskCard';
import { VolunteerTask } from '../../types/volunteer';

export default function ScheduleScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const {
    tasks,
    loading,
    refreshTasks,
    acceptTask,
    startTask,
    completeTask,
    cancelTask,
  } = useVolunteerTasks();

  // Group tasks by date (excluding completed tasks)
  const tasksByDate = useMemo(() => {
    const grouped: { [date: string]: VolunteerTask[] } = {};
    
    // Filter out completed tasks
    const activeTasks = tasks.filter(task => task.status !== 'completed');
    
    activeTasks.forEach(task => {
      const taskDate = new Date(task.pickupTime).toISOString().split('T')[0];
      if (!grouped[taskDate]) {
        grouped[taskDate] = [];
      }
      grouped[taskDate].push(task);
    });

    // Sort tasks within each date by pickup time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => 
        new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime()
      );
    });

    return grouped;
  }, [tasks]);


  const selectedDateTasks = tasksByDate[selectedDate] || [];

  const handleTaskPress = (task: VolunteerTask) => {
    router.push(`/volunteer/task-detail?taskId=${task.id}`);
  };

  const handleAcceptTask = async (taskId: string) => {
    try {
      await acceptTask(taskId);
    } catch (error) {
      console.error('Error accepting task:', error);
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      await startTask(taskId);
    } catch (error) {
      console.error('Error starting task:', error);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      await cancelTask(taskId, 'Cancelled from schedule view');
    } catch (error) {
      console.error('Error cancelling task:', error);
    }
  };

  const formatSelectedDate = () => {
    const date = new Date(selectedDate + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDateSummary = () => {
    if (selectedDateTasks.length === 0) return 'No active tasks scheduled';
    
    const statusCounts = selectedDateTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const parts = [];
    if (statusCounts.assigned) parts.push(`${statusCounts.assigned} new`);
    if (statusCounts.accepted) parts.push(`${statusCounts.accepted} accepted`);
    if (statusCounts.in_progress) parts.push(`${statusCounts.in_progress} in progress`);

    return parts.join(', ');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Schedule</Text>
          <Text style={styles.subtitle}>
            Manage your volunteer tasks and schedule
          </Text>
        </View>

        {/* Date Selector */}
        <Card style={styles.calendarCard}>
          <View style={styles.cardContent}>
            <Text style={styles.calendarTitle}>Select Date</Text>
            <View style={styles.dateSelector}>
              <Button
                mode={selectedDate === new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] ? 'contained' : 'outlined'}
                onPress={() => {
                  const today = new Date();
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(yesterday.toISOString().split('T')[0]);
                }}
                style={[styles.dateButton, selectedDate === new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] && styles.selectedDateButton]}
              >
                Yesterday
              </Button>
              <Button
                mode={selectedDate === new Date().toISOString().split('T')[0] ? 'contained' : 'outlined'}
                onPress={() => {
                  const today = new Date();
                  setSelectedDate(today.toISOString().split('T')[0]);
                }}
                style={[styles.dateButton, selectedDate === new Date().toISOString().split('T')[0] && styles.todayButton]}
              >
                Today
              </Button>
              <Button
                mode={selectedDate === new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] ? 'contained' : 'outlined'}
                onPress={() => {
                  const today = new Date();
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setSelectedDate(tomorrow.toISOString().split('T')[0]);
                }}
                style={[styles.dateButton, selectedDate === new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] && styles.selectedDateButton]}
              >
                Tomorrow
              </Button>
            </View>
          </View>
        </Card>

        {/* Selected Date Info */}
        <Card style={styles.dateInfoCard}>
          <View style={styles.cardContent}>
            <View style={styles.dateHeader}>
              <View>
                <Text style={styles.selectedDateText}>{formatSelectedDate()}</Text>
                <Text style={styles.dateSummary}>{getDateSummary()}</Text>
              </View>
              <View style={styles.taskCount}>
                <Text style={styles.taskCountNumber}>{selectedDateTasks.length}</Text>
                <Text style={styles.taskCountLabel}>tasks</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Legend */}
        <Card style={styles.legendCard}>
          <View style={styles.cardContent}>
            <Text style={styles.legendTitle}>Legend</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
                <Text style={styles.legendText}>High Priority</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.legendText}>Medium Priority</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.legendText}>Low Priority</Text>
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Tasks for Selected Date */}
      <View style={styles.tasksContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {selectedDateTasks.length > 0 ? (
            selectedDateTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => handleTaskPress(task)}
                onAccept={handleAcceptTask}
                onStart={handleStartTask}
                onComplete={handleCompleteTask}
                onCancel={handleCancelTask}
                showActions={true}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No Active Tasks This Day</Text>
              <Text style={styles.emptyMessage}>
                You don't have any active tasks scheduled for this date. Completed tasks are not shown in the schedule.
              </Text>
            </View>
          )}
        </ScrollView>
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
    maxHeight: '60%',
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
  calendarCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    padding: 16,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  dateButton: {
    flex: 1,
  },
  todayButton: {
    backgroundColor: '#FF8A50',
  },
  selectedDateButton: {
    backgroundColor: '#FF8A50',
  },
  dateInfoCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  dateSummary: {
    fontSize: 14,
    color: '#718096',
  },
  taskCount: {
    alignItems: 'center',
  },
  taskCountNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FF8A50',
  },
  taskCountLabel: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  legendCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '500',
  },
  tasksContainer: {
    flex: 1,
    paddingTop: 16,
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
});
