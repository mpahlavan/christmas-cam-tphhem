
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { SnowOverlay } from '@/components/ChristmasFilters/SnowOverlay';
import { SantaHatOverlay } from '@/components/ChristmasFilters/SantaHatOverlay';
import { LightsOverlay } from '@/components/ChristmasFilters/LightsOverlay';
import { FrameOverlay } from '@/components/ChristmasFilters/FrameOverlay';

type ChristmasFilter = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

const christmasFilters: ChristmasFilter[] = [
  { id: 'snow', name: 'Snow', icon: '❄️', description: 'Add falling snow' },
  { id: 'santa', name: 'Santa Hat', icon: '🎅', description: 'Add Santa hat' },
  { id: 'lights', name: 'Lights', icon: '✨', description: 'Add festive lights' },
  { id: 'frame', name: 'Frame', icon: '🎄', description: 'Christmas frame' },
];

export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const requestPermissions = async () => {
    console.log('Requesting camera permissions...');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    console.log('Taking photo...');
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.log('Camera permission denied');
      return;
    }

    try {
      setLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        console.log('Photo captured:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    console.log('Picking image from library...');
    try {
      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        console.log('Image selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filterId: string) => {
    console.log('Toggling filter:', filterId);
    setSelectedFilters((prev) => {
      if (prev.includes(filterId)) {
        // Remove filter
        return prev.filter((id) => id !== filterId);
      } else {
        // Add filter
        return [...prev, filterId];
      }
    });
  };

  const resetImage = () => {
    console.log('Resetting image');
    setImageUri(null);
    setSelectedFilters([]);
  };

  const shareImage = async () => {
    console.log('Sharing image');
    if (!imageUri) {
      console.log('No image to share');
      return;
    }

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(imageUri, {
          dialogTitle: 'Share your Christmas photo!',
        });
      } else {
        Alert.alert(
          'Sharing Not Available',
          'Sharing is not available on this device.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert('Error', 'Failed to share image. Please try again.');
    }
  };

  const handleImageLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    console.log('Image layout:', width, height);
    setImageSize({ width, height });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>🎄 Christmas Cam 🎄</Text>
        <Text style={styles.subtitle}>
          Add festive Christmas style to your photos!
        </Text>
      </View>

      {!imageUri ? (
        <View style={styles.emptyState}>
          <View style={styles.iconContainer}>
            <IconSymbol
              ios_icon_name="camera.fill"
              android_material_icon_name="photo_camera"
              size={80}
              color={colors.primary}
            />
          </View>
          <Text style={styles.emptyText}>
            Take a photo or choose from your gallery
          </Text>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={takePhoto}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.card} />
              ) : (
                <React.Fragment>
                  <IconSymbol
                    ios_icon_name="camera.fill"
                    android_material_icon_name="photo_camera"
                    size={24}
                    color={colors.card}
                  />
                  <Text style={styles.buttonText}>Take Photo</Text>
                </React.Fragment>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={pickImage}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.card} />
              ) : (
                <React.Fragment>
                  <IconSymbol
                    ios_icon_name="photo.fill"
                    android_material_icon_name="photo_library"
                    size={24}
                    color={colors.card}
                  />
                  <Text style={styles.buttonText}>Choose Photo</Text>
                </React.Fragment>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper} onLayout={handleImageLayout}>
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
            
            {/* Apply selected filters as overlays */}
            {selectedFilters.includes('frame') && imageSize.width > 0 && (
              <FrameOverlay imageWidth={imageSize.width} imageHeight={imageSize.height} />
            )}
            
            {selectedFilters.includes('santa') && imageSize.width > 0 && (
              <SantaHatOverlay imageWidth={imageSize.width} imageHeight={imageSize.height} />
            )}
            
            {selectedFilters.includes('lights') && imageSize.width > 0 && (
              <LightsOverlay imageWidth={imageSize.width} imageHeight={imageSize.height} />
            )}
            
            {selectedFilters.includes('snow') && (
              <SnowOverlay />
            )}
          </View>

          <View style={styles.filtersSection}>
            <Text style={styles.sectionTitle}>Choose Christmas Styles (tap to toggle)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContainer}
            >
              {christmasFilters.map((filter, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.filterCard,
                    selectedFilters.includes(filter.id) && styles.filterCardSelected,
                  ]}
                  onPress={() => toggleFilter(filter.id)}
                >
                  <Text style={styles.filterIcon}>{filter.icon}</Text>
                  <Text style={styles.filterName}>{filter.name}</Text>
                  {selectedFilters.includes(filter.id) && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.accentButton]}
              onPress={shareImage}
            >
              <IconSymbol
                ios_icon_name="square.and.arrow.up.fill"
                android_material_icon_name="share"
                size={24}
                color={colors.text}
              />
              <Text style={[styles.buttonText, { color: colors.text }]}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={resetImage}
            >
              <IconSymbol
                ios_icon_name="arrow.counterclockwise"
                android_material_icon_name="refresh"
                size={24}
                color={colors.card}
              />
              <Text style={styles.buttonText}>New Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🎅 Make your holidays magical! 🎁
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  accentButton: {
    backgroundColor: colors.accent,
    flex: 1,
  },
  resetButton: {
    backgroundColor: colors.primary,
    flex: 1,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.card,
  },
  imageContainer: {
    width: '100%',
  },
  imageWrapper: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
    marginBottom: 20,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    elevation: 5,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  filtersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  filtersContainer: {
    gap: 12,
    paddingVertical: 4,
  },
  filterCard: {
    width: 100,
    height: 100,
    backgroundColor: colors.card,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.highlight,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
    position: 'relative',
  },
  filterCardSelected: {
    borderColor: colors.primary,
    borderWidth: 3,
    backgroundColor: colors.highlight,
  },
  filterIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  filterName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
