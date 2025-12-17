
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface Light {
  id: number;
  x: number;
  y: number;
  color: string;
  animatedValue: Animated.Value;
}

interface LightsOverlayProps {
  imageWidth: number;
  imageHeight: number;
}

export const LightsOverlay: React.FC<LightsOverlayProps> = ({ imageWidth, imageHeight }) => {
  const [lights, setLights] = useState<Light[]>([]);

  useEffect(() => {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
    const lightsList: Light[] = [];

    // Create lights along the top edge
    const numLights = 8;
    for (let i = 0; i < numLights; i++) {
      const animatedValue = new Animated.Value(0);
      lightsList.push({
        id: i,
        x: (imageWidth / (numLights - 1)) * i,
        y: 10,
        color: colors[i % colors.length],
        animatedValue,
      });

      // Animate blinking
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    setLights(lightsList);
  }, [imageWidth]);

  return (
    <View style={styles.container} pointerEvents="none">
      {lights.map((light) => (
        <Animated.View
          key={light.id}
          style={[
            styles.light,
            {
              left: light.x - 8,
              top: light.y,
              backgroundColor: light.color,
              opacity: light.animatedValue,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  light: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    boxShadow: '0px 0px 10px rgba(255, 255, 255, 0.8)',
    elevation: 5,
  },
});
