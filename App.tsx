import 'react-native-gesture-handler';
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';

import AppNavigator from './src/navigation/AppNavigator';
import {PetProvider} from './src/data/PetContext';
import {AuthProvider} from './src/data/AuthContext';

function App() {
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

export default App;