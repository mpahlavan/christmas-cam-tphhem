
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface FrameOverlayProps {
  imageWidth: number;
  imageHeight: number;
}

export const FrameOverlay: React.FC<FrameOverlayProps> = ({ imageWidth, imageHeight }) => {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* Top border with decorations */}
      <View style={[styles.border, styles.topBorder]}>
        <Text style={styles.decoration}>🎄</Text>
        <Text style={styles.decoration}>⭐</Text>
        <Text style={styles.decoration}>🎁</Text>
        <Text style={styles.decoration}>🎄</Text>
      </View>

      {/* Bottom border with decorations */}
      <View style={[styles.border, styles.bottomBorder]}>
        <Text style={styles.decoration}>🎅</Text>
        <Text style={styles.decoration}>❄️</Text>
        <Text style={styles.decoration}>🔔</Text>
        <Text style={styles.decoration}>🎅</Text>
      </View>

      {/* Left border */}
      <View style={[styles.border, styles.leftBorder]}>
        <Text style={styles.decorationVertical}>🎄</Text>
        <Text style={styles.decorationVertical}>⭐</Text>
        <Text style={styles.decorationVertical}>🎁</Text>
      </View>

      {/* Right border */}
      <View style={[styles.border, styles.rightBorder]}>
        <Text style={styles.decorationVertical}>🎄</Text>
        <Text style={styles.decorationVertical}>⭐</Text>
        <Text style={styles.decorationVertical}>🎁</Text>
      </View>

      {/* Corner decorations */}
      <Text style={[styles.corner, styles.topLeft]}>🎄</Text>
      <Text style={[styles.corner, styles.topRight]}>🎄</Text>
      <Text style={[styles.corner, styles.bottomLeft]}>🎁</Text>
      <Text style={[styles.corner, styles.bottomRight]}>🎁</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  border: {
    position: 'absolute',
    backgroundColor: '#165B33',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  topBorder: {
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  bottomBorder: {
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    borderTopWidth: 2,
    borderTopColor: '#FFD700',
  },
  leftBorder: {
    top: 40,
    bottom: 40,
    left: 0,
    width: 40,
    flexDirection: 'column',
    borderRightWidth: 2,
    borderRightColor: '#FFD700',
  },
  rightBorder: {
    top: 40,
    bottom: 40,
    right: 0,
    width: 40,
    flexDirection: 'column',
    borderLeftWidth: 2,
    borderLeftColor: '#FFD700',
  },
  decoration: {
    fontSize: 24,
  },
  decorationVertical: {
    fontSize: 20,
  },
  corner: {
    position: 'absolute',
    fontSize: 32,
  },
  topLeft: {
    top: 4,
    left: 4,
  },
  topRight: {
    top: 4,
    right: 4,
  },
  bottomLeft: {
    bottom: 4,
    left: 4,
  },
  bottomRight: {
    bottom: 4,
    right: 4,
  },
});
