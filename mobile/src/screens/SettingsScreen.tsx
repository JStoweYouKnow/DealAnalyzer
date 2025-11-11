import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import InfoTooltip from '../components/InfoTooltip';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Settings</Text>
          <InfoTooltip
            title="Settings"
            content={[
              "Configure your DealAnalyzer app settings and preferences:",
              "• Gmail Integration: Connect your Gmail account to automatically receive and analyze property deals",
              "• Email Forwarding: Set up email forwarding to receive deals at a dedicated email address",
              "• Investment Criteria: Set your default investment criteria (minimum ROI, cash flow, etc.)",
              "• Notifications: Configure push notifications for new deals and analysis updates",
              "• Account: Manage your account settings and subscription",
            ]}
            iconSize={20}
          />
        </View>
        <Text style={styles.placeholder}>
          App settings and configuration will appear here
        </Text>
      </View>
    </View>
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
