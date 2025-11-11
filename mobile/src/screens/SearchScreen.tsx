import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text 
          style={styles.title}
          accessibilityRole="header"
          accessibilityLabel="Search Properties screen title"
        >
          Search Properties
        </Text>
        <Text 
          style={styles.placeholder}
        >
          Property search functionality will appear here
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
