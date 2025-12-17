
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
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

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
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const applyFilter = (filterId: string) => {
    console.log('Applying filter:', filterId);
    setSelectedFilter(filterId);
    Alert.alert(
      'Filter Applied!',
      `${christmasFilters.find(f => f.id === filterId)?.name} filter has been applied to your photo!`,
      [{ text: 'OK' }]
    );
  };

  const resetImage = () => {
    console.log('Resetting image');
    setImageUri(null);
    setSelectedFilter(null);
  };

  const shareImage = () => {
    console.log('Sharing image');
    Alert.alert(
      'Share Photo',
      'Your Christmas photo is ready to share!',
      [{ text: 'OK' }]
    );
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
          <View style={styles.imageWrapper}>
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
            {selectedFilter && (
              <View style={styles.filterOverlay}>
                <Text style={styles.filterText}>
                  {christmasFilters.find(f => f.id === selectedFilter)?.icon}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.filtersSection}>
            <Text style={styles.sectionTitle}>Choose a Christmas Style</Text>
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
                    selectedFilter === filter.id && styles.filterCardSelected,
                  ]}
                  onPress={() => applyFilter(filter.id)}
                >
                  <Text style={styles.filterIcon}>{filter.icon}</Text>
                  <Text style={styles.filterName}>{filter.name}</Text>
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
  filterOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 30,
    padding: 8,
  },
  filterText: {
    fontSize: 32,
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
