import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Chip, Divider, Avatar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NGODonationApi } from '../../services/ngoDonationApi';
import LoadingSpinner from '../../components/LoadingSpinner';

const { width } = Dimensions.get('window');

interface DonationImage {
  url: string;
  isPrimary?: boolean;
}

interface DonationDetails {
  _id: string;
  donorId: {
    _id: string;
    name: string;
    donorType: string;
    businessName?: string;
    phone?: string;
    rating?: number;
    totalDonations?: number;
  };
  title: string;
  status: string;
  foodDetails: {
    type: string;
    category: string;
    quantity: string;
    estimatedServings: number;
    description: string;
    ingredients?: string[];
    allergens?: string[];
  };
  expiryDateTime: string;
  pickupLocation: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  pickupSchedule: {
    urgency: string;
    availableFrom?: string;
    availableUntil?: string;
    specialInstructions?: string;
  };
  images?: (string | DonationImage)[];
  createdAt: string;
  updatedAt: string;
}

export default function DonationDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [donation, setDonation] = useState<DonationDetails | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    fetchDonationDetails();
  }, [id]);

  const fetchDonationDetails = async () => {
    try {
      setLoading(true);
      if (!id) {
        Alert.alert('Error', 'Donation ID not found');
        router.back();
        return;
      }

      console.log('Fetching donation details for ID:', id);
      const response = await NGODonationApi.getDonation(id);
      console.log('Donation details fetched:', response);
      setDonation(response);
    } catch (error) {
      console.error('Error fetching donation details:', error);
      Alert.alert('Error', 'Failed to load donation details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDonation = async () => {
    try {
      setAccepting(true);
      if (!donation) return;

      console.log('Accepting donation:', donation._id);
      
      const response = await NGODonationApi.expressInterest(
        donation._id,
        'We would like to collect this donation for our beneficiaries.'
      );

      console.log('Donation accepted successfully:', response);

      // Navigate to success screen with donation title
      router.replace({
        pathname: '/NGO/donation-accepted',
        params: { donationTitle: donation.title },
      });
    } catch (error) {
      console.error('Error accepting donation:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to accept donation. Please try again.'
      );
    } finally {
      setAccepting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      cooked_meal: 'Cooked Meal',
      raw_ingredients: 'Raw Ingredients',
      packaged_food: 'Packaged Food',
      bakery: 'Bakery',
      fruits_vegetables: 'Produce',
      dairy: 'Dairy',
      other: 'Other',
    };
    return labels[type] || type;
  };

  // Helper function to extract image URL from string or object
  const getImageUrl = (image: string | DonationImage): string | null => {
    if (typeof image === 'string') {
      return image;
    } else if (image && typeof image === 'object' && 'url' in image) {
      return image.url;
    }
    return null;
  };

  const calculateHoursUntilExpiry = (expiryDateTime: string): number => {
    const now = new Date();
    const expiry = new Date(expiryDateTime);
    const hours = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));
    return Math.max(0, hours);
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency.toLowerCase()) {
      case 'urgent': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#FFC107';
      case 'low': return '#4CAF50';
      default: return '#718096';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'urgent': return 'alert-circle' as const;
      case 'high': return 'fire' as const;
      case 'medium': return 'clock-fast' as const;
      case 'low': return 'clock-outline' as const;
      default: return 'information' as const;
    }
  };

  const getFoodTypeIcon = (type: string) => {
    const icons = {
      cooked_meal: 'food' as const,
      raw_ingredients: 'food-variant' as const,
      packaged_food: 'package-variant' as const,
      bakery: 'bread-slice' as const,
      fruits_vegetables: 'food-apple' as const,
      dairy: 'cow' as const,
      beverages: 'cup' as const,
    } as const;
    return icons[type as keyof typeof icons] || 'food' as const;
  };

  if (loading) {
    return (
      <LoadingSpinner
        message="Loading donation details..."
        size="large"
        color="#FF8A50"
      />
    );
  }

  if (!donation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#F44336" />
          <Text style={styles.errorTitle}>Donation Not Found</Text>
          <Text style={styles.errorText}>This donation may have been removed or is no longer available.</Text>
          <Button mode="contained" onPress={() => router.back()} style={styles.errorButton}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const donorName = typeof donation.donorId === 'object'
    ? donation.donorId.businessName || donation.donorId.name
    : 'Donor';

  const donorRating = typeof donation.donorId === 'object'
    ? donation.donorId.rating || 4.8
    : 4.8;

  const totalDonations = typeof donation.donorId === 'object'
    ? donation.donorId.totalDonations || 120
    : 120;

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header with Status */}
      <View style={styles.header}>
        <Button
          icon="arrow-left"
          mode="text"
          onPress={() => router.back()}
          textColor="#2D3748"
          compact
          style={styles.backButton}
        >
          Back
        </Button>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Donation Details</Text>
          
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image Gallery with Indicator */}
        <View style={styles.heroSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setImageIndex(index);
            }}
            style={styles.imageGallery}
          >
            {donation.images && donation.images.length > 0 ? (
              donation.images.map((image, index) => {
                const imageUrl = getImageUrl(image);
                return imageUrl ? (
                  <Image
                    key={index}
                    source={{ uri: imageUrl }}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                ) : null;
              })
            ) : (
              <View style={styles.placeholderHero}>
                <MaterialCommunityIcons name="food-apple" size={80} color="#CBD5E0" />
                <Text style={styles.placeholderText}>No image available</Text>
              </View>
            )}
          </ScrollView>
          
          {/* Image Indicator */}
          {donation.images && donation.images.length > 1 && (
            <View style={styles.imageIndicator}>
              {donation.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicatorDot,
                    imageIndex === index && styles.indicatorDotActive
                  ]}
                />
              ))}
            </View>
          )}

          {/* Urgency Badge Overlay */}
          <View style={[
            styles.urgencyBadgeOverlay,
            { backgroundColor: getUrgencyColor(donation.pickupSchedule.urgency) }
          ]}>
            <MaterialCommunityIcons 
              name={getUrgencyIcon(donation.pickupSchedule.urgency)} 
              size={16} 
              color="#FFFFFF" 
            />
            <Text style={styles.urgencyBadgeText}>
              {donation.pickupSchedule.urgency.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>{donation.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={18} color="#718096" />
              <Text style={styles.metaText}>
                Listed {formatTimeAgo(donation.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="food-variant" size={24} color="#FF8A50" />
            </View>
            <Text style={styles.statValue}>{donation.foodDetails.quantity}</Text>
            <Text style={styles.statLabel}>Quantity</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="account-group" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.statValue}>{donation.foodDetails.estimatedServings}</Text>
            <Text style={styles.statLabel}>Servings</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="clock-fast" size={24} color="#F44336" />
            </View>
            <Text style={styles.statValue}>
              {calculateHoursUntilExpiry(donation.expiryDateTime)}h
            </Text>
            <Text style={styles.statLabel}>Until Expiry</Text>
          </View>
        </View>

        {/* Food Details Card */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="information" size={24} color="#FF8A50" />
              <Text style={styles.sectionTitle}>Food Information</Text>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Type</Text>
                <View style={styles.detailValueContainer}>
                  <MaterialCommunityIcons 
                    name={getFoodTypeIcon(donation.foodDetails.type)} 
                    size={18} 
                    color="#FF8A50" 
                  />
                  <Text style={styles.detailValue}>
                    {getTypeLabel(donation.foodDetails.type)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Category</Text>
                <View style={styles.detailValueContainer}>
                  <MaterialCommunityIcons name="tag" size={18} color="#4CAF50" />
                  <Text style={styles.detailValue}>
                    {donation.foodDetails.category.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Expiry Date</Text>
                <View style={styles.detailValueContainer}>
                  <MaterialCommunityIcons name="calendar-clock" size={18} color="#F44336" />
                  <Text style={styles.detailValue}>{formatDate(donation.expiryDateTime)}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Pickup Available</Text>
                <View style={styles.detailValueContainer}>
                  <MaterialCommunityIcons name="truck-fast" size={18} color="#2196F3" />
                  <Text style={styles.detailValue}>
                    {donation.pickupSchedule.availableFrom
                      ? formatDateTime(donation.pickupSchedule.availableFrom)
                      : 'Anytime'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Description */}
            {donation.foodDetails.description && (
              <>
                <Divider style={styles.divider} />
                <Text style={styles.descriptionLabel}>Description</Text>
                <Text style={styles.descriptionText}>
                  {donation.foodDetails.description}
                </Text>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Ingredients & Allergens */}
        {((donation.foodDetails.ingredients && donation.foodDetails.ingredients.length > 0) ||
          (donation.foodDetails.allergens && donation.foodDetails.allergens.length > 0)) && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              {donation.foodDetails.ingredients && donation.foodDetails.ingredients.length > 0 && (
                <View style={styles.tagSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="food-apple" size={24} color="#4CAF50" />
                    <Text style={styles.sectionTitle}>Ingredients</Text>
                  </View>
                  <View style={styles.tagContainer}>
                    {donation.foodDetails.ingredients.map((ingredient, index) => (
                      <Chip 
                        key={index} 
                        mode="outlined"
                        style={styles.ingredientChip}
                        textStyle={styles.ingredientText}
                        icon="check-circle"
                      >
                        {ingredient}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}

              {donation.foodDetails.allergens && donation.foodDetails.allergens.length > 0 && (
                <View style={[styles.tagSection, { marginTop: 20 }]}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="alert-circle" size={24} color="#F44336" />
                    <Text style={styles.sectionTitle}>Allergen Information</Text>
                  </View>
                  <View style={styles.tagContainer}>
                    {donation.foodDetails.allergens.map((allergen, index) => (
                      <Chip
                        key={index}
                        mode="outlined"
                        style={styles.allergenChip}
                        textStyle={styles.allergenChipText}
                        icon="alert"
                      >
                        {allergen}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Pickup Location Card */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="map-marker" size={24} color="#2196F3" />
              <Text style={styles.sectionTitle}>Pickup Location</Text>
            </View>

            <View style={styles.locationCard}>
              <View style={styles.locationIconContainer}>
                <MaterialCommunityIcons name="home-map-marker" size={32} color="#FF8A50" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationAddress}>
                  {donation.pickupLocation.address}
                </Text>
                <Text style={styles.locationCity}>
                  {donation.pickupLocation.city}, {donation.pickupLocation.state} {donation.pickupLocation.zipCode}
                </Text>
              </View>
            </View>

            {donation.pickupSchedule.specialInstructions && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.instructionsSection}>
                  <View style={styles.instructionsHeader}>
                    <MaterialCommunityIcons name="information-outline" size={20} color="#2196F3" />
                    <Text style={styles.instructionsTitle}>Special Instructions</Text>
                  </View>
                  <Text style={styles.instructionsText}>
                    {donation.pickupSchedule.specialInstructions}
                  </Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Donor Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account" size={24} color="#FF8A50" />
              <Text style={styles.sectionTitle}>Donor Information</Text>
            </View>

            <View style={styles.donorCard}>
              <Avatar.Text
                size={56}
                label={donorName.charAt(0).toUpperCase()}
                style={styles.donorAvatar}
                labelStyle={styles.donorAvatarLabel}
              />
              <View style={styles.donorInfo}>
                <Text style={styles.donorName}>{donorName}</Text>
                <View style={styles.donorRatingContainer}>
                  <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                  <Text style={styles.donorRating}>{donorRating.toFixed(1)}</Text>
                  <Text style={styles.donorStats}>• {totalDonations} donations</Text>
                </View>
                <View style={styles.donorBadgeContainer}>
                  <Chip
                    mode="flat"
                    style={styles.verifiedBadge}
                    textStyle={styles.verifiedBadgeText}
                    icon="check-decagram"
                  >
                    Verified Donor
                  </Chip>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Enhanced Accept Button */}
      {donation.status === 'available' && (
        <View style={styles.actionContainer}>
          <View style={styles.actionInfo}>
            <MaterialCommunityIcons name="information" size={20} color="#718096" />
            <Text style={styles.actionInfoText}>
              You'll be notified when a volunteer is assigned
            </Text>
          </View>
          <Button
            mode="contained"
            onPress={handleAcceptDonation}
            style={styles.acceptButton}
            loading={accepting}
            disabled={accepting}
            labelStyle={styles.acceptButtonLabel}
            icon="check-circle"
          >
            {accepting ? 'Processing...' : 'Accept Donation'}
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
  },
  backButton: {
    marginLeft: -8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  headerStatusChip: {
    height: 24,
  },
  headerStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroSection: {
    position: 'relative',
    height: 280,
    backgroundColor: '#FFFFFF',
  },
  imageGallery: {
    height: 280,
  },
  heroImage: {
    width: width,
    height: 280,
  },
  placeholderHero: {
    width: width,
    height: 280,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#CBD5E0',
    marginTop: 12,
    fontWeight: '500',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorDotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  urgencyBadgeOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  urgencyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  titleSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 12,
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
  sectionCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  divider: {
    marginVertical: 16,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 22,
  },
  tagSection: {
    marginBottom: 0,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  ingredientChip: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  ingredientText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '500',
  },
  allergenChip: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFB74D',
  },
  allergenChipText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '500',
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  locationIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
    lineHeight: 20,
  },
  locationCity: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 18,
  },
  instructionsSection: {
    marginTop: 16,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  instructionsText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    paddingLeft: 28,
  },
  donorCard: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 8,
  },
  donorAvatar: {
    backgroundColor: '#FF8A50',
  },
  donorAvatarLabel: {
    fontSize: 24,
    fontWeight: '700',
  },
  donorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  donorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 6,
  },
  donorRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  donorRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 4,
  },
  donorStats: {
    fontSize: 14,
    color: '#718096',
    marginLeft: 4,
  },
  donorBadgeContainer: {
    flexDirection: 'row',
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    height: 28,
  },
  verifiedBadgeText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
  },
  actionContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  actionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  actionInfoText: {
    fontSize: 13,
    color: '#718096',
    flex: 1,
  },
  acceptButton: {
    backgroundColor: '#FF8A50',
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
  },
  acceptButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3748',
    marginTop: 20,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#FF8A50',
  },
});
