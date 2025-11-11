import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import InfoTooltip from '../components/InfoTooltip';

export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text 
            style={styles.title}
            accessibilityRole="header"
            accessibilityLabel="Search Properties screen title"
          >
            Search Properties
          </Text>
          <InfoTooltip
            title="Search Properties"
            content={[
              "Search for properties using natural language queries. You can search by:",
              "• Location: City, state, zip code, or neighborhood",
              "• Property Type: Single-family, multi-family, commercial, etc.",
              "• Investment Criteria: Price range, ROI, cash flow, etc.",
              "• Features: Bedrooms, bathrooms, square footage, etc.",
              "Examples: '3 bedroom houses under $200k in Dallas' or 'Properties with 10%+ ROI in Florida'",
            ]}
            iconSize={20}
          />
        </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  placeholder: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
});
