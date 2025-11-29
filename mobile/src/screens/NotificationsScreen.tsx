import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState({
    emailDeals: true,
    analysisComplete: true,
    marketUpdates: false,
    priceAlerts: true,
    weeklyDigest: true,
    pushNotifications: true,
    soundEnabled: true,
    badgeEnabled: true,
  });

  const handleSave = () => {
    // TODO: Save notification preferences to backend/AsyncStorage
    Alert.alert('Success', 'Notification preferences saved successfully!');
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Email Notifications</Text>
          </CardHeader>
          <CardContent>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>New Email Deals</Text>
                <Text style={styles.settingDescription}>Get notified when new deals arrive</Text>
              </View>
              <Switch
                value={notifications.emailDeals}
                onValueChange={() => toggleNotification('emailDeals')}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Analysis Complete</Text>
                <Text style={styles.settingDescription}>Notify when property analysis is finished</Text>
              </View>
              <Switch
                value={notifications.analysisComplete}
                onValueChange={() => toggleNotification('analysisComplete')}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Market Updates</Text>
                <Text style={styles.settingDescription}>Receive market intelligence updates</Text>
              </View>
              <Switch
                value={notifications.marketUpdates}
                onValueChange={() => toggleNotification('marketUpdates')}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Price Alerts</Text>
                <Text style={styles.settingDescription}>Alerts for properties matching your criteria</Text>
              </View>
              <Switch
                value={notifications.priceAlerts}
                onValueChange={() => toggleNotification('priceAlerts')}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Weekly Digest</Text>
                <Text style={styles.settingDescription}>Receive weekly summary of deals and insights</Text>
              </View>
              <Switch
                value={notifications.weeklyDigest}
                onValueChange={() => toggleNotification('weeklyDigest')}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Push Notifications</Text>
          </CardHeader>
          <CardContent>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Enable Push Notifications</Text>
                <Text style={styles.settingDescription}>Receive push notifications on your device</Text>
              </View>
              <Switch
                value={notifications.pushNotifications}
                onValueChange={() => toggleNotification('pushNotifications')}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {notifications.pushNotifications && (
              <>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Sound</Text>
                    <Text style={styles.settingDescription}>Play sound for notifications</Text>
                  </View>
                  <Switch
                    value={notifications.soundEnabled}
                    onValueChange={() => toggleNotification('soundEnabled')}
                    trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Badge Count</Text>
                    <Text style={styles.settingDescription}>Show unread count on app icon</Text>
                  </View>
                  <Switch
                    value={notifications.badgeEnabled}
                    onValueChange={() => toggleNotification('badgeEnabled')}
                    trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </>
            )}
          </CardContent>
        </Card>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>Save Notification Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

