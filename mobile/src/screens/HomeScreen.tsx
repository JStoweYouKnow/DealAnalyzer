import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { useApiClient } from '../services/api';
import { analyzeProperty } from '../services/propertyAnalyzer';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface AnalysisResult {
  propertyId: string;
  property: any;
  cashFlow: number;
  cocReturn: number;
  capRate: number;
  meetsCriteria: boolean;
  [key: string]: any;
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const apiClient = useApiClient();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [propertyUrl, setPropertyUrl] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [adr, setAdr] = useState('');
  const [occupancyRate, setOccupancyRate] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load recent analyses
  const { data: recentAnalyses = [] } = useQuery({
    queryKey: ['recentAnalyses'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem('recentAnalyses');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    },
    retry: false,
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: any) => {
      try {
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          type: file.mimeType || 'application/pdf',
          name: file.name || 'document.pdf',
        } as any);

        const response = await apiClient.post('/analyze-file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data || response;
      } catch (error: any) {
        console.error('File upload error:', error);
        throw new Error(error.message || 'Failed to upload and analyze file');
      }
    },
  });

  // Property analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await apiClient.post('/analyze', data);
        return response.data || response;
      } catch (error: any) {
        console.error('Analysis error:', error);
        throw new Error(error.message || 'Failed to analyze property');
      }
    },
  });

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/*', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant photo library access');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleExtractFromUrl = async () => {
    if (!propertyUrl.trim()) {
      Alert.alert('Error', 'Please enter a property URL');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await apiClient.post('/extract-property-url', { url: propertyUrl });
      const data = response.data || response;
      if (data.property) {
        setPurchasePrice(data.property.purchasePrice?.toString() || '');
        setMonthlyRent(data.property.monthlyRent?.toString() || '');
        Alert.alert('Success', 'Property data extracted successfully');
      }
    } catch (error: any) {
      console.error('URL extraction error:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to extract property data. Please enter details manually.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !purchasePrice && !monthlyRent) {
      Alert.alert('Error', 'Please provide a file or enter property details');
      return;
    }

    setIsAnalyzing(true);
    try {
      let analysis: AnalysisResult;

      if (selectedFile) {
        // Upload and analyze file
        try {
          const fileResult = await uploadMutation.mutateAsync(selectedFile);
          analysis = fileResult.analysis;
        } catch (fileError: any) {
          // If file upload fails, try local analysis
          console.warn('File upload failed, using manual entry:', fileError);
          if (!purchasePrice && !monthlyRent) {
            throw new Error('Please provide property details or a valid file');
          }
          // Fall through to manual analysis
          const propertyData = {
            purchasePrice: parseFloat(purchasePrice) || 0,
            monthlyRent: parseFloat(monthlyRent) || 0,
            address: 'Manual Entry',
          };
          const strMetrics = adr && occupancyRate ? {
            adr: parseFloat(adr),
            occupancyRate: parseFloat(occupancyRate) / 100,
          } : undefined;
          analysis = analyzeProperty(propertyData, strMetrics);
        }
      } else {
        // Analyze from form data
        const propertyData = {
          purchasePrice: parseFloat(purchasePrice) || 0,
          monthlyRent: parseFloat(monthlyRent) || 0,
          address: 'Manual Entry',
        };

        const strMetrics = adr && occupancyRate ? {
          adr: parseFloat(adr),
          occupancyRate: parseFloat(occupancyRate) / 100,
        } : undefined;

        analysis = analyzeProperty(propertyData, strMetrics);
      }

      setAnalysisResult(analysis);

      // Save to recent analyses
      const updated = [analysis, ...(recentAnalyses as AnalysisResult[]).slice(0, 9)];
      await AsyncStorage.setItem('recentAnalyses', JSON.stringify(updated));

      Alert.alert(
        'Analysis Complete',
        analysis.meetsCriteria
          ? 'This property meets your investment criteria!'
          : 'This property does not meet your investment criteria.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to analyze property');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Property Analyzer</Text>
          <Text style={styles.subtitle}>Analyze real estate investments</Text>
        </View>

        <Card>
          <CardHeader>
            <Text style={styles.sectionTitle}>Upload Property Data</Text>
          </CardHeader>
          <CardContent>
            <View style={styles.buttonRow}>
              <Button
                title="Pick PDF/Document"
                onPress={handlePickDocument}
                variant="outline"
                style={styles.fileButton}
              />
              <Button
                title="Pick Image"
                onPress={handlePickImage}
                variant="outline"
                style={styles.fileButton}
              />
            </View>
            {selectedFile && (
              <View style={styles.fileInfo}>
                <Ionicons name="document" size={20} color="#007AFF" />
                <Text style={styles.fileName} numberOfLines={1}>
                  {selectedFile.name || 'Selected file'}
                </Text>
              </View>
            )}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Input
              label="Property URL"
              placeholder="Enter property listing URL"
              value={propertyUrl}
              onChangeText={setPropertyUrl}
              keyboardType="url"
              autoCapitalize="none"
            />
            <Button
              title="Extract from URL"
              onPress={handleExtractFromUrl}
              variant="outline"
              loading={isAnalyzing}
              style={styles.extractButton}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Text style={styles.sectionTitle}>Property Details</Text>
          </CardHeader>
          <CardContent>
            <Input
              label="Purchase Price"
              placeholder="Enter purchase price"
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              keyboardType="numeric"
            />
            <Input
              label="Monthly Rent (LTR)"
              placeholder="Enter monthly rent"
              value={monthlyRent}
              onChangeText={setMonthlyRent}
              keyboardType="numeric"
            />

            <Text style={styles.subsectionTitle}>Short-Term Rental (Optional)</Text>
            <Input
              label="ADR (Average Daily Rate)"
              placeholder="Enter ADR"
              value={adr}
              onChangeText={setAdr}
              keyboardType="numeric"
            />
            <Input
              label="Occupancy Rate (%)"
              placeholder="Enter occupancy rate"
              value={occupancyRate}
              onChangeText={setOccupancyRate}
              keyboardType="numeric"
            />
          </CardContent>
        </Card>

        <Button
          title={isAnalyzing ? 'Analyzing...' : 'Analyze Property'}
          onPress={handleAnalyze}
          loading={isAnalyzing}
          style={styles.analyzeButton}
        />

        {analysisResult && (
          <Card style={styles.resultCard}>
            <CardHeader>
              <Text style={styles.sectionTitle}>Analysis Results</Text>
            </CardHeader>
            <CardContent>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Cash Flow:</Text>
                <Text style={[
                  styles.resultValue,
                  analysisResult.cashFlow >= 0 ? styles.positive : styles.negative
                ]}>
                  ${analysisResult.cashFlow.toFixed(2)}/month
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Cash-on-Cash Return:</Text>
                <Text style={styles.resultValue}>
                  {(analysisResult.cocReturn * 100).toFixed(2)}%
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Cap Rate:</Text>
                <Text style={styles.resultValue}>
                  {(analysisResult.capRate * 100).toFixed(2)}%
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Meets Criteria:</Text>
                <Text style={[
                  styles.resultValue,
                  analysisResult.meetsCriteria ? styles.positive : styles.negative
                ]}>
                  {analysisResult.meetsCriteria ? 'Yes ✓' : 'No ✗'}
                </Text>
              </View>

              <View style={styles.buttonRow}>
                <Button
                  title="View Details"
                  onPress={() => navigation.navigate('Analyze', { initialData: analysisResult })}
                  variant="outline"
                  style={styles.detailButton}
                />
                <Button
                  title="Add to Compare"
                  onPress={() => navigation.navigate('Comparison')}
                  variant="secondary"
                  style={styles.detailButton}
                />
              </View>
            </CardContent>
          </Card>
        )}

        {recentAnalyses && (recentAnalyses as AnalysisResult[]).length > 0 && (
          <Card>
            <CardHeader>
              <Text style={styles.sectionTitle}>Recent Analyses</Text>
            </CardHeader>
            <CardContent>
              {(recentAnalyses as AnalysisResult[]).slice(0, 5).map((analysis, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentItem}
                  onPress={() => setAnalysisResult(analysis)}
                >
                  <Text style={styles.recentAddress}>
                    {analysis.property?.address || 'Unknown Address'}
                  </Text>
                  <Text style={styles.recentPrice}>
                    ${analysis.property?.purchasePrice?.toLocaleString() || 'N/A'}
                  </Text>
                </TouchableOpacity>
              ))}
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  fileButton: {
    flex: 1,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E5F2FF',
    borderRadius: 8,
    marginTop: 8,
  },
  fileName: {
    marginLeft: 8,
    flex: 1,
    color: '#007AFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#8E8E93',
    fontSize: 14,
  },
  extractButton: {
    marginTop: 8,
  },
  analyzeButton: {
    marginTop: 16,
    marginBottom: 16,
  },
  resultCard: {
    marginTop: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  resultLabel: {
    fontSize: 16,
    color: '#000000',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  positive: {
    color: '#34C759',
  },
  negative: {
    color: '#FF3B30',
  },
  detailButton: {
    flex: 1,
  },
  recentItem: {
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginBottom: 8,
  },
  recentAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  recentPrice: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
