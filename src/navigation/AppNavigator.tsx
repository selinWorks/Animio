import 'react-native-gesture-handler';
import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import PetsScreen from '../screens/PetsScreen';
import AddPetScreen from '../screens/AddPetScreen';
import AssistantScreen from '../screens/AssistantScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PetDetailScreen from '../screens/PetDetailScreen';
import EditPetScreen from '../screens/EditPetScreen';
import CalendarScreen from '../screens/CalendarScreen';
import AboutAppScreen from '../screens/AboutAppScreen';
import UpcomingFeaturesScreen from '../screens/UpcomingFeaturesScreen';

import AuthNavigator from './AuthNavigator';
import {useAuth} from '../data/AuthContext';

import {Pet} from '../types/Pet';

import {
  Home,
  PawPrint,
  PlusCircle,
  Bot,
  User,
} from 'lucide-react-native';

export type TabParamList = {
  Home: undefined;
  Pets: undefined;
  AddPet: undefined;
  Assistant: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  PetDetail: {pet: Pet};
  EditPet: {pet: Pet};
  Calendar: undefined;
  AboutApp: undefined;
  UpcomingFeatures: undefined;
  FirestoreTest: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

/* =========================================================
   PETCARE LOADING
   ========================================================= */

function PetCareLoading() {
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnimation, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    rotateLoop.start();
    pulseLoop.start();

    return () => {
      rotateLoop.stop();
      pulseLoop.stop();
    };
  }, [rotateAnimation, pulseAnimation]);

  const rotation = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pawScale = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const pawOpacity = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.78, 1],
  });

  return (
    <View style={loadingStyles.container}>
      <View style={loadingStyles.glowTop} />
      <View style={loadingStyles.glowBottom} />

      <View style={loadingStyles.content}>
        <View style={loadingStyles.loaderWrapper}>
          <Animated.View
            style={[
              loadingStyles.rotatingRing,
              {
                transform: [{rotate: rotation}],
              },
            ]}>
            <View style={loadingStyles.ringAccent} />
          </Animated.View>

          <View style={loadingStyles.pawCircle}>
            <Animated.View
              style={{
                opacity: pawOpacity,
                transform: [{scale: pawScale}],
              }}>
              <PawPrint
                size={42}
                color="#7457E8"
                strokeWidth={2.2}
              />
            </Animated.View>
          </View>
        </View>

        <Text style={loadingStyles.brand}>
          PetCare
        </Text>

        <Text style={loadingStyles.loadingText}>
          PetCare hazırlanıyor...
        </Text>

        <View style={loadingStyles.dots}>
          <View style={loadingStyles.dot} />
          <View style={loadingStyles.dotMiddle} />
          <View style={loadingStyles.dot} />
        </View>
      </View>
    </View>
  );
}

/* =========================================================
   BOTTOM TAB NAVIGATOR
   ========================================================= */

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,

        tabBarActiveTintColor: '#7457E8',
        tabBarInactiveTintColor: '#9CA3AF',

        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Quicksand-SemiBold',
          marginTop: 1,
        },

        tabBarStyle: {
          position: 'absolute',

          left: 0,
          right: 0,
          bottom: 0,

          height: 72,

          backgroundColor: '#FFFFFF',

          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,

          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,

          borderTopWidth: 1,
          borderTopColor: '#F0EDF7',

          paddingTop: 8,
          paddingBottom: 8,

          elevation: 14,

          shadowColor: '#31275A',
          shadowOpacity: 0.1,
          shadowRadius: 16,
          shadowOffset: {
            width: 0,
            height: -4,
          },
        },

        tabBarItemStyle: {
          paddingVertical: 2,
        },

        tabBarIconStyle: {
          marginTop: 2,
        },

        tabBarIcon: ({color, size}) => {
          const iconSize = Math.min(size, 22);

          if (route.name === 'Home') {
            return (
              <Home
                color={color}
                size={iconSize}
                strokeWidth={1.9}
              />
            );
          }

          if (route.name === 'Pets') {
            return (
              <PawPrint
                color={color}
                size={iconSize}
                strokeWidth={1.9}
              />
            );
          }

          if (route.name === 'AddPet') {
            return (
              <PlusCircle
                color={color}
                size={iconSize}
                strokeWidth={1.9}
              />
            );
          }

          if (route.name === 'Assistant') {
            return (
              <Bot
                color={color}
                size={iconSize}
                strokeWidth={1.9}
              />
            );
          }

          if (route.name === 'Profile') {
            return (
              <User
                color={color}
                size={iconSize}
                strokeWidth={1.9}
              />
            );
          }

          return null;
        },
      })}>

      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />

      <Tab.Screen
        name="Pets"
        component={PetsScreen}
        options={{
          tabBarLabel: 'Pets',
        }}
      />

      <Tab.Screen
        name="AddPet"
        component={AddPetScreen}
        options={{
          tabBarLabel: 'Add',
        }}
      />

      <Tab.Screen
        name="Assistant"
        component={AssistantScreen}
        options={{
          tabBarLabel: 'AI',
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

/* =========================================================
   MAIN STACK
   ========================================================= */

function MainAppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },

        headerShadowVisible: false,

        headerTitleStyle: {
          fontFamily: 'Quicksand-Bold',
          fontSize: 18,
          color: '#111827',
        },

        headerTintColor: '#6366F1',
      }}>

      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{
          headerShown: false,
        }}
      />

      {/* PET DETAIL
          Kendi özel header tasarımına sahip olduğu için
          React Navigation header'ını göstermiyoruz. */}
      <Stack.Screen
        name="PetDetail"
        component={PetDetailScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="EditPet"
        component={EditPetScreen}
        options={{
          title: 'Dostu Düzenle',
        }}
      />

      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: 'Takvim',
        }}
      />

      <Stack.Screen
        name="AboutApp"
        component={AboutAppScreen}
        options={{
          title: 'PetCare Hakkında',
        }}
      />

      <Stack.Screen
        name="UpcomingFeatures"
        component={UpcomingFeaturesScreen}
        options={{
          title: 'Yakında',
        }}
      />
    </Stack.Navigator>
  );
}

/* =========================================================
   ROOT NAVIGATOR
   ========================================================= */

export default function AppNavigator() {
  const {user, loading} = useAuth();

  if (loading) {
    return <PetCareLoading />;
  }

  return user ? <MainAppNavigator /> : <AuthNavigator />;
}

/* =========================================================
   LOADING STYLES
   ========================================================= */

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  glowTop: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: '#EEE9FF',
    top: -150,
    right: -120,
  },

  glowBottom: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#F0ECFF',
    bottom: -160,
    left: -130,
  },

  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  loaderWrapper: {
    width: 116,
    height: 116,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  rotatingRing: {
    position: 'absolute',

    width: 112,
    height: 112,

    borderRadius: 56,

    borderWidth: 3,
    borderColor: '#E4DEFF',

    borderTopColor: '#7457E8',
    borderRightColor: '#A58FF3',
  },

  ringAccent: {
    position: 'absolute',

    width: 10,
    height: 10,

    borderRadius: 5,

    backgroundColor: '#7457E8',

    top: 5,
    right: 18,
  },

  pawCircle: {
    width: 84,
    height: 84,

    borderRadius: 42,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: '#EEEAFE',

    elevation: 7,

    shadowColor: '#7560D9',
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.14,
    shadowRadius: 14,
  },

  brand: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 25,
    color: '#17183F',
    letterSpacing: -0.5,
  },

  loadingText: {
    marginTop: 6,

    fontFamily: 'Quicksand-Medium',
    fontSize: 13,

    color: '#7A819B',
  },

  dots: {
    marginTop: 15,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,
  },

  dot: {
    width: 5,
    height: 5,

    borderRadius: 3,

    backgroundColor: '#C8BDF7',
  },

  dotMiddle: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: '#8068E9',
  },
});