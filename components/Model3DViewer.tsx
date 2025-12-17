
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface Model3DViewerProps {
  modelUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  loading?: boolean;
  autoRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
}

export function Model3DViewer({
  modelUrl,
  thumbnailUrl,
  width = 300,
  height = 400,
  backgroundColor = '#1a1a1a',
  loading = false,
  autoRotate = true,
  enableZoom = true,
  enablePan = true,
}: Model3DViewerProps) {
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showThumbnail, setShowThumbnail] = useState(!!thumbnailUrl);
  const webViewRef = useRef<WebView>(null);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>3D Model Viewer</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      overflow: hidden;
      background-color: ${backgroundColor};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #container {
      width: 100vw;
      height: 100vh;
      position: relative;
    }
    #loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 16px;
      text-align: center;
      z-index: 10;
    }
    #error {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #ff6b6b;
      font-size: 14px;
      text-align: center;
      padding: 20px;
      max-width: 80%;
      display: none;
      z-index: 10;
    }
    #controls {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      z-index: 5;
    }
    .control-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      padding: 8px 12px;
      color: white;
      font-size: 12px;
      cursor: pointer;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    .control-btn:active {
      background: rgba(255, 255, 255, 0.3);
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <div id="loading">Loading 3D Model...</div>
  <div id="error"></div>
  <div id="controls">
    <button class="control-btn" onclick="resetCamera()">Reset View</button>
    <button class="control-btn" onclick="toggleRotation()">
      <span id="rotateText">${autoRotate ? 'Stop' : 'Start'} Rotation</span>
    </button>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>

  <script>
    let scene, camera, renderer, controls, model;
    let isRotating = ${autoRotate};
    const container = document.getElementById('container');
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');

    function init() {
      try {
        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color('${backgroundColor}');

        // Camera
        camera = new THREE.PerspectiveCamera(
          45,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        camera.position.set(0, 1, 3);

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        container.appendChild(renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(5, 5, 5);
        scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-5, 3, -5);
        scene.add(directionalLight2);

        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
        scene.add(hemisphereLight);

        // Controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = ${enableZoom};
        controls.enablePan = ${enablePan};
        controls.minDistance = 1;
        controls.maxDistance = 10;
        controls.autoRotate = isRotating;
        controls.autoRotateSpeed = 2;

        // Load model
        loadModel('${modelUrl}');

        // Handle window resize
        window.addEventListener('resize', onWindowResize, false);

        // Start animation
        animate();
      } catch (err) {
        showError('Failed to initialize 3D viewer: ' + err.message);
      }
    }

    function loadModel(url) {
      const loader = new THREE.GLTFLoader();
      
      loader.load(
        url,
        function(gltf) {
          model = gltf.scene;

          // Center and scale model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;

          model.scale.multiplyScalar(scale);
          model.position.sub(center.multiplyScalar(scale));

          scene.add(model);
          loadingEl.style.display = 'none';

          // Send success message to React Native
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'loaded',
              success: true
            }));
          }
        },
        function(xhr) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          loadingEl.textContent = 'Loading 3D Model... ' + Math.round(percentComplete) + '%';
        },
        function(error) {
          console.error('Error loading model:', error);
          showError('Failed to load 3D model. Please check the URL and try again.');
          
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: error.message || 'Failed to load model'
            }));
          }
        }
      );
    }

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function resetCamera() {
      camera.position.set(0, 1, 3);
      controls.target.set(0, 0, 0);
      controls.update();
    }

    function toggleRotation() {
      isRotating = !isRotating;
      controls.autoRotate = isRotating;
      document.getElementById('rotateText').textContent = isRotating ? 'Stop Rotation' : 'Start Rotation';
    }

    function showError(message) {
      loadingEl.style.display = 'none';
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  </script>
</body>
</html>
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('3D Viewer message:', message);

      if (message.type === 'loaded') {
        setWebViewLoading(false);
        setShowThumbnail(false);
        setError(null);
      } else if (message.type === 'error') {
        setWebViewLoading(false);
        setError(message.message || 'Failed to load 3D model');
      }
    } catch (err) {
      console.error('Error parsing WebView message:', err);
    }
  };

  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setWebViewLoading(false);
    setError('Failed to load 3D viewer');
  };

  const handleLoadStart = () => {
    console.log('WebView load started');
    setWebViewLoading(true);
  };

  const handleLoadEnd = () => {
    console.log('WebView load ended');
  };

  const retryLoad = () => {
    setError(null);
    setWebViewLoading(true);
    setShowThumbnail(false);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <View style={[styles.container, { width, height }]}>
      {showThumbnail && thumbnailUrl && (
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.loadButton}
            onPress={() => setShowThumbnail(false)}
          >
            <IconSymbol
              ios_icon_name="cube"
              android_material_icon_name="view_in_ar"
              size={24}
              color={colors.card}
            />
            <Text style={styles.loadButtonText}>Load 3D Model</Text>
          </TouchableOpacity>
        </View>
      )}

      {!showThumbnail && (
        <React.Fragment>
          {Platform.OS === 'web' ? (
            <View style={styles.webNotSupported}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="warning"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.webNotSupportedText}>
                3D Model Viewer is not supported on web
              </Text>
              <Text style={styles.webNotSupportedSubtext}>
                Please use the mobile app to view 3D models
              </Text>
            </View>
          ) : (
            <React.Fragment>
              <WebView
                ref={webViewRef}
                source={{ html }}
                style={styles.webview}
                onMessage={handleWebViewMessage}
                onError={handleWebViewError}
                onLoadStart={handleLoadStart}
                onLoadEnd={handleLoadEnd}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                originWhitelist={['*']}
                mixedContentMode="always"
                androidLayerType="hardware"
              />

              {(loading || webViewLoading) && !error && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading 3D Model...</Text>
                </View>
              )}

              {error && (
                <View style={styles.errorOverlay}>
                  <IconSymbol
                    ios_icon_name="exclamationmark.triangle.fill"
                    android_material_icon_name="error"
                    size={48}
                    color="#ff6b6b"
                  />
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={retryLoad}>
                    <IconSymbol
                      ios_icon_name="arrow.clockwise"
                      android_material_icon_name="refresh"
                      size={20}
                      color={colors.card}
                    />
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}
            </React.Fragment>
          )}
        </React.Fragment>
      )}

      <View style={styles.badge}>
        <IconSymbol
          ios_icon_name="cube.fill"
          android_material_icon_name="view_in_ar"
          size={16}
          color={colors.card}
        />
        <Text style={styles.badgeText}>3D View</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  thumbnailContainer: {
    flex: 1,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  loadButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -25 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  retryButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
  },
  webNotSupported: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.card,
  },
  webNotSupportedText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginTop: 12,
  },
  webNotSupportedSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 5,
  },
  badgeText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '600',
  },
});
