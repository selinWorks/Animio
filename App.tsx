import 'react-native-gesture-handler';
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import {PetProvider} from './src/data/PetContext';

function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <PetProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </PetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;