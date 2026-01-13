import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { CONFIG } from '../config';
import type { AnalyzePropertyResponse, FundingSource } from '@dealanalyzer/types';

const API_BASE_URL = CONFIG.apiUrl || 'https://comfortfinder.projcomfort.com';

interface STRMetrics {
  adr?: number;
  occupancyRate?: number;
}

interface LTRMetrics {
  monthlyRent?: number;
}

interface MonthlyExpenses {
  propertyTaxes?: number;
  insurance?: number;
  utilities?: number;
  management?: number;
  maintenance?: number;
  cleaning?: number;
  supplies?: number;
  other?: number;
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { getToken } = useAuth();

  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [propertyUrl, setPropertyUrl] = useState('');
  const [extractingUrl, setExtractingUrl] = useState(false);
  const [extractedPropertyData, setExtractedPropertyData] = useState<any>(null);
  const [rentalType, setRentalType] = useState<'str' | 'ltr'>('ltr');
  
  // STR Metrics
  const [adr, setAdr] = useState('');
  const [occupancyRate, setOccupancyRate] = useState('');
  
  // LTR Metrics
  const [monthlyRent, setMonthlyRent] = useState('');
  
  // Expenses
  const [propertyTaxes, setPropertyTaxes] = useState('');
  const [insurance, setInsurance] = useState('');
  const [utilities, setUtilities] = useState('');
  const [management, setManagement] = useState('');
  const [maintenance, setMaintenance] = useState('');
  const [cleaning, setCleaning] = useState('');
  const [supplies, setSupplies] = useState('');
  const [otherExpenses, setOtherExpenses] = useState('');
  
  const [fundingSource, setFundingSource] = useState<FundingSource>('conventional');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        // Convert image to document picker format
        setSelectedFile({
          canceled: false,
          assets: [{
            uri: result.assets[0].uri,
            name: result.assets[0].uri.split('/').pop() || 'image.jpg',
            mimeType: 'image/jpeg',
            size: result.assets[0].width * result.assets[0].height * 4, // Approximate
          }],
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const extractPropertyUrl = async () => {
    if (!propertyUrl.trim()) {
      Alert.alert('Error', 'Please enter a property URL');
      return;
    }

    setExtractingUrl(true);
    try {
      const token = await getToken();
      const response = await axios.post(
        `${API_BASE_URL}/api/extract-property-url`,
        { url: propertyUrl },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        
        // Populate all available fields from extracted data
        console.log('[HomeScreen] Extracted property data:', data);
        
        if (data.monthlyRent) setMonthlyRent(data.monthlyRent.toString());
        if (data.propertyTaxes) {
          // Convert annual to monthly if needed (divide by 12)
          const monthlyTaxes = typeof data.propertyTaxes === 'number' 
            ? (data.propertyTaxes / 12).toFixed(2)
            : data.propertyTaxes;
          setPropertyTaxes(monthlyTaxes.toString());
        }
        if (data.hoa) setManagement(data.hoa.toString());
        
        // Store extracted property data for analysis
        setExtractedPropertyData(data);
        
        Alert.alert('Success', 'Property data extracted successfully! Review and adjust the fields below, then click "Analyze Property".');
      } else {
        Alert.alert('Error', response.data.error || 'Failed to extract property data');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to extract property URL');
    } finally {
      setExtractingUrl(false);
    }
  };

  const analyzeProperty = async () => {
    console.log('[HomeScreen] analyzeProperty called - selectedFile:', !!selectedFile, 'extractedPropertyData:', !!extractedPropertyData);
    
    if (!selectedFile && !extractedPropertyData) {
      Alert.alert('Error', 'Please select a file or extract property data from a URL first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const token = await getToken();

      // Prepare form data
      const formData = new FormData();
      
      if (selectedFile && !selectedFile.canceled && selectedFile.assets[0]) {
        const asset = selectedFile.assets[0];
        const fileUri = asset.uri;
        
        // For React Native, we need to create a file object
        const file = {
          uri: fileUri,
          type: asset.mimeType || 'application/pdf',
          name: asset.name || 'file.pdf',
        } as any;
        
        formData.append('file', file);
        console.log('[HomeScreen] Added file to formData');
      } 
      
      // Always add propertyData if we have it (even if we also have a file)
      if (extractedPropertyData) {
        console.log('[HomeScreen] Adding propertyData to formData:', Object.keys(extractedPropertyData));
        // In React Native, FormData.append with a string should work
        // Use Blob or string - try both approaches
        const propertyDataString = JSON.stringify(extractedPropertyData);
        formData.append('propertyData', propertyDataString);
        console.log('[HomeScreen] propertyData added to formData, length:', propertyDataString.length);
        console.log('[HomeScreen] propertyData preview:', propertyDataString.substring(0, 200));
      } else {
        console.warn('[HomeScreen] No extractedPropertyData available!');
      }

      // Add metrics
      const strMetrics: STRMetrics = {};
      const ltrMetrics: LTRMetrics = {};
      
      if (rentalType === 'str') {
        if (adr) strMetrics.adr = parseFloat(adr);
        if (occupancyRate) strMetrics.occupancyRate = parseFloat(occupancyRate) / 100;
      } else {
        if (monthlyRent) ltrMetrics.monthlyRent = parseFloat(monthlyRent);
      }

      const monthlyExpenses: MonthlyExpenses = {};
      if (propertyTaxes) monthlyExpenses.propertyTaxes = parseFloat(propertyTaxes);
      if (insurance) monthlyExpenses.insurance = parseFloat(insurance);
      if (utilities) monthlyExpenses.utilities = parseFloat(utilities);
      if (management) monthlyExpenses.management = parseFloat(management);
      if (maintenance) monthlyExpenses.maintenance = parseFloat(maintenance);
      if (cleaning) monthlyExpenses.cleaning = parseFloat(cleaning);
      if (supplies) monthlyExpenses.supplies = parseFloat(supplies);
      if (otherExpenses) monthlyExpenses.other = parseFloat(otherExpenses);

      formData.append('strMetrics', JSON.stringify(strMetrics));
      formData.append('ltrMetrics', JSON.stringify(ltrMetrics));
      formData.append('monthlyExpenses', JSON.stringify(monthlyExpenses));
      formData.append('fundingSource', fundingSource);

      // Log what we're sending
      console.log('[HomeScreen] Sending formData with keys:', [
        selectedFile ? 'file' : null,
        extractedPropertyData ? 'propertyData' : null,
        'strMetrics',
        'ltrMetrics',
        'monthlyExpenses',
        'fundingSource'
      ].filter(Boolean));

      // Don't set Content-Type manually - axios will set it with the correct boundary
      const response = await axios.post(
        `${API_BASE_URL}/api/analyze-file`,
        formData,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            // Let axios automatically set Content-Type with boundary for FormData
          },
        }
      );

      if (response.data.success && response.data.data) {
        const analysisId = response.data.data.id;
        // Navigate to analysis screen
        (navigation as any).navigate('Analyze', { analysisId });
      } else {
        Alert.alert('Error', response.data.error || 'Failed to analyze property');
      }
    } catch (error: any) {
      console.error('[HomeScreen] Analyze error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to analyze property';
      
      // If error mentions "No file uploaded" and we have propertyData, it means server doesn't support it yet
      if (errorMessage.includes('No file uploaded') && extractedPropertyData) {
        Alert.alert(
          'Error', 
          'Server needs to be updated to support URL-extracted properties. Please upload a file instead, or contact support.',
          [
            { text: 'OK' },
            { 
              text: 'Try with File', 
              onPress: () => {
                Alert.alert('Info', 'Please select a PDF or image file to analyze instead.');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Property Analyzer</Text>
      <Text style={styles.subtitle}>Analyze investment properties</Text>

      {/* File Upload Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upload Property File</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={pickDocument}>
            <Text style={styles.buttonText}>Pick PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Pick Image</Text>
          </TouchableOpacity>
        </View>
        {selectedFile && !selectedFile.canceled && (
          <Text style={styles.fileName}>
            Selected: {selectedFile.assets[0].name}
          </Text>
        )}
      </View>

      {/* URL Extraction Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Or Extract from URL</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter property listing URL"
          value={propertyUrl}
          onChangeText={setPropertyUrl}
          autoCapitalize="none"
          keyboardType="url"
        />
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={extractPropertyUrl}
          disabled={extractingUrl}
        >
          {extractingUrl ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Extract Property Data</Text>
          )}
        </TouchableOpacity>
        {extractedPropertyData && (
          <Text style={styles.fileName}>
            ✓ Property data extracted from URL
          </Text>
        )}
      </View>

      {/* Rental Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rental Type</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              rentalType === 'str' && styles.toggleButtonActive,
            ]}
            onPress={() => setRentalType('str')}
          >
            <Text
              style={[
                styles.toggleButtonText,
                rentalType === 'str' && styles.toggleButtonTextActive,
              ]}
            >
              STR
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              rentalType === 'ltr' && styles.toggleButtonActive,
            ]}
            onPress={() => setRentalType('ltr')}
          >
            <Text
              style={[
                styles.toggleButtonText,
                rentalType === 'ltr' && styles.toggleButtonTextActive,
              ]}
            >
              LTR
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* STR Metrics */}
      {rentalType === 'str' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STR Metrics</Text>
          <TextInput
            style={styles.input}
            placeholder="Average Daily Rate (ADR)"
            value={adr}
            onChangeText={setAdr}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Occupancy Rate (%)"
            value={occupancyRate}
            onChangeText={setOccupancyRate}
            keyboardType="numeric"
          />
        </View>
      )}

      {/* LTR Metrics */}
      {rentalType === 'ltr' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LTR Metrics</Text>
          <TextInput
            style={styles.input}
            placeholder="Monthly Rent"
            value={monthlyRent}
            onChangeText={setMonthlyRent}
            keyboardType="numeric"
          />
        </View>
      )}

      {/* Monthly Expenses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Expenses</Text>
        <TextInput
          style={styles.input}
          placeholder="Property Taxes"
          value={propertyTaxes}
          onChangeText={setPropertyTaxes}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Insurance"
          value={insurance}
          onChangeText={setInsurance}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Utilities"
          value={utilities}
          onChangeText={setUtilities}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Management"
          value={management}
          onChangeText={setManagement}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Maintenance"
          value={maintenance}
          onChangeText={setMaintenance}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Cleaning"
          value={cleaning}
          onChangeText={setCleaning}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Supplies"
          value={supplies}
          onChangeText={setSupplies}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Other Expenses"
          value={otherExpenses}
          onChangeText={setOtherExpenses}
          keyboardType="numeric"
        />
      </View>

      {/* Funding Source */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Funding Source</Text>
        <View style={styles.buttonRow}>
          {(['conventional', 'fha', 'va', 'cash'] as FundingSource[]).map((source) => (
            <TouchableOpacity
              key={source}
              style={[
                styles.toggleButton,
                fundingSource === source && styles.toggleButtonActive,
              ]}
              onPress={() => setFundingSource(source)}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  fundingSource === source && styles.toggleButtonTextActive,
                ]}
              >
                {source.charAt(0).toUpperCase() + source.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Analyze Button */}
      <TouchableOpacity
        style={[styles.button, styles.primaryButton, styles.analyzeButton]}
        onPress={analyzeProperty}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Analyze Property</Text>
        )}
      </TouchableOpacity>
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
  },
  primaryButton: {
    backgroundColor: '#28a745',
  },
  analyzeButton: {
    marginTop: 8,
    marginBottom: 32,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    flex: 1,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  toggleButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  fileName: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});










