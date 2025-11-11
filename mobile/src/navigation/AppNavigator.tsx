import React from 'react';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import DealsScreen from '../screens/DealsScreen';
import DealDetailScreen from '../screens/DealDetailScreen';
import MarketScreen from '../screens/MarketScreen';
import SearchScreen from '../screens/SearchScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AnalyzeScreen from '../screens/AnalyzeScreen';
import { navigationRef } from './navigationRef';

export type TabParamList = {
  Home: undefined;
  Deals: undefined;
  Market: undefined;
  Search: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  DealDetail: { dealId: string };
  Analyze: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Deals':
              iconName = focused ? 'mail' : 'mail-outline';
              break;
            case 'Market':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'DealAnalyzer' }}
      />
      <Tab.Screen
        name="Deals"
        component={DealsScreen}
        options={{ title: 'Email Deals' }}
      />
      <Tab.Screen
        name="Market"
        component={MarketScreen}
        options={{ title: 'Market Intelligence' }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Search Properties' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator>
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DealDetail"
          component={DealDetailScreen}
          options={{ title: 'Deal Details' }}
        />
        <Stack.Screen
          name="Analyze"
          component={AnalyzeScreen}
          options={{ title: 'Analyze Property' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
