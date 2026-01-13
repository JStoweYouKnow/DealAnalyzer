import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>App settings and preferences</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General Settings</Text>
        <Text style={styles.comingSoon}>More settings coming soon</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  comingSoon: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});










