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
import { TextInput, Button, Card, Chip, IconButton, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { DonationApi } from '../../services/createDonation';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useDonorAuth } from '../../context/DonorAuthContext';

export default function CreateDonation() {
  const router = useRouter();
  const { authState } = useDonorAuth();
  const [loading, setLoading] = useState(false);

  // Quick template selection
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [expiryDate, setExpiryDate] = useState(new Date());

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    foodDetails: {
      type: 'cooked_meal',
      category: 'vegetarian',
      quantity: '',
      estimatedServings: 10,
      description: '',
      ingredients: '',
      allergens: '',
      storageInstructions: '',
    },
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

  // Quick templates for common donations
  const donationTemplates = [
    {
      id: 'restaurant_surplus',
      icon: '🍽️',
      label: 'Restaurant Surplus',
      data: {
        type: 'cooked_meal',
        category: 'non_vegetarian',
        quantity: '20-30 portions',
        description: 'Fresh cooked meals from restaurant surplus',
        urgency: 'high',
      }
    },
    {
      id: 'bakery_items',
      icon: '🥐',
      label: 'Bakery Items',
      data: {
        type: 'packaged_food',
        category: 'vegetarian',
        quantity: '15-20 items',
        description: 'Fresh baked goods - bread, pastries, cakes',
        urgency: 'medium',
      }
    },
    {
      id: 'fresh_produce',
      icon: '🥬',
      label: 'Fresh Produce',
      data: {
        type: 'raw_ingredients',
        category: 'vegan',
        quantity: '10-15 kg',
        description: 'Fresh fruits and vegetables',
        urgency: 'medium',
      }
    },
    {
      id: 'packaged_goods',
      icon: '📦',
      label: 'Packaged Goods',
      data: {
        type: 'packaged_food',
        category: 'vegetarian',
        quantity: '20-30 items',
        description: 'Non-perishable packaged food items',
        urgency: 'low',
      }
    },
  ];

  // Predefined quantities
  const quantityOptions = [
    { label: '5-10 portions', value: '5-10 portions', servings: 8 },
    { label: '10-20 portions', value: '10-20 portions', servings: 15 },
    { label: '20-30 portions', value: '20-30 portions', servings: 25 },
    { label: '30-50 portions', value: '30-50 portions', servings: 40 },
    { label: '50+ portions', value: '50+ portions', servings: 60 },
  ];

  // Common allergens
  const commonAllergens = [
    { label: 'Nuts', icon: '🥜', value: 'nuts' },
    { label: 'Dairy', icon: '🥛', value: 'dairy' },
    { label: 'Gluten', icon: '🌾', value: 'gluten' },
    { label: 'Eggs', icon: '🥚', value: 'eggs' },
    { label: 'Soy', icon: '🫘', value: 'soy' },
    { label: 'Fish', icon: '🐟', value: 'fish' },
    { label: 'Shellfish', icon: '🦐', value: 'shellfish' },
    { label: 'Sesame', icon: '🌰', value: 'sesame' },
  ];
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

  // Common storage instructions
  const storageOptions = [
    { icon: '❄️', label: 'Refrigerated', value: 'Keep refrigerated at 4°C or below' },
    { icon: '🧊', label: 'Frozen', value: 'Keep frozen until pickup' },
    { icon: '🌡️', label: 'Room Temp', value: 'Store at room temperature' },
    { icon: '🔥', label: 'Keep Warm', value: 'Keep hot until pickup (above 60°C)' },
  ];

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template.id);
    setFormData(prev => ({
      ...prev,
      foodDetails: {
        ...prev.foodDetails,
        type: template.data.type,
        category: template.data.category,
        quantity: template.data.quantity,
        description: template.data.description,
      },
      pickupSchedule: {
        ...prev.pickupSchedule,
        urgency: template.data.urgency,
      }
    }));
  };

  const handleQuantitySelect = (option: any) => {
    setFormData(prev => ({
      ...prev,
      foodDetails: {
        ...prev.foodDetails,
        quantity: option.value,
        estimatedServings: option.servings,
      }
    }));
  };

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens(prev => 
      prev.includes(allergen) 
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(expiryDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setExpiryDate(newDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(expiryDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setExpiryDate(newDate);
    }
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library permissions.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...newImages].slice(0, 5));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        setSelectedImages(prev => [...prev, result.assets[0].uri].slice(0, 5));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.title.trim()) {
        Alert.alert('Required', 'Please enter a donation title');
        return;
      }

      setLoading(true);

      // Get address from user profile or form
      let pickupAddress = formData.pickupLocation.address;
      let pickupCity = formData.pickupLocation.city || 'Colombo';
      let pickupState = formData.pickupLocation.state || 'Western Province';
      let pickupZipCode = formData.pickupLocation.zipCode || '00000';

      // If user has saved address and no custom address provided
      if (authState.user?.address && !pickupAddress) {
        if (typeof authState.user.address === 'string') {
          // If address is stored as string, parse it
          const parts = authState.user.address.split(',').map(s => s.trim());
          pickupAddress = parts[0] || '123 Main St';
          pickupCity = parts[1] || 'Colombo';
          pickupState = parts[2] || 'Western Province';
        } else if (typeof authState.user.address === 'object') {
          // If address is stored as object
          pickupAddress = authState.user.address.street || '123 Main St';
          pickupCity = authState.user.address.city || 'Colombo';
          pickupState = authState.user.address.state || 'Western Province';
          pickupZipCode = authState.user.address.zipCode || '00000';
        }
      }

      // Prepare donation data
      const donationData = {
        title: formData.title.trim(),
        foodDetails: {
          type: formData.foodDetails.type,
          category: formData.foodDetails.category,
          quantity: formData.foodDetails.quantity.trim(),
          estimatedServings: formData.foodDetails.estimatedServings,
          description: formData.foodDetails.description.trim(),
          ingredients: formData.foodDetails.ingredients
            ? formData.foodDetails.ingredients.split(',').map(i => i.trim()).filter(Boolean)
            : undefined,
          allergens: selectedAllergens.length > 0 ? selectedAllergens : undefined,
          storageInstructions: formData.foodDetails.storageInstructions || undefined,
        },
        images: selectedImages.length > 0
          ? selectedImages.map((uri, index) => ({
              url: uri,
              isPrimary: index === 0,
            }))
          : undefined,
        expiryDateTime: expiryDate.toISOString(),
        pickupLocation: {
          address: pickupAddress,
          city: pickupCity,
          state: pickupState,
          zipCode: pickupZipCode,
          coordinates: {
            latitude: 6.9271,
            longitude: 79.8612,
          },
        },
        pickupSchedule: {
          availableFrom: new Date().toISOString(),
          availableUntil: expiryDate.toISOString(),
          urgency: formData.pickupSchedule.urgency,
          specialInstructions: formData.pickupSchedule.specialInstructions.trim() || undefined,
        },
      };

      console.log('Submitting donation:', JSON.stringify(donationData, null, 2));
      const response = await DonationApi.createDonation(donationData);
      console.log('Donation created successfully:', response);

      // Navigate to success screen with donation title
      router.replace({
        pathname: '/donor/donation-success',
        params: { donationTitle: formData.title },
      });
    } catch (error) {
      console.error('Create donation error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create donation. Please try again.'
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
          <Text style={styles.subtitle}>Quick and easy - just a few taps!</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            {/* Step 1: Quick Templates */}
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>1</Text>
                </View>
                <Text style={styles.stepTitle}>Choose a template (Optional)</Text>
              </View>
              <Text style={styles.stepSubtitle}>Quick start with common donation types</Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
                {donationTemplates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.templateCard,
                      selectedTemplate === template.id && styles.templateCardSelected,
                    ]}
                    onPress={() => handleTemplateSelect(template)}
                  >
                    <Text style={styles.templateIcon}>{template.icon}</Text>
                    <Text style={styles.templateLabel}>{template.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Step 2: Basic Info */}
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>2</Text>
                </View>
                <Text style={styles.stepTitle}>Basic Information</Text>
              </View>

              <Text style={styles.label}>Donation Title *</Text>
              <TextInput
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                mode="outlined"
                style={styles.input}
                placeholder="E.g., Fresh restaurant meals"
                activeOutlineColor="#FF8A50"
              />

              {/* Food Type with Icons */}
              <Text style={styles.label}>Food Type *</Text>
              <SegmentedButtons
                value={formData.foodDetails.type}
                onValueChange={(value) =>
                  setFormData(prev => ({
                    ...prev,
                    foodDetails: { ...prev.foodDetails, type: value },
                  }))
                }
                buttons={[
                  { value: 'cooked_meal', label: '🍽️ Cooked', style: styles.segmentButton },
                  { value: 'raw_ingredients', label: '🥬 Raw', style: styles.segmentButton },
                  { value: 'packaged_food', label: '📦 Packaged', style: styles.segmentButton },
                ]}
                style={styles.segmentedButtons}
              />

              {/* Category */}
              <Text style={styles.label}>Category *</Text>
              <View style={styles.chipContainer}>
                {[
                  { value: 'vegetarian', label: '🥗 Vegetarian' },
                  { value: 'non_vegetarian', label: '🍗 Non-Veg' },
                  { value: 'vegan', label: '🌱 Vegan' },
                ].map((cat) => (
                  <Chip
                    key={cat.value}
                    selected={formData.foodDetails.category === cat.value}
                    onPress={() =>
                      setFormData(prev => ({
                        ...prev,
                        foodDetails: { ...prev.foodDetails, category: cat.value },
                      }))
                    }
                    style={[
                      styles.chip,
                      formData.foodDetails.category === cat.value && styles.chipSelected,
                    ]}
                    textStyle={[
                      styles.chipText,
                      formData.foodDetails.category === cat.value && styles.chipTextSelected,
                    ]}
                  >
                    {cat.label}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Step 3: Quantity */}
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>3</Text>
                </View>
                <Text style={styles.stepTitle}>Quantity & Servings</Text>
              </View>

              <Text style={styles.label}>Select Quantity *</Text>
              <View style={styles.quantityGrid}>
                {quantityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.quantityCard,
                      formData.foodDetails.quantity === option.value && styles.quantityCardSelected,
                    ]}
                    onPress={() => handleQuantitySelect(option)}
                  >
                    <Text style={[
                      styles.quantityLabel,
                      formData.foodDetails.quantity === option.value && styles.quantityLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      styles.quantityServings,
                      formData.foodDetails.quantity === option.value && styles.quantityServingsSelected,
                    ]}>
                      ~{option.servings} servings
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Servings Slider */}
              <Text style={styles.label}>
                Fine-tune servings: {formData.foodDetails.estimatedServings} people
              </Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>5</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={5}
                  maximumValue={100}
                  step={5}
                  value={formData.foodDetails.estimatedServings}
                  onValueChange={(value) =>
                    setFormData(prev => ({
                      ...prev,
                      foodDetails: { ...prev.foodDetails, estimatedServings: value },
                    }))
                  }
                  minimumTrackTintColor="#FF8A50"
                  maximumTrackTintColor="#E2E8F0"
                  thumbTintColor="#FF8A50"
                />
                <Text style={styles.sliderLabel}>100</Text>
              </View>
            </View>

            {/* Step 4: Details */}
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>4</Text>
                </View>
                <Text style={styles.stepTitle}>Additional Details</Text>
              </View>

              {/* Description */}
              <Text style={styles.label}>Description *</Text>
              <TextInput
                value={formData.foodDetails.description}
                onChangeText={(text) =>
                  setFormData(prev => ({
                    ...prev,
                    foodDetails: { ...prev.foodDetails, description: text },
                  }))
                }
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.textArea}
                placeholder="Describe the food items..."
                activeOutlineColor="#FF8A50"
              />

              {/* Allergens with Icons */}
              <Text style={styles.label}>Contains Allergens? (Select all that apply)</Text>
              <View style={styles.allergenGrid}>
                {commonAllergens.map((allergen) => (
                  <TouchableOpacity
                    key={allergen.value}
                    style={[
                      styles.allergenCard,
                      selectedAllergens.includes(allergen.value) && styles.allergenCardSelected,
                    ]}
                    onPress={() => toggleAllergen(allergen.value)}
                  >
                    <Text style={styles.allergenIcon}>{allergen.icon}</Text>
                    <Text style={[
                      styles.allergenLabel,
                      selectedAllergens.includes(allergen.value) && styles.allergenLabelSelected,
                    ]}>
                      {allergen.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Storage Instructions */}
              <Text style={styles.label}>Storage Instructions *</Text>
              <View style={styles.storageGrid}>
                {storageOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.storageCard,
                      formData.foodDetails.storageInstructions === option.value && styles.storageCardSelected,
                    ]}
                    onPress={() =>
                      setFormData(prev => ({
                        ...prev,
                        foodDetails: { ...prev.foodDetails, storageInstructions: option.value },
                      }))
                    }
                  >
                    <Text style={styles.storageIcon}>{option.icon}</Text>
                    <Text style={[
                      styles.storageLabel,
                      formData.foodDetails.storageInstructions === option.value && styles.storageLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Step 5: Photos */}
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>5</Text>
                </View>
                <Text style={styles.stepTitle}>Add Photos (Optional)</Text>
              </View>
              <Text style={styles.stepSubtitle}>Photos help NGOs make better decisions</Text>

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
                  Choose Photos
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
                    {selectedImages.length}/5 photos
                  </Text>
                </View>
              )}
            </View>

            {/* Step 6: Expiry & Urgency */}
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>6</Text>
                </View>
                <Text style={styles.stepTitle}>Expiry & Urgency</Text>
              </View>

              {/* Date & Time Pickers */}
              <Text style={styles.label}>Food expires on *</Text>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <IconButton icon="calendar" size={20} iconColor="#FF8A50" />
                  <Text style={styles.dateTimeText}>
                    {expiryDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <IconButton icon="clock-outline" size={20} iconColor="#FF8A50" />
                  <Text style={styles.dateTimeText}>
                    {expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={expiryDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={expiryDate}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}

              {/* Urgency */}
              <Text style={styles.label}>Urgency Level *</Text>
              <View style={styles.urgencyGrid}>
                {[
                  { value: 'low', label: 'Low', color: '#10B981', icon: '🟢', desc: 'Can wait' },
                  { value: 'medium', label: 'Medium', color: '#F59E0B', icon: '🟡', desc: 'Soon' },
                  { value: 'high', label: 'High', color: '#EF4444', icon: '🟠', desc: 'Today' },
                  { value: 'urgent', label: 'Urgent', color: '#DC2626', icon: '🔴', desc: 'ASAP!' },
                ].map((urg) => (
                  <TouchableOpacity
                    key={urg.value}
                    style={[
                      styles.urgencyCard,
                      formData.pickupSchedule.urgency === urg.value && {
                        borderColor: urg.color,
                        borderWidth: 3,
                        backgroundColor: `${urg.color}10`,
                      },
                    ]}
                    onPress={() =>
                      setFormData(prev => ({
                        ...prev,
                        pickupSchedule: {
                          ...prev.pickupSchedule,
                          urgency: urg.value as any,
                        },
                      }))
                    }
                  >
                    <Text style={styles.urgencyIcon}>{urg.icon}</Text>
                    <Text style={[
                      styles.urgencyLabel,
                      formData.pickupSchedule.urgency === urg.value && { color: urg.color, fontWeight: '700' },
                    ]}>
                      {urg.label}
                    </Text>
                    <Text style={styles.urgencyDesc}>{urg.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Step 7: Location */}
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>7</Text>
                </View>
                <Text style={styles.stepTitle}>Pickup Location</Text>
              </View>

              {authState.user?.address && typeof authState.user.address === 'object' && formData.pickupLocation.address === '' && (
                <View style={styles.savedAddressCard}>
                  <IconButton icon="map-marker" size={24} iconColor="#FF8A50" />
                  <View style={styles.savedAddressContent}>
                    <Text style={styles.savedAddressLabel}>Using saved address</Text>
                    <Text style={styles.savedAddressText}>
                      {`${authState.user.address.street || ''}, ${authState.user.address.city || ''}, ${authState.user.address.state || ''} ${authState.user.address.zipCode || ''}`}
                    </Text>
                  </View>
                  <Button 
                    mode="text" 
                    textColor="#FF8A50" 
                    onPress={() => {
                      Alert.alert('Change Address', 'Would you like to use a different address for this donation?', [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Use Different Address', 
                          onPress: () => {
                            setFormData(prev => ({
                              ...prev,
                              pickupLocation: {
                                address: 'custom',
                                city: '',
                                state: '',
                                zipCode: '',
                              }
                            }));
                          }
                        }
                      ]);
                    }}
                  >
                    Change
                  </Button>
                </View>
              )}

              {(!authState.user?.address || typeof authState.user.address !== 'object' || formData.pickupLocation.address !== '') && (
                <>
                  <Text style={styles.label}>Street Address *</Text>
                  <TextInput
                    value={formData.pickupLocation.address}
                    onChangeText={(text) =>
                      setFormData(prev => ({
                        ...prev,
                        pickupLocation: { ...prev.pickupLocation, address: text },
                      }))
                    }
                    mode="outlined"
                    style={styles.input}
                    placeholder="E.g., 123 Main Street"
                    activeOutlineColor="#FF8A50"
                  />

                  <View style={styles.addressRow}>
                    <TextInput
                      label="City *"
                      value={formData.pickupLocation.city}
                      onChangeText={(text) =>
                        setFormData(prev => ({
                          ...prev,
                          pickupLocation: { ...prev.pickupLocation, city: text },
                        }))
                      }
                      mode="outlined"
                      style={[styles.input, styles.addressInput]}
                      activeOutlineColor="#FF8A50"
                    />
                    <TextInput
                      label="State *"
                      value={formData.pickupLocation.state}
                      onChangeText={(text) =>
                        setFormData(prev => ({
                          ...prev,
                          pickupLocation: { ...prev.pickupLocation, state: text },
                        }))
                      }
                      mode="outlined"
                      style={[styles.input, styles.addressInput]}
                      activeOutlineColor="#FF8A50"
                    />
                  </View>

                  <TextInput
                    label="ZIP Code *"
                    value={formData.pickupLocation.zipCode}
                    onChangeText={(text) =>
                      setFormData(prev => ({
                        ...prev,
                        pickupLocation: { ...prev.pickupLocation, zipCode: text },
                      }))
                    }
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                    activeOutlineColor="#FF8A50"
                  />
                </>
              )}

              {/* Special Instructions */}
              <Text style={styles.label}>Pickup Instructions (Optional)</Text>
              <TextInput
                value={formData.pickupSchedule.specialInstructions}
                onChangeText={(text) =>
                  setFormData(prev => ({
                    ...prev,
                    pickupSchedule: {
                      ...prev.pickupSchedule,
                      specialInstructions: text,
                    },
                  }))
                }
                mode="outlined"
                multiline
                numberOfLines={2}
                style={styles.textArea}
                placeholder="E.g., Use back entrance, ring bell..."
                activeOutlineColor="#FF8A50"
              />
            </View>

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
  addressInput: {
    flex: 1,
    marginRight: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
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
  stepContainer: {
    marginBottom: 32,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF8A50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 16,
    marginLeft: 44,
  },
  templateScroll: {
    marginTop: 8,
  },
  templateCard: {
    width: 120,
    height: 100,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    padding: 12,
  },
  templateCardSelected: {
    borderColor: '#FF8A50',
    backgroundColor: '#FFF5F0',
  },
  templateIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  templateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 80,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  segmentButton: {
    borderColor: '#FF8A50',
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
  quantityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  quantityCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'center',
  },
  quantityCardSelected: {
    borderColor: '#FF8A50',
    backgroundColor: '#FFF5F0',
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  quantityLabelSelected: {
    color: '#FF8A50',
  },
  quantityServings: {
    fontSize: 12,
    color: '#718096',
  },
  quantityServingsSelected: {
    color: '#FF8A50',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  allergenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  allergenCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  allergenCardSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFF9E6',
  },
  allergenIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  allergenLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
  },
  allergenLabelSelected: {
    color: '#F59E0B',
  },
  storageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  storageCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'center',
  },
  storageCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  storageIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  storageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
  },
  storageLabelSelected: {
    color: '#3B82F6',
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
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingRight: 16,
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  urgencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  urgencyCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'center',
  },
  urgencyIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  urgencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  urgencyDesc: {
    fontSize: 11,
    color: '#718096',
  },
  savedAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
    padding: 12,
    marginBottom: 16,
  },
  savedAddressContent: {
    flex: 1,
  },
  savedAddressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  savedAddressText: {
    fontSize: 13,
    color: '#2D3748',
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