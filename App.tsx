import 'react-native-gesture-handler';
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import {PetProvider} from './src/data/PetContext';

function App() {
  return (
    <PetProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </PetProvider>
  );
}

export default App;