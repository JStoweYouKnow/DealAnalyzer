import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type DealDetailRouteProp = RouteProp<RootStackParamList, 'DealDetail'>;

export default function DealDetailScreen() {
  const route = useRoute<DealDetailRouteProp>();
  const { dealId } = route.params;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Deal Details</Text>
        <Text style={styles.text}>Deal ID: {dealId}</Text>
        <Text style={styles.placeholder}>
          Detailed property analysis will appear here
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
  placeholder: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 16,
  },
});
