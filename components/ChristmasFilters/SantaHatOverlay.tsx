
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';

interface SantaHatOverlayProps {
  imageWidth: number;
  imageHeight: number;
}

export const SantaHatOverlay: React.FC<SantaHatOverlayProps> = ({ imageWidth, imageHeight }) => {
  if (imageWidth === 0 || imageHeight === 0) {
    console.log('SantaHatOverlay: Not rendering, dimensions are 0');
    return null;
  }

  console.log('SantaHatOverlay: Rendering for dimensions:', imageWidth, imageHeight);

  // Position the hat at the top center of the image
  const hatWidth = imageWidth * 0.5;
  const hatHeight = imageHeight * 0.35;
  const hatLeft = (imageWidth - hatWidth) / 2;
  const hatTop = -hatHeight * 0.15;

  return (
    <View 
      style={[
        styles.container, 
        { 
          left: hatLeft, 
          top: hatTop, 
          width: hatWidth, 
          height: hatHeight 
        }
      ]} 
      pointerEvents="none"
    >
      <Svg width={hatWidth} height={hatHeight} viewBox="0 0 100 100">
        {/* Hat body - red triangle */}
        <Path
          d="M 50 10 L 15 75 L 85 75 Z"
          fill="#DC143C"
          stroke="#8B0000"
          strokeWidth="2"
        />
        
        {/* Shadow/depth on hat */}
        <Path
          d="M 50 10 L 15 75 L 30 75 Z"
          fill="#B22222"
          opacity="0.4"
        />
        
        {/* White fur trim at bottom */}
        <Ellipse
          cx="50"
          cy="75"
          rx="37"
          ry="10"
          fill="white"
        />
        
        {/* White pom-pom at top */}
        <Ellipse
          cx="50"
          cy="10"
          rx="12"
          ry="12"
          fill="white"
        />
        
        {/* Pom-pom shadow */}
        <Ellipse
          cx="48"
          cy="10"
          rx="10"
          ry="10"
          fill="#F0F0F0"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 3,
  },
});
