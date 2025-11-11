import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MarketScreen() {
  return (
    <SafeAreaView style={styles.container} accessibilityLabel="Market screen">
      <View style={styles.content}>
        <Text 
          style={styles.title}
          accessibilityRole="header"
          accessibilityLabel="Market Intelligence"
        >
          Market Intelligence
        </Text>
        <Text 
          style={styles.placeholder}
          accessibilityLabel="Market data placeholder"
          accessibilityHint="Displays market data and comparable sales when available"
        >
          Market data and comparable sales will appear here
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
});
