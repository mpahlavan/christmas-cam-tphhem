
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SnowOverlayProps {
  imageWidth: number;
  imageHeight: number;
}

interface Snowflake {
  id: number;
  x: number;
  animatedValue: Animated.Value;
  size: number;
  speed: number;
}

export const SnowOverlay: React.FC<SnowOverlayProps> = ({ imageWidth, imageHeight }) => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    if (imageWidth === 0 || imageHeight === 0) {
      console.log('SnowOverlay: Invalid dimensions, skipping animation');
      return;
    }

    console.log('SnowOverlay: Creating snowflakes for dimensions:', imageWidth, imageHeight);
    
    // Create 25 snowflakes for better visibility
    const flakes: Snowflake[] = [];
    for (let i = 0; i < 25; i++) {
      const animatedValue = new Animated.Value(Math.random());
      flakes.push({
        id: i,
        x: Math.random() * imageWidth,
        animatedValue,
        size: Math.random() * 10 + 6,
        speed: Math.random() * 4000 + 3000,
      });

      // Animate each snowflake
      Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: flakes[i].speed,
          useNativeDriver: true,
        })
      ).start();
    }
    setSnowflakes(flakes);

    // Cleanup function to stop animations
    return () => {
      flakes.forEach(flake => {
        flake.animatedValue.stopAnimation();
      });
    };
  }, [imageWidth, imageHeight]);

  if (imageWidth === 0 || imageHeight === 0) {
    console.log('SnowOverlay: Not rendering, dimensions are 0');
    return null;
  }

  console.log('SnowOverlay: Rendering with', snowflakes.length, 'snowflakes');

  return (
    <View style={[styles.container, { width: imageWidth, height: imageHeight }]} pointerEvents="none">
      {snowflakes.map((flake) => {
        const translateY = flake.animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-30, imageHeight + 30],
        });

        const translateX = flake.animatedValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 30, 0],
        });

        return (
          <Animated.View
            key={flake.id}
            style={[
              styles.snowflake,
              {
                left: flake.x,
                width: flake.size,
                height: flake.size,
                transform: [{ translateY }, { translateX }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'visible',
    zIndex: 4,
  },
  snowflake: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 100,
    opacity: 0.9,
    boxShadow: '0px 0px 4px rgba(255, 255, 255, 0.8)',
    elevation: 5,
  },
});
