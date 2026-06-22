import { StatusBar } from 'expo-status-bar';
import { type ComponentType, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { WebView as RawWebView, type WebViewNavigation } from 'react-native-webview';

declare const process: { env?: Record<string, string | undefined> };

const WebView = RawWebView as unknown as ComponentType<Record<string, unknown>>;
const siteUrl = process.env?.EXPO_PUBLIC_SITE_URL || 'https://kendronics.com';

export default function App() {
  const webViewRef = useRef<{ goBack: () => void } | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const handleNavigationStateChange = useCallback((navigation: WebViewNavigation) => {
    setCanGoBack(navigation.canGoBack);
  }, []);

  const handleAndroidBack = useCallback(() => {
    if (!canGoBack) return false;
    webViewRef.current?.goBack();
    return true;
  }, [canGoBack]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleAndroidBack);
    return () => subscription.remove();
  }, [handleAndroidBack]);

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="dark" />
      <WebView
        ref={webViewRef}
        source={{ uri: siteUrl }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        pullToRefreshEnabled
        startInLoadingState
        onNavigationStateChange={handleNavigationStateChange}
        onError={() => setLoadFailed(true)}
        onLoadStart={() => setLoadFailed(false)}
        onShouldStartLoadWithRequest={(request: { url: string }) => {
          const isKendronicsPage = request.url.startsWith(siteUrl) || request.url.startsWith('https://www.kendronics.com');
          if (isKendronicsPage) return true;
          void Linking.openURL(request.url);
          return false;
        }}
        renderLoading={() => (
          <View style={styles.overlay}>
            <ActivityIndicator color="#0f8f6b" />
            <Text style={styles.loadingText}>Ouverture de Kendronics</Text>
          </View>
        )}
      />
      {loadFailed ? (
        <View style={styles.errorPanel}>
          <Text style={styles.errorTitle}>Connexion indisponible</Text>
          <Text style={styles.errorText}>Verifiez votre connexion internet puis relancez l'application.</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  errorPanel: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 32,
    borderWidth: 1,
    borderColor: '#ffd5d5',
    backgroundColor: '#fff5f5',
    padding: 14,
  },
  errorTitle: {
    color: '#b42318',
    fontSize: 14,
    fontWeight: '900',
  },
  errorText: {
    marginTop: 4,
    color: '#7f1d1d',
    fontSize: 13,
    lineHeight: 19,
  },
});
