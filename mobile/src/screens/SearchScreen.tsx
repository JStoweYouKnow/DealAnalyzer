import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { useApiClient } from '../services/api';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const apiClient = useApiClient();

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['property-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      try {
        const response = await apiClient.post('/search/natural-language', {
          query: searchQuery,
        });
        const data = response.data || response;
        return data.properties || [];
      } catch (err: any) {
        console.error('Failed to search properties:', err);
        return [];
      }
    },
    enabled: false, // Manual trigger
    retry: false,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }
    setIsSearching(true);
    // Trigger query manually
    setIsSearching(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Property Search</Text>
          <Text style={styles.subtitle}>
            Search for properties using natural language
          </Text>
        </View>

        <Card>
          <CardContent>
            <Input
              label="Search Query"
              placeholder="e.g., 3 bedroom house in Austin under $300k"
              value={searchQuery}
              onChangeText={setSearchQuery}
              multiline
              style={styles.searchInput}
            />
            <Button
              title="Search"
              onPress={handleSearch}
              loading={isSearching || isLoading}
              style={styles.searchButton}
            />
          </CardContent>
        </Card>

        {isLoading ? (
          <Loading message="Searching properties..." />
        ) : searchResults.length > 0 ? (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              Found {searchResults.length} properties
            </Text>
            {searchResults.map((property: any, index: number) => (
              <Card key={index} style={styles.propertyCard}>
                <CardContent>
                  <Text style={styles.propertyAddress}>
                    {property.address || 'Unknown Address'}
                  </Text>
                  {property.price && (
                    <Text style={styles.propertyPrice}>
                      ${property.price.toLocaleString()}
                    </Text>
                  )}
                  <View style={styles.propertyDetails}>
                    {property.bedrooms && (
                      <View style={styles.detailItem}>
                        <Ionicons name="bed-outline" size={16} color="#8E8E93" />
                        <Text style={styles.detailText}>{property.bedrooms} beds</Text>
                      </View>
                    )}
                    {property.bathrooms && (
                      <View style={styles.detailItem}>
                        <Ionicons name="water-outline" size={16} color="#8E8E93" />
                        <Text style={styles.detailText}>
                          {property.bathrooms} baths
                        </Text>
                      </View>
                    )}
                    {property.squareFootage && (
                      <View style={styles.detailItem}>
                        <Ionicons name="square-outline" size={16} color="#8E8E93" />
                        <Text style={styles.detailText}>
                          {property.squareFootage.toLocaleString()} sqft
                        </Text>
                      </View>
                    )}
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        ) : searchQuery ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>No properties found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search criteria
            </Text>
          </View>
        ) : null}
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
  searchInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  searchButton: {
    marginTop: 16,
  },
  resultsContainer: {
    marginTop: 24,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  propertyCard: {
    marginBottom: 12,
  },
  propertyAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
  },
  propertyDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
});
