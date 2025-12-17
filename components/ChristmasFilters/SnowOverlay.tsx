
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

interface Snowflake {
  id: number;
  x: number;
  animatedValue: Animated.Value;
  size: number;
  speed: number;
}

export const SnowOverlay: React.FC = () => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    // Create 20 snowflakes
    const flakes: Snowflake[] = [];
    for (let i = 0; i < 20; i++) {
      const animatedValue = new Animated.Value(0);
      flakes.push({
        id: i,
        x: Math.random() * width,
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
  }, [width]);

  return (
    <View style={styles.container} pointerEvents="none">
      {snowflakes.map((flake) => {
        const translateY = flake.animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, height + 20],
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
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  snowflake: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 100,
    opacity: 0.8,
  },
});
