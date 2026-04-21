import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import PetsScreen from '../screens/PetsScreen';
import AddPetScreen from '../screens/AddPetScreen';
import AssistantScreen from '../screens/AssistantScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PetDetailScreen from '../screens/PetDetailScreen';
import EditPetScreen from '../screens/EditPetScreen';
import {Pet} from '../types/Pet';
import CalendarScreen from '../screens/CalendarScreen';
import {
  Home,
  PawPrint,
  PlusCircle,
  Bot,
  User
} from "lucide-react-native";

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
  FirestoreTest: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: '#818CF8',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 14,
          height: 70,
          borderRadius: 24,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 8,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarIcon: ({color, size}) => {
          if (route.name === "Home") {
            return <Home color={color} size={size} />;
          }

          if (route.name === "Pets") {
            return <PawPrint color={color} size={size} />;
          }

          if (route.name === "AddPet") {
            return <PlusCircle color={color} size={size} />;
          }

          if (route.name === "Assistant") {
            return <Bot color={color} size={size} />;
          }

          if (route.name === "Profile") {
            return <User color={color} size={size} />;
          }

          return null;
        },
      })}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{tabBarLabel: 'Home'}}
      />
      <Tab.Screen
        name="Pets"
        component={PetsScreen}
        options={{tabBarLabel: 'Pets'}}
      />
      <Tab.Screen
        name="AddPet"
        component={AddPetScreen}
        options={{tabBarLabel: 'Add'}}
      />
      <Tab.Screen
        name="Assistant"
        component={AssistantScreen}
        options={{tabBarLabel: 'AI'}}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{tabBarLabel: 'Profile'}}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
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
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="PetDetail"
        component={PetDetailScreen}
        options={{title: 'Pet Details'}}
      />
      <Stack.Screen
        name="EditPet"
        component={EditPetScreen}
        options={{title: 'Edit Pet'}}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
      />
    </Stack.Navigator>
  );
}