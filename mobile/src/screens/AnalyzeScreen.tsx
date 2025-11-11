import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import InfoTooltip from '../components/InfoTooltip';

export default function AnalyzeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Analyze Property</Text>
          <InfoTooltip
            title="Property Analysis"
            content={[
              "Analyze properties to get detailed investment metrics and recommendations. You can analyze properties by:",
              "• Uploading a PDF: Property listings, flyers, or documents",
              "• Pasting Email Content: Property deal emails from brokers or listings",
              "• Manual Entry: Enter property details manually",
              "• Property URL: Extract data from listing websites",
              "The analysis will calculate:",
              "• Cash-on-Cash Return: Annual return on your cash investment",
              "• Cap Rate: Net operating income divided by property value",
              "• ROI: Total return on investment over time",
              "• Cash Flow: Monthly and annual cash flow projections",
              "• Break-even Analysis: When your investment becomes profitable",
            ]}
            iconSize={20}
          />
        </View>
        <Text style={styles.placeholder}>
          Property analysis form will appear here
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
