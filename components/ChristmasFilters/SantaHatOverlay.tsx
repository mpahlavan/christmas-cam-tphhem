
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';

interface SantaHatOverlayProps {
  imageWidth: number;
  imageHeight: number;
}

export const SantaHatOverlay: React.FC<SantaHatOverlayProps> = ({ imageWidth, imageHeight }) => {
  // Position the hat at the top center of the image
  const hatWidth = imageWidth * 0.4;
  const hatHeight = imageHeight * 0.3;
  const hatLeft = (imageWidth - hatWidth) / 2;
  const hatTop = imageHeight * 0.05;

  return (
    <View style={[styles.container, { left: hatLeft, top: hatTop, width: hatWidth, height: hatHeight }]} pointerEvents="none">
      <Svg width={hatWidth} height={hatHeight} viewBox="0 0 100 100">
        {/* Hat body - red triangle */}
        <Path
          d="M 50 10 L 20 70 L 80 70 Z"
          fill="#DC143C"
          stroke="#8B0000"
          strokeWidth="1"
        />
        
        {/* White fur trim at bottom */}
        <Ellipse
          cx="50"
          cy="70"
          rx="32"
          ry="8"
          fill="white"
        />
        
        {/* White pom-pom at top */}
        <Ellipse
          cx="50"
          cy="10"
          rx="10"
          ry="10"
          fill="white"
        />
        
        {/* Shadow/depth on hat */}
        <Path
          d="M 50 10 L 20 70 L 35 70 Z"
          fill="#B22222"
          opacity="0.3"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});
