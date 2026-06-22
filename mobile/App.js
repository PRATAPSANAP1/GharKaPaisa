import React, { useRef, useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Platform, ActivityIndicator, View, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';

// 🌐 CONNECTION CONFIGURATION
// Since you want the App and Website to be perfectly connected:
// 1. In Development: It points to your local website dev server so changes sync instantly.
// 2. In Production: It points to your live deployed website.
// NOTE: Make sure to run your website using "npm run dev -- --host" so the mobile app can reach it!

const LOCAL_IP = '10.238.72.76'; // Your computer's current local IP
const LOCAL_WEBSITE_URL = `http://${LOCAL_IP}:5173`; 
const PROD_WEBSITE_URL = 'https://gharkapaisa.in'; 

const WEBSITE_URL = __DEV__ ? LOCAL_WEBSITE_URL : PROD_WEBSITE_URL;

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const onBackPress = () => {
      if (webViewRef.current && canGoBack) {
        webViewRef.current.goBack();
        return true; // Prevents default behavior (exiting the app)
      }
      return false; // Uses default behavior
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    };
  }, [canGoBack]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <WebView 
        ref={webViewRef}
        source={{ uri: WEBSITE_URL }} 
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
        }}
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#003B8F" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  }
});
