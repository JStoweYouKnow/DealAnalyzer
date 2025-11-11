import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InfoTooltip from '../components/InfoTooltip';

export default function MarketScreen() {
  return (
    <SafeAreaView style={styles.container} accessibilityLabel="Market screen">
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text 
            style={styles.title}
            accessibilityRole="header"
            accessibilityLabel="Market Intelligence"
          >
            Market Intelligence
          </Text>
          <InfoTooltip
            title="Market Intelligence"
            content={[
              "Market Intelligence provides comprehensive market data and analysis to help you make informed investment decisions.",
              "• Comparable Sales: View recently sold properties in the area",
              "• Market Trends: Analyze price trends and market conditions",
              "• Property Valuations: Get estimated property values based on market data",
              "• Neighborhood Analytics: Understand local market dynamics",
              "Enter an address to view market data and comparable sales for that location.",
            ]}
            iconSize={20}
          />
        </View>
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
