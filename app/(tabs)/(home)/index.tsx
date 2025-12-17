
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { SnowOverlay } from '@/components/ChristmasFilters/SnowOverlay';
import { SantaHatOverlay } from '@/components/ChristmasFilters/SantaHatOverlay';
import { LightsOverlay } from '@/components/ChristmasFilters/LightsOverlay';
import { FrameOverlay } from '@/components/ChristmasFilters/FrameOverlay';
import { useChristmasTransform } from '@/hooks/useChristmasTransform';

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

const CONTAINER_HEIGHT = 400;

export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [transformedImageUri, setTransformedImageUri] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [containerWidth, setContainerWidth] = useState(0);
  const [originalImageSize, setOriginalImageSize] = useState({ width: 0, height: 0 });
  const [imageError, setImageError] = useState(false);
  const [useAiTransform, setUseAiTransform] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const { transform, loading: transforming, error: transformError } = useChristmasTransform();

  const requestPermissions = async () => {
    console.log('Requesting camera permissions...');
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Camera permission status:', status);
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      Alert.alert('Error', 'Failed to request camera permissions.');
      return false;
    }
  };

  const calculateDisplayedImageSize = (
    originalWidth: number,
    originalHeight: number,
    containerWidth: number,
    containerHeight: number
  ) => {
    const imageAspectRatio = originalWidth / originalHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let displayWidth, displayHeight;

    if (imageAspectRatio > containerAspectRatio) {
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspectRatio;
    } else {
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageAspectRatio;
    }

    console.log('Calculated display size:', { displayWidth, displayHeight });
    return { width: displayWidth, height: displayHeight };
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
      setImageError(false);
      
      console.log('Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      console.log('Camera result:', JSON.stringify(result, null, 2));

      if (result.canceled) {
        console.log('User canceled camera');
        setLoading(false);
        return;
      }

      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        const asset = result.assets[0];
        const uri = asset.uri;
        console.log('Photo captured successfully:', uri);
        console.log('Original image dimensions:', asset.width, asset.height);
        console.log('Base64 available:', !!asset.base64);

        setImageUri(uri);
        setImageBase64(asset.base64 || null);
        setTransformedImageUri(null);
        setOriginalImageSize({ width: asset.width, height: asset.height });
        setSelectedFilters([]);
        setImageSize({ width: 0, height: 0 });
        setUseAiTransform(false);
        setShowPreview(true);
      } else {
        console.error('No image URI in result:', result);
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', `Failed to take photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setImageError(true);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    console.log('Picking image from library...');
    try {
      setLoading(true);
      setImageError(false);
      
      console.log('Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      console.log('Image picker result:', JSON.stringify(result, null, 2));

      if (result.canceled) {
        console.log('User canceled image picker');
        setLoading(false);
        return;
      }

      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        const asset = result.assets[0];
        const uri = asset.uri;
        console.log('Image selected successfully:', uri);
        console.log('Original image dimensions:', asset.width, asset.height);
        console.log('Base64 available:', !!asset.base64);

        setImageUri(uri);
        setImageBase64(asset.base64 || null);
        setTransformedImageUri(null);
        setOriginalImageSize({ width: asset.width, height: asset.height });
        setSelectedFilters([]);
        setImageSize({ width: 0, height: 0 });
        setUseAiTransform(false);
        setShowPreview(true);
      } else {
        console.error('No image URI in result:', result);
        Alert.alert('Error', 'Failed to select image. Please try again.');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', `Failed to pick image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setImageError(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filterId: string) => {
    console.log('Toggling filter:', filterId);
    setSelectedFilters((prev) => {
      if (prev.includes(filterId)) {
        return prev.filter((id) => id !== filterId);
      } else {
        return [...prev, filterId];
      }
    });
  };

  const applyAiTransform = async () => {
    if (!imageUri || !imageBase64) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    if (selectedFilters.length === 0) {
      Alert.alert('Info', 'Please select at least one Christmas filter to apply');
      return;
    }

    console.log('Applying AI transform with filters:', selectedFilters);
    const result = await transform({
      imageUri,
      imageBase64,
      filters: selectedFilters,
    });

    if (result) {
      console.log('Transform successful, new image URL:', result.url);
      setTransformedImageUri(result.url);
      setUseAiTransform(true);
      setShowPreview(false);
      Alert.alert(
        'Success! 🎄',
        `Your Christmas transformation is ready! Took ${(result.duration_ms / 1000).toFixed(1)} seconds.`,
        [{ text: 'Awesome!' }]
      );
    } else if (transformError) {
      console.error('Transform failed:', transformError);
      Alert.alert(
        'Transform Failed',
        transformError || 'Failed to apply Christmas transformation. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const resetImage = () => {
    console.log('Resetting image');
    setImageUri(null);
    setImageBase64(null);
    setTransformedImageUri(null);
    setSelectedFilters([]);
    setImageSize({ width: 0, height: 0 });
    setOriginalImageSize({ width: 0, height: 0 });
    setContainerWidth(0);
    setImageError(false);
    setUseAiTransform(false);
    setShowPreview(true);
  };

  const shareImage = async () => {
    console.log('Sharing image');
    const imageToShare = transformedImageUri || imageUri;
    if (!imageToShare) {
      console.log('No image to share');
      return;
    }

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(imageToShare, {
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
    const { width } = event.nativeEvent.layout;
    console.log('Container layout width:', width);
    
    if (width > 0 && originalImageSize.width > 0 && originalImageSize.height > 0) {
      setContainerWidth(width);
      const displaySize = calculateDisplayedImageSize(
        originalImageSize.width,
        originalImageSize.height,
        width,
        CONTAINER_HEIGHT
      );
      console.log('Setting image size:', displaySize);
      setImageSize(displaySize);
    }
  };

  const handleImageError = (error: any) => {
    console.error('Image loading error:', error);
    setImageError(true);
    Alert.alert('Error', 'Failed to load image. Please try selecting a different photo.');
  };

  const handleImageLoad = (event: any) => {
    console.log('Image loaded successfully');
    setImageError(false);
  };

  const displayImageUri = transformedImageUri || imageUri;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>🎄 Christmas Cam 🎄</Text>
        <Text style={styles.subtitle}>
          Transform your photos with AI-powered Christmas magic!
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
          <Text style={styles.emptySubtext}>
            Then select Christmas effects and let AI work its magic! ✨
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

          <View style={styles.infoBox}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.infoText}>
              Powered by Meshy AI - Real AI transformations, not just overlays!
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper} onLayout={handleImageLayout}>
            {imageError ? (
              <View style={styles.errorContainer}>
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle.fill"
                  android_material_icon_name="error"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={styles.errorText}>Failed to load image</Text>
                <Text style={styles.errorSubtext}>
                  The image might be corrupted or in an unsupported format.
                </Text>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton, { marginTop: 16 }]}
                  onPress={resetImage}
                >
                  <Text style={styles.buttonText}>Try Another Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <React.Fragment>
                <Image
                  source={{ uri: displayImageUri }}
                  style={styles.image}
                  resizeMode="contain"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
                
                {showPreview && !useAiTransform && imageSize.width > 0 && imageSize.height > 0 && (
                  <View 
                    style={[
                      styles.overlaysContainer,
                      {
                        width: imageSize.width,
                        height: imageSize.height,
                        left: (containerWidth - imageSize.width) / 2,
                        top: (CONTAINER_HEIGHT - imageSize.height) / 2,
                      }
                    ]}
                  >
                    {selectedFilters.includes('frame') && (
                      <FrameOverlay imageWidth={imageSize.width} imageHeight={imageSize.height} />
                    )}
                    
                    {selectedFilters.includes('santa') && (
                      <SantaHatOverlay imageWidth={imageSize.width} imageHeight={imageSize.height} />
                    )}
                    
                    {selectedFilters.includes('lights') && (
                      <LightsOverlay imageWidth={imageSize.width} imageHeight={imageSize.height} />
                    )}
                    
                    {selectedFilters.includes('snow') && (
                      <SnowOverlay imageWidth={imageSize.width} imageHeight={imageSize.height} />
                    )}

                    <View style={styles.previewBadge}>
                      <Text style={styles.previewBadgeText}>Preview</Text>
                    </View>
                  </View>
                )}

                {transforming && (
                  <View style={styles.transformingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.transformingText}>
                      ✨ AI is working its magic... ✨
                    </Text>
                    <Text style={styles.transformingSubtext}>
                      This may take 30-60 seconds
                    </Text>
                  </View>
                )}

                {useAiTransform && transformedImageUri && (
                  <View style={styles.successBadge}>
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check_circle"
                      size={20}
                      color="#10B981"
                    />
                    <Text style={styles.successBadgeText}>AI Transformed!</Text>
                  </View>
                )}
              </React.Fragment>
            )}
          </View>

          {!imageError && (
            <React.Fragment>
              <View style={styles.filtersSection}>
                <Text style={styles.sectionTitle}>Choose Christmas Styles</Text>
                <Text style={styles.sectionSubtitle}>
                  {useAiTransform 
                    ? 'Select new effects to transform again'
                    : 'Select effects and tap "Apply AI Transform"'}
                </Text>
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
                      onPress={() => {
                        toggleFilter(filter.id);
                        if (!useAiTransform) {
                          setShowPreview(true);
                        }
                      }}
                      disabled={transforming}
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

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.transformButton,
                  (transforming || selectedFilters.length === 0) && styles.buttonDisabled,
                ]}
                onPress={applyAiTransform}
                disabled={transforming || selectedFilters.length === 0}
              >
                {transforming ? (
                  <React.Fragment>
                    <ActivityIndicator color={colors.card} />
                    <Text style={styles.buttonText}>Transforming...</Text>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <IconSymbol
                      ios_icon_name="wand.and.stars"
                      android_material_icon_name="auto_fix_high"
                      size={24}
                      color={colors.card}
                    />
                    <Text style={styles.buttonText}>
                      {useAiTransform ? 'Transform Again' : 'Apply AI Transform'}
                    </Text>
                  </React.Fragment>
                )}
              </TouchableOpacity>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.accentButton]}
                  onPress={shareImage}
                  disabled={transforming}
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
                  disabled={transforming}
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
            </React.Fragment>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🎅 Make your holidays magical with AI! 🎁
        </Text>
        <Text style={styles.footerSubtext}>
          Powered by Meshy AI
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
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
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
  transformButton: {
    backgroundColor: '#9333EA',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.card,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },
  imageContainer: {
    width: '100%',
  },
  imageWrapper: {
    width: '100%',
    height: CONTAINER_HEIGHT,
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
    zIndex: 1,
  },
  overlaysContainer: {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 10,
  },
  previewBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  previewBadgeText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '600',
  },
  successBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 15,
  },
  successBadgeText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
  },
  transformingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  transformingText: {
    color: colors.card,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  transformingSubtext: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  filtersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
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
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
