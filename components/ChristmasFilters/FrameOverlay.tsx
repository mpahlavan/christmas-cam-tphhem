
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface FrameOverlayProps {
  imageWidth: number;
  imageHeight: number;
}

export const FrameOverlay: React.FC<FrameOverlayProps> = ({ imageWidth, imageHeight }) => {
  if (imageWidth === 0 || imageHeight === 0) {
    console.log('FrameOverlay: Not rendering, dimensions are 0');
    return null;
  }

  console.log('FrameOverlay: Rendering for dimensions:', imageWidth, imageHeight);

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
    zIndex: 1,
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
    height: 45,
    borderBottomWidth: 3,
    borderBottomColor: '#FFD700',
  },
  bottomBorder: {
    bottom: 0,
    left: 0,
    right: 0,
    height: 45,
    borderTopWidth: 3,
    borderTopColor: '#FFD700',
  },
  leftBorder: {
    top: 45,
    bottom: 45,
    left: 0,
    width: 45,
    flexDirection: 'column',
    borderRightWidth: 3,
    borderRightColor: '#FFD700',
  },
  rightBorder: {
    top: 45,
    bottom: 45,
    right: 0,
    width: 45,
    flexDirection: 'column',
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  decoration: {
    fontSize: 26,
  },
  decorationVertical: {
    fontSize: 22,
  },
  corner: {
    position: 'absolute',
    fontSize: 36,
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
