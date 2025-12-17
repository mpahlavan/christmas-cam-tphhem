
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
    
    // Create 20 snowflakes
    const flakes: Snowflake[] = [];
    for (let i = 0; i < 20; i++) {
      const animatedValue = new Animated.Value(0);
      flakes.push({
        id: i,
        x: Math.random() * imageWidth,
        animatedValue,
        size: Math.random() * 8 + 4,
        speed: Math.random() * 3000 + 2000,
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
    return null;
  }

  return (
    <View style={[styles.container, { width: imageWidth, height: imageHeight }]} pointerEvents="none">
      {snowflakes.map((flake) => {
        const translateY = flake.animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, imageHeight + 20],
        });

        const translateX = flake.animatedValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 20, 0],
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
    overflow: 'hidden',
  },
  snowflake: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 100,
    opacity: 0.8,
  },
});
