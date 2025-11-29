import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  RECENT_ANALYSES: 'recentAnalyses',
  COMPARISON_PROPERTIES: 'comparisonProperties',
  MORTGAGE_VALUES: 'mortgageValues',
  USER_PREFERENCES: 'userPreferences',
} as const;

export const storage = {
  // Recent analyses
  async getRecentAnalyses() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_ANALYSES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get recent analyses:', error);
      return [];
    }
  },

  async saveRecentAnalysis(analysis: any) {
    try {
      const existing = await this.getRecentAnalyses();
      const updated = [analysis, ...existing.slice(0, 9)];
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_ANALYSES, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Failed to save recent analysis:', error);
      return false;
    }
  },

  async clearRecentAnalyses() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_ANALYSES);
      return true;
    } catch (error) {
      console.error('Failed to clear recent analyses:', error);
      return false;
    }
  },

  // Comparison properties
  async getComparisonProperties() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.COMPARISON_PROPERTIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get comparison properties:', error);
      return [];
    }
  },

  async addComparisonProperty(property: any) {
    try {
      const existing = await this.getComparisonProperties();
      const updated = [...existing, property];
      await AsyncStorage.setItem(STORAGE_KEYS.COMPARISON_PROPERTIES, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Failed to add comparison property:', error);
      return false;
    }
  },

  async clearComparisonProperties() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.COMPARISON_PROPERTIES);
      return true;
    } catch (error) {
      console.error('Failed to clear comparison properties:', error);
      return false;
    }
  },

  // Mortgage values
  async getMortgageValues() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MORTGAGE_VALUES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get mortgage values:', error);
      return null;
    }
  },

  async saveMortgageValues(values: any) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MORTGAGE_VALUES, JSON.stringify(values));
      return true;
    } catch (error) {
      console.error('Failed to save mortgage values:', error);
      return false;
    }
  },

  // User preferences
  async getUserPreferences() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {};
    }
  },

  async saveUserPreferences(preferences: any) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
      return true;
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      return false;
    }
  },
};

