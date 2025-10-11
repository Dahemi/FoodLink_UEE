import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { TextInput, Button, Card, Chip, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { DonationApi } from '../../services/createDonation';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useDonorAuth } from '../../context/DonorAuthContext';

export default function CreateDonation() {
  const router = useRouter();
  const { authState } = useDonorAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    foodDetails: {
      type: 'cooked_meal',
      category: 'vegetarian',
      quantity: '',
      estimatedServings: '',
      description: '',
      ingredients: '',
      allergens: '',
      storageInstructions: '',
    },
    expiryDateTime: '',
    pickupLocation: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
    },
    pickupSchedule: {
      urgency: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
      specialInstructions: '',
    },
  });

  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleImagePick = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to upload images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => asset.uri);
        setSelectedImages((prev) => [...prev, ...newImages].slice(0, 5)); // Max 5 images
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      console.error('Image pick error:', error);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera permissions to take photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        setSelectedImages((prev) =>
          [...prev, result.assets[0].uri].slice(0, 5)
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      console.error('Camera error:', error);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.title.trim()) {
        Alert.alert('Required Field', 'Please enter a donation title');
        return;
      }
      if (!formData.foodDetails.quantity.trim()) {
        Alert.alert('Required Field', 'Please enter quantity');
        return;
      }
      if (
        !formData.foodDetails.estimatedServings ||
        parseInt(formData.foodDetails.estimatedServings) < 1
      ) {
        Alert.alert('Required Field', 'Please enter valid estimated servings');
        return;
      }
      if (!formData.foodDetails.description.trim()) {
        Alert.alert('Required Field', 'Please enter food description');
        return;
      }
      if (!formData.expiryDateTime) {
        Alert.alert('Required Field', 'Please enter expiry date/time');
        return;
      }
      if (!formData.pickupLocation.address.trim()) {
        Alert.alert('Required Field', 'Please enter pickup address');
        return;
      }

      setLoading(true);

      // Parse expiry date/time
      let expiryDate: Date;
      try {
        const [datePart, timePart] = formData.expiryDateTime.split(' ');
        if (!datePart || !timePart) {
          throw new Error('Invalid date format');
        }
        expiryDate = new Date(`${datePart}T${timePart}:00`);
        if (isNaN(expiryDate.getTime())) {
          throw new Error('Invalid date');
        }
      } catch (error) {
        Alert.alert(
          'Invalid Date',
          'Please use format: YYYY-MM-DD HH:MM (e.g., 2024-01-20 18:00)'
        );
        setLoading(false);
        return;
      }

      if (expiryDate <= new Date()) {
        Alert.alert('Invalid Date', 'Expiry date/time must be in the future');
        setLoading(false);
        return;
      }

      // Prepare donation data
      const donationData = {
        title: formData.title.trim(),
        foodDetails: {
          type: formData.foodDetails.type,
          category: formData.foodDetails.category,
          quantity: formData.foodDetails.quantity.trim(),
          estimatedServings: parseInt(formData.foodDetails.estimatedServings),
          description: formData.foodDetails.description.trim(),
          ingredients: formData.foodDetails.ingredients
            ? formData.foodDetails.ingredients
                .split(',')
                .map((i) => i.trim())
                .filter(Boolean)
            : undefined,
          allergens: formData.foodDetails.allergens
            ? formData.foodDetails.allergens
                .split(',')
                .map((a) => a.trim())
                .filter(Boolean)
            : undefined,
          storageInstructions:
            formData.foodDetails.storageInstructions.trim() || undefined,
        },
        images:
          selectedImages.length > 0
            ? selectedImages.map((uri, index) => ({
                url: uri,
                isPrimary: index === 0,
              }))
            : undefined,
        expiryDateTime: expiryDate.toISOString(),
        pickupLocation: {
          address: formData.pickupLocation.address.trim(),
          city: formData.pickupLocation.city.trim() || 'Colombo',
          state: formData.pickupLocation.state.trim() || 'Western Province',
          zipCode: formData.pickupLocation.zipCode.trim() || '00000',
          coordinates: {
            latitude: 6.9271,
            longitude: 79.8612,
          },
        },
        pickupSchedule: {
          availableFrom: new Date().toISOString(),
          availableUntil: expiryDate.toISOString(),
          urgency: formData.pickupSchedule.urgency,
          specialInstructions:
            formData.pickupSchedule.specialInstructions.trim() || undefined,
        },
      };

      console.log(
        'Submitting donation:',
        JSON.stringify(donationData, null, 2)
      );

      const response = await DonationApi.createDonation(donationData);

      console.log('Donation created successfully:', response);

      Alert.alert(
        'Success! 🎉',
        'Your donation has been posted successfully. NGOs can now view and claim it.',
        [
          {
            text: 'View Donations',
            onPress: () => router.push('/donor/home'),
          },
          {
            text: 'Add Another',
            onPress: () => {
              // Reset form
              setFormData({
                title: '',
                foodDetails: {
                  type: 'cooked_meal',
                  category: 'vegetarian',
                  quantity: '',
                  estimatedServings: '',
                  description: '',
                  ingredients: '',
                  allergens: '',
                  storageInstructions: '',
                },
                expiryDateTime: '',
                pickupLocation: {
                  address: '',
                  city: '',
                  state: '',
                  zipCode: '',
                },
                pickupSchedule: {
                  urgency: 'medium',
                  specialInstructions: '',
                },
              });
              setSelectedImages([]);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Create donation error:', error);
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to create donation. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Creating donation..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Donation</Text>
          <Text style={styles.subtitle}>
            Share your surplus food with those in need
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            {/* Title */}
            <Text style={styles.label}>Donation Title *</Text>
            <TextInput
              value={formData.title}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, title: text }))
              }
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Fresh vegetables from restaurant"
              activeOutlineColor="#FF8A50"
            />

            {/* Food Type */}
            <Text style={styles.label}>Food Type *</Text>
            <View style={styles.chipContainer}>
              {[
                { value: 'cooked_meal', label: 'Cooked Meal', icon: '🍽️' },
                {
                  value: 'raw_ingredients',
                  label: 'Raw Ingredients',
                  icon: '🥬',
                },
                { value: 'packaged_food', label: 'Packaged Food', icon: '📦' },
              ].map((type) => (
                <Chip
                  key={type.value}
                  selected={formData.foodDetails.type === type.value}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      foodDetails: { ...prev.foodDetails, type: type.value },
                    }))
                  }
                  style={[
                    styles.chip,
                    formData.foodDetails.type === type.value &&
                      styles.chipSelected,
                  ]}
                  textStyle={[
                    styles.chipText,
                    formData.foodDetails.type === type.value &&
                      styles.chipTextSelected,
                  ]}
                  selectedColor="#FF8A50"
                >
                  {type.icon} {type.label}
                </Chip>
              ))}
            </View>

            {/* Category */}
            <Text style={styles.label}>Category *</Text>
            <View style={styles.chipContainer}>
              {[
                { value: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
                { value: 'non_vegetarian', label: 'Non-Veg', icon: '🍗' },
                { value: 'vegan', label: 'Vegan', icon: '🌱' },
              ].map((cat) => (
                <Chip
                  key={cat.value}
                  selected={formData.foodDetails.category === cat.value}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      foodDetails: { ...prev.foodDetails, category: cat.value },
                    }))
                  }
                  style={[
                    styles.chip,
                    formData.foodDetails.category === cat.value &&
                      styles.chipSelected,
                  ]}
                  textStyle={[
                    styles.chipText,
                    formData.foodDetails.category === cat.value &&
                      styles.chipTextSelected,
                  ]}
                  selectedColor="#FF8A50"
                >
                  {cat.icon} {cat.label}
                </Chip>
              ))}
            </View>

            {/* Quantity & Servings */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput
                  value={formData.foodDetails.quantity}
                  onChangeText={(text) =>
                    setFormData((prev) => ({
                      ...prev,
                      foodDetails: { ...prev.foodDetails, quantity: text },
                    }))
                  }
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g., 10 kg"
                  activeOutlineColor="#FF8A50"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Servings *</Text>
                <TextInput
                  value={formData.foodDetails.estimatedServings}
                  onChangeText={(text) =>
                    setFormData((prev) => ({
                      ...prev,
                      foodDetails: {
                        ...prev.foodDetails,
                        estimatedServings: text,
                      },
                    }))
                  }
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                  placeholder="e.g., 50"
                  activeOutlineColor="#FF8A50"
                />
              </View>
            </View>

            {/* Description */}
            <Text style={styles.label}>Description *</Text>
            <TextInput
              value={formData.foodDetails.description}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  foodDetails: { ...prev.foodDetails, description: text },
                }))
              }
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.textArea}
              placeholder="Describe the food items in detail..."
              activeOutlineColor="#FF8A50"
            />

            {/* Food Images */}
            <Text style={styles.label}>Food Images (Optional)</Text>
            <View style={styles.imageSection}>
              <View style={styles.imageButtons}>
                <Button
                  mode="outlined"
                  onPress={handleTakePhoto}
                  icon="camera"
                  style={styles.imageButton}
                  textColor="#FF8A50"
                >
                  Take Photo
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleImagePick}
                  icon="image"
                  style={styles.imageButton}
                  textColor="#FF8A50"
                >
                  Choose from Gallery
                </Button>
              </View>

              {selectedImages.length > 0 && (
                <View style={styles.imagePreviewContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {selectedImages.map((uri, index) => (
                      <View key={index} style={styles.imagePreview}>
                        <Image source={{ uri }} style={styles.previewImage} />
                        <IconButton
                          icon="close-circle"
                          size={24}
                          iconColor="#FF3B30"
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                        />
                        {index === 0 && (
                          <View style={styles.primaryBadge}>
                            <Text style={styles.primaryBadgeText}>Primary</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                  <Text style={styles.imageCount}>
                    {selectedImages.length}/5 images
                  </Text>
                </View>
              )}
            </View>

            {/* Ingredients */}
            <Text style={styles.label}>Ingredients (comma separated)</Text>
            <TextInput
              value={formData.foodDetails.ingredients}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  foodDetails: { ...prev.foodDetails, ingredients: text },
                }))
              }
              mode="outlined"
              style={styles.input}
              placeholder="e.g., rice, vegetables, lentils"
              activeOutlineColor="#FF8A50"
            />

            {/* Allergens */}
            <Text style={styles.label}>Allergens (comma separated)</Text>
            <TextInput
              value={formData.foodDetails.allergens}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  foodDetails: { ...prev.foodDetails, allergens: text },
                }))
              }
              mode="outlined"
              style={styles.input}
              placeholder="e.g., nuts, dairy, gluten"
              activeOutlineColor="#FF8A50"
            />

            {/* Storage Instructions */}
            <Text style={styles.label}>Storage Instructions</Text>
            <TextInput
              value={formData.foodDetails.storageInstructions}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  foodDetails: {
                    ...prev.foodDetails,
                    storageInstructions: text,
                  },
                }))
              }
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Keep refrigerated"
              activeOutlineColor="#FF8A50"
            />

            {/* Expiry Date/Time */}
            <Text style={styles.label}>Expiry Date/Time *</Text>
            <TextInput
              value={formData.expiryDateTime}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, expiryDateTime: text }))
              }
              mode="outlined"
              style={styles.input}
              placeholder="YYYY-MM-DD HH:MM (e.g., 2024-01-20 18:00)"
              activeOutlineColor="#FF8A50"
            />
            <Text style={styles.helperText}>
              💡 Enter the date and time when the food expires
            </Text>

            {/* Pickup Location */}
            <Text style={styles.sectionTitle}>📍 Pickup Location</Text>

            <Text style={styles.label}>Street Address *</Text>
            <TextInput
              value={formData.pickupLocation.address}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  pickupLocation: { ...prev.pickupLocation, address: text },
                }))
              }
              mode="outlined"
              style={styles.input}
              placeholder="e.g., 123 Main Street"
              activeOutlineColor="#FF8A50"
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  value={formData.pickupLocation.city}
                  onChangeText={(text) =>
                    setFormData((prev) => ({
                      ...prev,
                      pickupLocation: { ...prev.pickupLocation, city: text },
                    }))
                  }
                  mode="outlined"
                  style={styles.input}
                  placeholder="Colombo"
                  activeOutlineColor="#FF8A50"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  value={formData.pickupLocation.state}
                  onChangeText={(text) =>
                    setFormData((prev) => ({
                      ...prev,
                      pickupLocation: { ...prev.pickupLocation, state: text },
                    }))
                  }
                  mode="outlined"
                  style={styles.input}
                  placeholder="Western"
                  activeOutlineColor="#FF8A50"
                />
              </View>
            </View>

            <Text style={styles.label}>Zip Code</Text>
            <TextInput
              value={formData.pickupLocation.zipCode}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  pickupLocation: { ...prev.pickupLocation, zipCode: text },
                }))
              }
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              placeholder="00100"
              activeOutlineColor="#FF8A50"
            />

            {/* Urgency */}
            <Text style={styles.label}>Urgency Level *</Text>
            <View style={styles.chipContainer}>
              {[
                { value: 'low', label: 'Low', color: '#10B981' },
                { value: 'medium', label: 'Medium', color: '#F59E0B' },
                { value: 'high', label: 'High', color: '#EF4444' },
                { value: 'urgent', label: 'Urgent', color: '#DC2626' },
              ].map((urg) => (
                <Chip
                  key={urg.value}
                  selected={formData.pickupSchedule.urgency === urg.value}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      pickupSchedule: {
                        ...prev.pickupSchedule,
                        urgency: urg.value as any,
                      },
                    }))
                  }
                  style={[
                    styles.chip,
                    formData.pickupSchedule.urgency === urg.value && {
                      backgroundColor: urg.color,
                    },
                  ]}
                  textStyle={[
                    styles.chipText,
                    formData.pickupSchedule.urgency === urg.value && {
                      color: '#FFFFFF',
                    },
                  ]}
                >
                  {urg.label}
                </Chip>
              ))}
            </View>

            {/* Special Instructions */}
            <Text style={styles.label}>Special Pickup Instructions</Text>
            <TextInput
              value={formData.pickupSchedule.specialInstructions}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  pickupSchedule: {
                    ...prev.pickupSchedule,
                    specialInstructions: text,
                  },
                }))
              }
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.textArea}
              placeholder="Any special requirements for pickup..."
              activeOutlineColor="#FF8A50"
            />

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              labelStyle={styles.submitButtonText}
              disabled={loading}
              icon="check-circle"
            >
              Create Donation
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    fontSize: 16,
    color: '#FF8A50',
    marginBottom: 10,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
  },
  card: {
    margin: 20,
    elevation: 2,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
    minHeight: 100,
  },
  helperText: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 12,
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#F7FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: '#FF8A50',
  },
  chipText: {
    color: '#4A5568',
    fontSize: 13,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 20,
    marginBottom: 12,
  },
  imageSection: {
    marginBottom: 16,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  imageButton: {
    flex: 1,
    borderColor: '#FF8A50',
  },
  imagePreviewContainer: {
    marginTop: 12,
  },
  imagePreview: {
    marginRight: 12,
    position: 'relative',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -12,
    right: -12,
    backgroundColor: '#FFFFFF',
    margin: 0,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#FF8A50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  imageCount: {
    fontSize: 12,
    color: '#718096',
    marginTop: 8,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: '#FF8A50',
    paddingVertical: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
