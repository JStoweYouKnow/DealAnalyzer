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
import { Input } from '../components/ui/Input';
import { useAuth } from '@clerk/clerk-expo';

export default function PreferencesScreen() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    darkMode: false,
    autoAnalyze: true,
    defaultMinCashOnCash: 8,
    defaultMinCapRate: 5,
    defaultMinCashFlow: 200,
  });

  const handleSave = () => {
    // TODO: Save preferences to backend/AsyncStorage
    Alert.alert('Success', 'Preferences saved successfully!');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Display Preferences</Text>
          </CardHeader>
          <CardContent>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Currency</Text>
                <Text style={styles.settingDescription}>Default currency for property values</Text>
              </View>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  Alert.alert('Currency', 'Select currency', [
                    { text: 'USD', onPress: () => setPreferences({ ...preferences, currency: 'USD' }) },
                    { text: 'EUR', onPress: () => setPreferences({ ...preferences, currency: 'EUR' }) },
                    { text: 'GBP', onPress: () => setPreferences({ ...preferences, currency: 'GBP' }) },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }}
              >
                <Text style={styles.pickerText}>{preferences.currency}</Text>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Date Format</Text>
                <Text style={styles.settingDescription}>How dates are displayed</Text>
              </View>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  Alert.alert('Date Format', 'Select format', [
                    { text: 'MM/DD/YYYY', onPress: () => setPreferences({ ...preferences, dateFormat: 'MM/DD/YYYY' }) },
                    { text: 'DD/MM/YYYY', onPress: () => setPreferences({ ...preferences, dateFormat: 'DD/MM/YYYY' }) },
                    { text: 'YYYY-MM-DD', onPress: () => setPreferences({ ...preferences, dateFormat: 'YYYY-MM-DD' }) },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }}
              >
                <Text style={styles.pickerText}>{preferences.dateFormat}</Text>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingDescription}>Enable dark theme</Text>
              </View>
              <Switch
                value={preferences.darkMode}
                onValueChange={(value) => setPreferences({ ...preferences, darkMode: value })}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Analysis Preferences</Text>
          </CardHeader>
          <CardContent>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-Analyze Deals</Text>
                <Text style={styles.settingDescription}>Automatically analyze new email deals</Text>
              </View>
              <Switch
                value={preferences.autoAnalyze}
                onValueChange={(value) => setPreferences({ ...preferences, autoAnalyze: value })}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.inputContainer}>
              <Input
                label="Minimum Cash-on-Cash Return (%)"
                value={preferences.defaultMinCashOnCash.toString()}
                onChangeText={(text) => {
                  const num = parseFloat(text) || 0;
                  if (num >= 0 && num <= 100) {
                    setPreferences({ ...preferences, defaultMinCashOnCash: num });
                  }
                }}
                keyboardType="numeric"
                placeholder="8"
              />
            </View>

            <View style={styles.inputContainer}>
              <Input
                label="Minimum Cap Rate (%)"
                value={preferences.defaultMinCapRate.toString()}
                onChangeText={(text) => {
                  const num = parseFloat(text) || 0;
                  if (num >= 0 && num <= 100) {
                    setPreferences({ ...preferences, defaultMinCapRate: num });
                  }
                }}
                keyboardType="numeric"
                placeholder="5"
              />
            </View>

            <View style={styles.inputContainer}>
              <Input
                label="Minimum Monthly Cash Flow ($)"
                value={preferences.defaultMinCashFlow.toString()}
                onChangeText={(text) => {
                  const num = parseFloat(text) || 0;
                  if (num >= 0) {
                    setPreferences({ ...preferences, defaultMinCashFlow: num });
                  }
                }}
                keyboardType="numeric"
                placeholder="200"
              />
            </View>
          </CardContent>
        </Card>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>Save Preferences</Text>
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
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  pickerText: {
    fontSize: 16,
    color: '#000000',
    marginRight: 8,
  },
  inputContainer: {
    marginBottom: 16,
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

