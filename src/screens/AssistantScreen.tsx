import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function AssistantScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assistant</Text>
      <Text style={styles.subtitle}>Yapay zeka asistan ekranı.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  title: {fontSize: 28, fontWeight: '700'},
  subtitle: {fontSize: 16, marginTop: 8},
});