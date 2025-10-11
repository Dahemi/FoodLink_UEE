import { StyleSheet } from 'react-native';

export const profileStyles = StyleSheet.create({
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