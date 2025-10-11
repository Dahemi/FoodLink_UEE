import { StyleSheet } from 'react-native';

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle1: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFB380',
    top: 10,
    left: 15,
    transform: [{ rotate: '-15deg' }],
  },
  logoCircle2: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#FF8A50',
    top: 15,
    right: 10,
    transform: [{ rotate: '20deg' }],
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginTop: 50,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  formContent: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  dietaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietaryChip: {
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: '#FF8A50',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: '#718096',
  },
  toggleLink: {
    fontSize: 14,
    color: '#FF8A50',
    fontWeight: '600',
  },
});