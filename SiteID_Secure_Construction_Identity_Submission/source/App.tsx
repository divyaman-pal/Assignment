import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  LogBox,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

LogBox.ignoreLogs(['new NativeEventEmitter', 'Require cycle']);

const AppNavigator = lazy(() => import('./src/navigation/AppNavigator'));

export default function App() {
  const [ready, setReady] = useState(false);
  const [initWarning, setInitWarning] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    const warnings: string[] = [];

    try {
      const DatabaseService = require('./src/services/database/DatabaseService').default;
      await DatabaseService.initialize();
    } catch (err: any) {
      console.warn('[App] DB init skipped:', err?.message);
      warnings.push('DB: ' + (err?.message || 'unavailable'));
    }

    try {
      const SyncService = require('./src/services/sync/SyncService').default;
      SyncService.startAutoSync();
    } catch (err: any) {
      console.warn('[App] Sync init skipped:', err?.message);
    }

    if (warnings.length > 0) {
      setInitWarning(warnings.join('; '));
    }

    setReady(true);
  }

  if (!ready) {
    return (
      <View style={styles.splash}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
        <Text style={styles.logo}>SiteID</Text>
        <Text style={styles.subtitle}>Offline Facial Recognition</Text>
        <ActivityIndicator size="small" color="#1A73E8" style={styles.spinner} />
        <Text style={styles.statusText}>Initializing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.app}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />
      {initWarning && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Warning: {initWarning}</Text>
        </View>
      )}
      <Suspense
        fallback={
          <View style={styles.splash}>
            <ActivityIndicator size="large" color="#1A73E8" />
            <Text style={styles.statusText}>Loading screens...</Text>
          </View>
        }>
        <AppNavigator />
      </Suspense>
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  splash: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  logo: {
    color: '#212121',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#757575',
    fontSize: 14,
    marginTop: 4,
  },
  spinner: {
    marginTop: 24,
  },
  statusText: {
    color: '#BDBDBD',
    fontSize: 12,
    marginTop: 8,
  },
  banner: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  bannerText: {
    color: '#E65100',
    fontSize: 11,
  },
});
