import { Linking, Platform, Alert } from 'react-native';

export class NavigationService {
  /**
   * Opens maps app with navigation to the specified address
   */
  static openMaps(address: string, label?: string): void {
    const encodedAddress = encodeURIComponent(address);
    const encodedLabel = label ? encodeURIComponent(label) : '';
    
    if (Platform.OS === 'ios') {
      // Try Apple Maps first
      const appleUrl = `maps://app?daddr=${encodedAddress}&dirflg=d`;
      Linking.canOpenURL(appleUrl).then(supported => {
        if (supported) {
          Linking.openURL(appleUrl);
        } else {
          // Fallback to Google Maps web
          this.openGoogleMapsWeb(encodedAddress, encodedLabel);
        }
      }).catch(() => {
        this.openGoogleMapsWeb(encodedAddress, encodedLabel);
      });
    } else {
      // Try Google Maps app first
      const googleUrl = `google.navigation:q=${encodedAddress}`;
      Linking.canOpenURL(googleUrl).then(supported => {
        if (supported) {
          Linking.openURL(googleUrl);
        } else {
          // Fallback to Google Maps web
          this.openGoogleMapsWeb(encodedAddress, encodedLabel);
        }
      }).catch(() => {
        this.openGoogleMapsWeb(encodedAddress, encodedLabel);
      });
    }
  }

  /**
   * Opens Google Maps in web browser as fallback
   */
  private static openGoogleMapsWeb(encodedAddress: string, encodedLabel: string): void {
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}${encodedLabel ? `&destination_place_id=${encodedLabel}` : ''}`;
    Linking.openURL(webUrl).catch(err => {
      console.error('Error opening maps:', err);
      Alert.alert('Error', 'Could not open maps application');
    });
  }

  /**
   * Initiates a phone call to the specified number
   */
  static makePhoneCall(phoneNumber: string): void {
    // Clean phone number (remove spaces, dashes, etc.)
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    const url = `tel:${cleanNumber}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Phone calls are not supported on this device');
      }
    }).catch(err => {
      console.error('Error making phone call:', err);
      Alert.alert('Error', 'Could not initiate phone call');
    });
  }

  /**
   * Opens SMS app with pre-filled message
   */
  static sendSMS(phoneNumber: string, message?: string): void {
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    const encodedMessage = message ? encodeURIComponent(message) : '';
    const url = `sms:${cleanNumber}${message ? `?body=${encodedMessage}` : ''}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'SMS is not supported on this device');
      }
    }).catch(err => {
      console.error('Error sending SMS:', err);
      Alert.alert('Error', 'Could not open SMS application');
    });
  }

  /**
   * Opens email app with pre-filled content
   */
  static sendEmail(email: string, subject?: string, body?: string): void {
    const encodedSubject = subject ? encodeURIComponent(subject) : '';
    const encodedBody = body ? encodeURIComponent(body) : '';
    
    let url = `mailto:${email}`;
    const params = [];
    
    if (subject) params.push(`subject=${encodedSubject}`);
    if (body) params.push(`body=${encodedBody}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Email is not supported on this device');
      }
    }).catch(err => {
      console.error('Error sending email:', err);
      Alert.alert('Error', 'Could not open email application');
    });
  }

  /**
   * Gets estimated travel time between two addresses (mock implementation)
   * In a real app, this would use Google Maps API or similar
   */
  static async getEstimatedTravelTime(from: string, to: string): Promise<string> {
    // Mock implementation - in reality, you'd call Google Maps API
    const mockTimes = ['15 mins', '20 mins', '25 mins', '30 mins', '35 mins'];
    const randomTime = mockTimes[Math.floor(Math.random() * mockTimes.length)];
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return randomTime;
  }

  /**
   * Calculates distance between two addresses (mock implementation)
   */
  static async getDistance(from: string, to: string): Promise<string> {
    // Mock implementation
    const mockDistances = ['1.2 km', '2.5 km', '3.8 km', '4.1 km', '5.3 km'];
    const randomDistance = mockDistances[Math.floor(Math.random() * mockDistances.length)];
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return randomDistance;
  }
}
