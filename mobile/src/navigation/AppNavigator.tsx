import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';

// Screens
import HomeScreen from '../screens/HomeScreen';
import DealsScreen from '../screens/DealsScreen';
import DealDetailScreen from '../screens/DealDetailScreen';
import MarketScreen from '../screens/MarketScreen';
import NeighborhoodScreen from '../screens/NeighborhoodScreen';
import SearchScreen from '../screens/SearchScreen';
import AnalyzeScreen from '../screens/AnalyzeScreen';
import ComparisonScreen from '../screens/ComparisonScreen';
import AccountScreen from '../screens/AccountScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import EmailSettingsScreen from '../screens/EmailSettingsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import TermsPrivacyScreen from '../screens/TermsPrivacyScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import { navigationRef } from './navigationRef';
import { RootStackParamList, TabParamList } from '../types';

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
            case 'Account':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#000000',
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Analyzer' }}
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
        options={{ title: 'Search' }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{ title: 'Account' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    // Show loading screen
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  console.log('Auth state - isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#000000',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        {!isSignedIn ? (
          <>
            <Stack.Screen
              name="SignIn"
              component={SignInScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
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
            <Stack.Screen
              name="Comparison"
              component={ComparisonScreen}
              options={{ title: 'Compare Properties' }}
            />
            <Stack.Screen
              name="Account"
              component={AccountScreen}
              options={{ title: 'My Account' }}
            />
            <Stack.Screen
              name="Neighborhood"
              component={NeighborhoodScreen}
              options={{ title: 'Neighborhood Intelligence' }}
            />
            <Stack.Screen
              name="Preferences"
              component={PreferencesScreen}
              options={{ title: 'Preferences' }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ title: 'Notifications' }}
            />
            <Stack.Screen
              name="EmailSettings"
              component={EmailSettingsScreen}
              options={{ title: 'Email Settings' }}
            />
            <Stack.Screen
              name="HelpSupport"
              component={HelpSupportScreen}
              options={{ title: 'Help & Support' }}
            />
            <Stack.Screen
              name="TermsPrivacy"
              component={TermsPrivacyScreen}
              options={{ title: 'Terms & Privacy' }}
            />
            <Stack.Screen
              name="Subscription"
              component={SubscriptionScreen}
              options={{ title: 'Subscription' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
