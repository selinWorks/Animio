import React from 'react';
import {ActivityIndicator, View} from 'react-native';
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

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,

        tabBarActiveTintColor: '#7457E8',
        tabBarInactiveTintColor: '#9CA3AF',

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 1,
        },

        /*
         * Floating navbar kaldırıldı.
         * Bar artık ekranın tabanına tamamen oturuyor.
         */
        tabBarStyle: {
          position: 'absolute',

          left: 0,
          right: 0,
          bottom: 0,

          height: 72,

          backgroundColor: '#FFFFFF',

          /*
           * Sadece üst köşeler yuvarlak.
           * Alt taraf telefonun tabanına yapışıyor.
           */
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
          fontWeight: '700',
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

      <Stack.Screen
        name="PetDetail"
        component={PetDetailScreen}
        options={{
          title: 'Dost Detayı',
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

export default function AppNavigator() {
  const {user, loading} = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F7F8FC',
        }}>
        <ActivityIndicator
          size="large"
          color="#6D5CE7"
        />
      </View>
    );
  }

  return user ? <MainAppNavigator /> : <AuthNavigator />;
}