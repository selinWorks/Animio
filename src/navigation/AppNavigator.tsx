import 'react-native-gesture-handler';

import React, {useEffect, useRef, useState} from 'react';

import {
  Animated,
  Easing,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import type {
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {PawPrint} from 'lucide-react-native';

import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

import HomeScreen from '../screens/HomeScreen';
import PetsScreen from '../screens/PetsScreen';
import AddPetScreen from '../screens/AddPetScreen';
import AssistantScreen from '../screens/AssistantScreen';
import ProfileScreen from '../screens/ProfileScreen';

import PetDetailScreen from '../screens/PetDetailScreen';
import EditPetScreen from '../screens/EditPetScreen';
import WeightHistoryScreen from '../screens/WeightHistoryScreen';
import HealthHistoryScreen from '../screens/HealthHistoryScreen';

import CalendarScreen from '../screens/CalendarScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AboutAppScreen from '../screens/AboutAppScreen';
import UpcomingFeaturesScreen from '../screens/UpcomingFeaturesScreen';

import PetJoinScreen from '../screens/PetJoinScreen';
import FamilyManagementScreen from '../screens/FamilyManagementScreen';
import PetSummaryScreen from '../screens/PetSummaryScreen';

import AuthNavigator from './AuthNavigator';
import {useAuth} from '../data/AuthContext';
import {Pet} from '../types/Pet';

/* NAVIGATION TYPES */

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
  WeightHistory: {pet: Pet};
  HealthHistory: {pet: Pet};
  PetSummary: {pet: Pet};
  PetJoin: undefined;
  Calendar: undefined;
  Notifications: undefined;
  AboutApp: undefined;
  UpcomingFeatures: undefined;
  FirestoreTest: undefined;
  FamilyManagement: {petId?: string} | undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const BAR_ITEMS = [
  {name: 'Home', label: 'Ana Sayfa'},
  {name: 'AddPet', label: 'Ekle'},
  {name: 'Assistant', label: 'Asistan'},
  {name: 'Profile', label: 'Profil'},
] as const;

type BarRouteName = (typeof BAR_ITEMS)[number]['name'];

/* CUSTOM BAR ICONS */

function BarIcon({
  name,
  focused,
}: {
  name: BarRouteName;
  focused: boolean;
}) {
  const color = focused ? '#6942CC' : '#928BAA';
  const gradientId = `bar-icon-${name}`;

  const paint = focused
    ? `url(#${gradientId})`
    : color;

  return (
    <Svg width={24} height={24} viewBox="0 0 28 28">
      <Defs>
        <LinearGradient
          id={gradientId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%">
          <Stop offset="0%" stopColor="#9563EF" />
          <Stop offset="100%" stopColor="#5130B3" />
        </LinearGradient>
      </Defs>

      {name === 'Home' && (
        <Path
          fill={paint}
          d="
            M12.2 3.3
            a2.7 2.7 0 0 1 3.6 0
            l8 7.2
            a2.7 2.7 0 0 1 .9 2
            V23
            a2 2 0 0 1-2 2
            h-4.3
            a.8.8 0 0 1-.8-.8
            v-6
            a3.6 3.6 0 0 0-7.2 0
            v6
            a.8.8 0 0 1-.8.8
            H5.3
            a2 2 0 0 1-2-2
            V12.5
            a2.7 2.7 0 0 1 .9-2
            z
          "
        />
      )}

      {name === 'AddPet' && (
        <Path
          d="M14 5.5V22.5M5.5 14H22.5"
          fill="none"
          stroke={paint}
          strokeWidth={2.8}
          strokeLinecap="round"
        />
      )}

      {name === 'Assistant' && (
        <>
          <Ellipse
            cx={14}
            cy={14}
            rx={11.4}
            ry={6.1}
            rotation={-35}
            origin="14, 14"
            fill="none"
            stroke={color}
            strokeWidth={2}
          />

          <Circle
            cx={14}
            cy={14}
            r={5}
            fill={paint}
          />

          <Circle
            cx={22}
            cy={6}
            r={2.25}
            fill={paint}
            stroke={focused ? '#EFE6FD' : '#FCFAFF'}
            strokeWidth={1.3}
          />
        </>
      )}

      {name === 'Profile' && (
        <>
          <Circle
            cx={14}
            cy={8.2}
            r={5.1}
            fill={paint}
          />

          <Path
            d="
              M14 15.4
              C7.8 15.4 4.5 18.5 4.5 22.2
              V23
              C4.5 24.3 8.7 25 14 25
              C19.3 25 23.5 24.3 23.5 23
              V22.2
              C23.5 18.5 20.2 15.4 14 15.4
              Z
            "
            fill={paint}
          />
        </>
      )}
    </Svg>
  );
}

/* LOADING */

function PetCareLoading() {
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(0)).current;

  const dot1Animation = useRef(new Animated.Value(0)).current;
  const dot2Animation = useRef(new Animated.Value(0)).current;
  const dot3Animation = useRef(new Animated.Value(0)).current;

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

    const animateDot = (value: Animated.Value) =>
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: 250,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(value, {
          toValue: 0,
          duration: 250,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]);

    const dotLoop = Animated.loop(
      Animated.sequence([
        animateDot(dot1Animation),
        Animated.delay(80),
        animateDot(dot2Animation),
        Animated.delay(80),
        animateDot(dot3Animation),
        Animated.delay(180),
      ]),
    );

    rotateLoop.start();
    pulseLoop.start();
    dotLoop.start();

    return () => {
      rotateLoop.stop();
      pulseLoop.stop();
      dotLoop.stop();
    };
  }, [
    rotateAnimation,
    pulseAnimation,
    dot1Animation,
    dot2Animation,
    dot3Animation,
  ]);

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
              {transform: [{rotate: rotation}]},
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

        <Text style={loadingStyles.brand}>PetCare</Text>

        <Text style={loadingStyles.loadingText}>
          PetCare hazırlanıyor...
        </Text>

        <View style={loadingStyles.dots}>
          {[
            dot1Animation,
            dot2Animation,
            dot3Animation,
          ].map((value, index) => (
            <Animated.View
              key={index}
              style={[
                loadingStyles.dot,
                {
                  transform: [
                    {
                      translateY: value.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -6],
                      }),
                    },
                    {
                      scale: value.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.5],
                      }),
                    },
                  ],
                },
              ]}>
              <Animated.View
                style={[
                  loadingStyles.activeDot,
                  {opacity: value},
                ]}
              />
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}

/* SHARED BOTTOM BAR */

function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true),
    );

    const hideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (keyboardVisible) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        barStyles.wrapper,
        {bottom: Math.max(insets.bottom, 12) + 2},,
      ]}>
      <View style={barStyles.shadow}>
        <View style={barStyles.dock}>
          {BAR_ITEMS.map(item => {
            const route = state.routes.find(
              candidate => candidate.name === item.name,
            );

            if (!route) {
              return null;
            }

            const focused =
              state.routes[state.index].key === route.key;

            const options = descriptors[route.key].options;

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel={
                  options.tabBarAccessibilityLabel ?? item.label
                }
                accessibilityState={{selected: focused}}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!focused && !event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                  }
                }}
                onLongPress={() => {
                  navigation.emit({
                    type: 'tabLongPress',
                    target: route.key,
                  });
                }}
                style={({pressed}) => [
                  barStyles.item,
                  pressed && barStyles.pressed,
                ]}>
                <View style={barStyles.capsule}>
                  {focused && (
                    <View
                      pointerEvents="none"
                      style={barStyles.activeBackground}
                    />
                  )}

                  <BarIcon
                    name={item.name}
                    focused={focused}
                  />

                  <Text
                    numberOfLines={1}
                    style={[
                      barStyles.label,
                      focused && barStyles.activeLabel,
                    ]}>
                    {item.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/* TAB NAVIGATOR */

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <FloatingTabBar {...props} />}
      screenOptions={{headerShown: false}}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
      />

      {/* Dostlar sayfası erişilebilir; barda görünmez. */}
      <Tab.Screen
        name="Pets"
        component={PetsScreen}
      />

      <Tab.Screen
        name="AddPet"
        component={AddPetScreen}
      />

      <Tab.Screen
        name="Assistant"
        component={AssistantScreen}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}

/* MAIN STACK */

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
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="PetDetail"
        component={PetDetailScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="EditPet"
        component={EditPetScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="WeightHistory"
        component={WeightHistoryScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="HealthHistory"
        component={HealthHistoryScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="PetJoin"
        component={PetJoinScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{title: 'Takvim'}}
      />

      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{title: 'Bildirimler'}}
      />

      <Stack.Screen
        name="AboutApp"
        component={AboutAppScreen}
        options={{title: 'PetCare Hakkında'}}
      />

      <Stack.Screen
        name="UpcomingFeatures"
        component={UpcomingFeaturesScreen}
        options={{title: 'Yakında'}}
      />

      <Stack.Screen
        name="FamilyManagement"
        component={FamilyManagementScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="PetSummary"
        component={PetSummaryScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}

/* ROOT NAVIGATOR */

export default function AppNavigator() {
  const {user, loading} = useAuth();

  if (loading) {
    return <PetCareLoading />;
  }

  return user ? <MainAppNavigator /> : <AuthNavigator />;
}

/* BAR STYLES */

const barStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
  },

  shadow: {
    borderRadius: 28,
    backgroundColor: '#FCFAFF',
    shadowColor: '#49366E',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 9,
  },

  dock: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#FCFAFF',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  item: {
    flex: 1,
    height: 64,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },

  capsule: {
    width: '100%',
    maxWidth: 96,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    backgroundColor: '#EFE6FD',
  },

  label: {
    marginTop: 2,
    fontSize: 10.5,
    fontFamily: 'Quicksand-Bold',
    color: '#928BAA',
  },

  activeLabel: {
    color: '#6138BE',
  },

  pressed: {
    opacity: 0.75,
    transform: [{scale: 0.96}],
  },
});

/* LOADING STYLES */

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
    shadowOffset: {width: 0, height: 7},
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

  activeDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#8068E9',
  },
});