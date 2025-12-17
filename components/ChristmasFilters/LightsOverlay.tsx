
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
    if (imageWidth === 0 || imageHeight === 0) {
      console.log('LightsOverlay: Invalid dimensions, skipping');
      return;
    }

    console.log('LightsOverlay: Creating lights for dimensions:', imageWidth, imageHeight);

    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'];
    const lightsList: Light[] = [];

    // Create lights along the top edge
    const numLights = 10;
    for (let i = 0; i < numLights; i++) {
      const animatedValue = new Animated.Value(0);
      lightsList.push({
        id: i,
        x: (imageWidth / (numLights + 1)) * (i + 1),
        y: 15,
        color: colors[i % colors.length],
        animatedValue,
      });

      // Animate blinking with staggered start
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 0.3,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, i * 100);
    }

    setLights(lightsList);

    return () => {
      lightsList.forEach(light => {
        light.animatedValue.stopAnimation();
      });
    };
  }, [imageWidth, imageHeight]);

  if (imageWidth === 0 || imageHeight === 0) {
    console.log('LightsOverlay: Not rendering, dimensions are 0');
    return null;
  }

  console.log('LightsOverlay: Rendering with', lights.length, 'lights');

  return (
    <View style={styles.container} pointerEvents="none">
      {lights.map((light) => (
        <Animated.View
          key={light.id}
          style={[
            styles.light,
            {
              left: light.x - 10,
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
    zIndex: 2,
  },
  light: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    boxShadow: '0px 0px 15px rgba(255, 255, 255, 0.9)',
    elevation: 8,
  },
});
