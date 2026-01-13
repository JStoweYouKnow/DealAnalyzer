import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { CONFIG } from '../config';

const API_BASE_URL = CONFIG.apiUrl || 'https://comfortfinder.projcomfort.com';

interface SearchResult {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
}

export default function SearchScreen() {
  const navigation = useNavigation();
  const { getToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'natural' | 'address'>('natural');

  const { data: results = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: ['search-properties', searchQuery, searchType],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const token = await getToken();
      
      if (searchType === 'natural') {
        const response = await axios.post(
          `${API_BASE_URL}/api/search/natural-language`,
          { query: searchQuery },
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        return Array.isArray(response.data) ? response.data : response.data.data || [];
      } else {
        const response = await axios.get(
          `${API_BASE_URL}/api/search/properties?address=${encodeURIComponent(searchQuery)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        return Array.isArray(response.data) ? response.data : response.data.data || [];
      }
    },
    enabled: false, // Only search on button press
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }
    // Trigger query by invalidating
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Property Search</Text>
      <Text style={styles.subtitle}>Find properties by address or description</Text>

      {/* Search Type Toggle */}
      <View style={styles.section}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              searchType === 'natural' && styles.toggleButtonActive,
            ]}
            onPress={() => setSearchType('natural')}
          >
            <Text
              style={[
                styles.toggleButtonText,
                searchType === 'natural' && styles.toggleButtonTextActive,
              ]}
            >
              Natural Language
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              searchType === 'address' && styles.toggleButtonActive,
            ]}
            onPress={() => setSearchType('address')}
          >
            <Text
              style={[
                styles.toggleButtonText,
                searchType === 'address' && styles.toggleButtonTextActive,
              ]}
            >
              Address
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.section}>
        <TextInput
          style={styles.input}
          placeholder={
            searchType === 'natural'
              ? 'e.g., "3 bedroom house under $300k in Austin"'
              : 'Enter property address'
          }
          value={searchQuery}
          onChangeText={setSearchQuery}
          multiline={searchType === 'natural'}
          numberOfLines={searchType === 'natural' ? 3 : 1}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Results */}
      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {!isLoading && results.length === 0 && searchQuery && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No properties found</Text>
        </View>
      )}

      {results.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Found {results.length} {results.length === 1 ? 'property' : 'properties'}
          </Text>
          {results.map((result, index) => (
            <TouchableOpacity
              key={index}
              style={styles.resultCard}
              onPress={() => {
                // Navigate to property details or analyzer
                (navigation as any).navigate('Home');
              }}
            >
              <Text style={styles.resultAddress}>
                {result.address || 'Unknown Address'}
              </Text>
              {(result.city || result.state) && (
                <Text style={styles.resultLocation}>
                  {[result.city, result.state, result.zipCode]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              )}
              {result.price && (
                <Text style={styles.resultPrice}>
                  {formatCurrency(result.price)}
                </Text>
              )}
              {(result.bedrooms || result.bathrooms || result.sqft) && (
                <Text style={styles.resultDetails}>
                  {[
                    result.bedrooms && `${result.bedrooms} bed`,
                    result.bathrooms && `${result.bathrooms} bath`,
                    result.sqft && `${result.sqft.toLocaleString()} sqft`,
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!searchQuery && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Enter a search query above to find properties
          </Text>
        </View>
      )}
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
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  searchButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centered: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  resultAddress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  resultLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resultPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 14,
    color: '#666',
  },
});










