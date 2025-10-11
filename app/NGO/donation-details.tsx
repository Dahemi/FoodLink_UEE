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
          <MaterialCommunityIcons name="alert-circle" size={48} color="#F44336" />
          <Text style={styles.errorText}>Donation not found</Text>
          <Button mode="contained" onPress={() => router.back()}>
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
      {/* Header */}
      <View style={styles.header}>
        <Button
          icon="arrow-left"
          mode="text"
          onPress={() => router.back()}
          textColor="#2D3748"
          compact
        >
          
        </Button>
        <Text style={styles.headerTitle}>Donation Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Images Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.imageScrollContent}
          >
            {donation.images && donation.images.length > 0 ? (
              donation.images.map((image, index) => {
                const imageUrl = getImageUrl(image);
                
                if (!imageUrl) {
                  return (
                    <View key={`placeholder-${index}`} style={styles.imagePlaceholder}>
                      <MaterialCommunityIcons name="food-apple" size={48} color="#CBD5E0" />
                    </View>
                  );
                }

                return (
                  <Image
                    key={`image-${index}`}
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                    onError={(error) => {
                      console.error('Image load error:', error.nativeEvent.error);
                    }}
                  />
                );
              })
            ) : (
              // Placeholder images when no images available
              Array(8).fill(0).map((_, index) => (
                <View key={`empty-${index}`} style={styles.imagePlaceholder}>
                  <MaterialCommunityIcons name="food-apple" size={48} color="#CBD5E0" />
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Donation Details Card */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Donation Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{getTypeLabel(donation.foodDetails.type)}</Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity</Text>
              <Text style={styles.detailValue}>{donation.foodDetails.quantity}</Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Servings</Text>
              <Text style={styles.detailValue}>{donation.foodDetails.estimatedServings} servings</Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expiry</Text>
              <Text style={styles.detailValue}>{formatDate(donation.expiryDateTime)}</Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup Time</Text>
              <Text style={styles.detailValue}>
                {donation.pickupSchedule.availableFrom
                  ? formatDateTime(donation.pickupSchedule.availableFrom)
                  : formatDateTime(donation.createdAt)}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup Address</Text>
              <Text style={[styles.detailValue, styles.addressValue]}>
                {donation.pickupLocation.address}, {donation.pickupLocation.city}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Notes Section */}
        {(donation.pickupSchedule.specialInstructions || donation.foodDetails.description) && (
          <Card style={styles.notesCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>
                {donation.pickupSchedule.specialInstructions || donation.foodDetails.description}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Ingredients & Allergens */}
        {((donation.foodDetails.ingredients && donation.foodDetails.ingredients.length > 0) ||
          (donation.foodDetails.allergens && donation.foodDetails.allergens.length > 0)) && (
          <Card style={styles.notesCard}>
            <Card.Content>
              {donation.foodDetails.ingredients && donation.foodDetails.ingredients.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Ingredients</Text>
                  <View style={styles.tagContainer}>
                    {donation.foodDetails.ingredients.map((ingredient, index) => (
                      <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
                        {ingredient}
                      </Chip>
                    ))}
                  </View>
                </>
              )}

              {donation.foodDetails.allergens && donation.foodDetails.allergens.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Allergens</Text>
                  <View style={styles.tagContainer}>
                    {donation.foodDetails.allergens.map((allergen, index) => (
                      <Chip
                        key={index}
                        style={[styles.tag, styles.allergenTag]}
                        textStyle={[styles.tagText, styles.allergenText]}
                      >
                        {allergen}
                      </Chip>
                    ))}
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Donor Information */}
        <Card style={styles.donorCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Donor Information</Text>
            <View style={styles.donorInfo}>
              <Avatar.Text
                size={48}
                label={donorName.charAt(0).toUpperCase()}
                style={styles.donorAvatar}
              />
              <View style={styles.donorDetails}>
                <Text style={styles.donorName}>{donorName}</Text>
                <View style={styles.donorStats}>
                  <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                  <Text style={styles.donorRating}>
                    {donorRating} • {totalDonations} donations
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Accept Button */}
      {donation.status === 'available' && (
        <View style={styles.actionContainer}>
          <Button
            mode="contained"
            onPress={handleAcceptDonation}
            style={styles.acceptButton}
            loading={accepting}
            disabled={accepting}
            labelStyle={styles.acceptButtonLabel}
          >
            Accept Donation
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 220,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
  },
  imageScrollContent: {
    paddingHorizontal: 10,
  },
  image: {
    width: (width - 80) / 4,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#F7FAFC',
  },
  imagePlaceholder: {
    width: (width - 80) / 4,
    height: 100,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsCard: {
    margin: 20,
    marginBottom: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#718096',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
    textAlign: 'right',
  },
  addressValue: {
    fontSize: 12,
  },
  divider: {
    marginVertical: 4,
  },
  notesCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
  },
  notesText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#E6F7FF',
    height: 28,
  },
  tagText: {
    fontSize: 12,
    color: '#2D3748',
  },
  allergenTag: {
    backgroundColor: '#FFF3E0',
  },
  allergenText: {
    color: '#F57C00',
  },
  donorCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
  },
  donorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donorAvatar: {
    backgroundColor: '#FF8A50',
  },
  donorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  donorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  donorStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donorRating: {
    fontSize: 14,
    color: '#718096',
    marginLeft: 4,
  },
  actionContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  acceptButton: {
    backgroundColor: '#4CD964',
    paddingVertical: 8,
  },
  acceptButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#718096',
    marginVertical: 16,
  },
});
