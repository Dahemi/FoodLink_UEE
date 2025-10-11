import { StyleSheet } from 'react-native';

export const dashboardStyles = StyleSheet.create({
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
    padding: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#718096',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  filterButton: {
    flex: 1,
  },
  sortButton: {
    flex: 1,
  },
  foodPointsContainer: {
    padding: 20,
  },
  foodPointCard: {
    marginBottom: 12,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  foodPointName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 14,
    color: '#718096',
  },
  statusChip: {
    backgroundColor: '#E6FCF5',
  },
  pickupText: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: '#FF8A50',
    fontWeight: '500',
  },
  navTextInactive: {
    color: '#718096',
    fontWeight: 'normal',
  },
});