import 'react-native-gesture-handler';
import React, {useEffect, useState} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';

import NetInfo from '@react-native-community/netinfo';
import {WifiOff, RefreshCw} from 'lucide-react-native';

import {NavigationContainer} from '@react-navigation/native';

import AppNavigator from './src/navigation/AppNavigator';
import {PetProvider} from './src/data/PetContext';
import {AuthProvider} from './src/data/AuthContext';

const COLORS = {
  bg: '#FAF9FF',
  white: '#FFFFFF',
  text: '#18162B',
  secondary: '#77738A',
  purple: '#7457E8',
  purpleDark: '#5D42CF',
  purpleSoft: '#F1EDFF',
};

function NoInternetScreen({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <View style={styles.noInternetContainer}>
      <View style={styles.iconCircle}>
        <WifiOff
          size={42}
          color={COLORS.purple}
          strokeWidth={1.8}
        />
      </View>

      <Text style={styles.noInternetTitle}>
        İnternet bağlantısı yok
      </Text>

      <Text style={styles.noInternetDescription}>
        Uygulamayı kullanabilmek için internet bağlantını
        kontrol edip tekrar deneyebilirsin.
      </Text>

      <Pressable
        onPress={onRetry}
        style={({pressed}) => [
          styles.retryButton,
          pressed && styles.retryButtonPressed,
        ]}>
        <RefreshCw
          size={18}
          color="#FFFFFF"
          strokeWidth={2}
        />

        <Text style={styles.retryButtonText}>
          Tekrar Dene
        </Text>
      </Pressable>
    </View>
  );
}

function AppContent() {
  const [isConnected, setIsConnected] =
    useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected =
        state.isConnected === true &&
        state.isInternetReachable !== false;

      setIsConnected(connected);
    });

    NetInfo.fetch().then(state => {
      const connected =
        state.isConnected === true &&
        state.isInternetReachable !== false;

      setIsConnected(connected);
    });

    return unsubscribe;
  }, []);

  const retryInternet = async () => {
    const state = await NetInfo.fetch();

    const connected =
      state.isConnected === true &&
      state.isInternetReachable !== false;

    setIsConnected(connected);
  };

  // İlk internet kontrolü yapılırken kısa yükleme
  if (isConnected === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="small"
          color={COLORS.purple}
        />
      </View>
    );
  }

  // İnternet yoksa uygulamanın tamamında bu ekran
  if (!isConnected) {
    return (
      <NoInternetScreen
        onRetry={retryInternet}
      />
    );
  }

  return (
    <AuthProvider>
      <PetProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </PetProvider>
    </AuthProvider>
  );
}

export default function App() {
  return <AppContent />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  noInternetContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 35,
  },

  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: COLORS.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E3DCFF',
  },

  noInternetTitle: {
    fontSize: 22,
    fontFamily: 'Quicksand-Bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },

  noInternetDescription: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Quicksand-Medium',
    color: COLORS.secondary,
    textAlign: 'center',
    maxWidth: 310,
  },

  retryButton: {
    marginTop: 25,
    minWidth: 150,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: COLORS.purple,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,

    shadowColor: COLORS.purpleDark,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 4,
  },

  retryButtonPressed: {
    opacity: 0.8,
    transform: [{scale: 0.97}],
  },

  retryButtonText: {
    fontSize: 13,
    fontFamily: 'Quicksand-Bold',
    color: '#FFFFFF',
  },
});