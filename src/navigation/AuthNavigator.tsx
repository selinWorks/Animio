import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
          color: '#111827',
        },
        headerTintColor: '#6D5CE7',
      }}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{title: 'Giriş Yap'}}
      />

      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{title: 'Kayıt Ol'}}
      />
    </Stack.Navigator>
  );
}