import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { setupNavigationGuards } from '../utils/navigationGuards';
import { setupKeyboardDismissOnNavigation } from '../utils/textInputSafety';
import { Keyboard } from 'react-native';

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
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);
  const [startTime] = React.useState(Date.now());

  // Add timeout to detect if Clerk is stuck loading
  React.useEffect(() => {
    const elapsed = Date.now() - startTime;
    console.log('[AppNavigator] Clerk loading state:', { 
      isLoaded, 
      isSignedIn,
      elapsedMs: elapsed,
      elapsedSeconds: Math.round(elapsed / 1000)
    });
    
    // Always initialize variables (React requirement)
    let interval: NodeJS.Timeout | null = null;
    let timeout: NodeJS.Timeout | null = null;
    
    // Log every 2 seconds while loading
    if (!isLoaded) {
      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        console.log('[AppNavigator] Still loading...', {
          elapsedSeconds: Math.round(elapsed / 1000),
          isLoaded,
        });
      }, 2000);

      timeout = setTimeout(() => {
        if (!isLoaded) {
          console.error('[AppNavigator] ⚠️ Clerk is taking too long to load (>10s).');
          console.error('[AppNavigator] Possible causes:');
          console.error('  1. Network connectivity issue');
          console.error('  2. Invalid or malformed publishable key');
          console.error('  3. Clerk instance not accessible');
          console.error('  4. Firewall/VPN blocking Clerk servers');
          setLoadingTimeout(true);
        }
      }, 10000); // 10 second timeout
    }

    // Always return cleanup function (React requirement)
    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoaded, startTime]);

  if (!isLoaded) {
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    
    // Show loading screen with progress and timeout warning
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20 }}>
        <ActivityIndicator size="large" color="#007AFF" style={{ marginBottom: 20 }} />
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>Loading...</Text>
        <Text style={{ fontSize: 14, color: '#8E8E93', marginBottom: 20 }}>
          Initializing authentication ({elapsedSeconds}s)
        </Text>
        
        {elapsedSeconds > 10 && (
          <View style={{ marginTop: 20, padding: 15, backgroundColor: '#FFF3CD', borderRadius: 8, maxWidth: 300 }}>
            <Text style={{ fontSize: 14, color: '#856404', fontWeight: '600', marginBottom: 8 }}>
              ⚠️ Slow Connection Detected
            </Text>
            <Text style={{ fontSize: 12, color: '#856404', lineHeight: 18 }}>
              Clerk is taking longer than expected to initialize. This usually indicates:{'\n\n'}
              • Network connectivity issues{'\n'}
              • DNS resolution problems{'\n'}
              • Firewall/VPN blocking{'\n'}
              • Slow internet connection{'\n\n'}
              Please check your internet connection or try a different network.
            </Text>
          </View>
        )}
        
        {loadingTimeout && (
          <View style={{ marginTop: 20, padding: 15, backgroundColor: '#F8D7DA', borderRadius: 8, maxWidth: 300 }}>
            <Text style={{ fontSize: 14, color: '#721C24', fontWeight: '600', marginBottom: 8 }}>
              ❌ Connection Timeout
            </Text>
            <Text style={{ fontSize: 12, color: '#721C24', lineHeight: 18 }}>
              Clerk failed to initialize after 10 seconds.{'\n\n'}
              Troubleshooting steps:{'\n'}
              1. Check your internet connection{'\n'}
              2. Try a different network (WiFi/cellular){'\n'}
              3. Disable VPN if active{'\n'}
              4. Check firewall settings{'\n'}
              5. Restart the app
            </Text>
          </View>
        )}
      </View>
    );
  }

  console.log('[AppNavigator] Auth state - isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);

  // Setup navigation guards to prevent crashes
  // Only run once when component mounts and navigation is ready
  React.useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let keyboardUnsubscribe: (() => void) | undefined;
    
    // Use a small delay to ensure navigation ref is fully initialized
    const timer = setTimeout(() => {
      if (navigationRef.current) {
        try {
          unsubscribe = setupNavigationGuards(navigationRef.current);
          // Also setup keyboard dismissal on navigation
          keyboardUnsubscribe = setupKeyboardDismissOnNavigation(navigationRef.current, true);
        } catch (error) {
          console.error('[AppNavigator] Error setting up navigation guards:', error);
        }
      }
    }, 100);

    // Always return cleanup function (React requirement)
    return () => {
      clearTimeout(timer);
      unsubscribe?.();
      keyboardUnsubscribe?.();
    };
  }, []); // Empty deps - only run once on mount

  return (
    <NavigationContainer 
      ref={navigationRef}
      onReady={() => {
        console.log('[Navigation] Container ready');
      }}
      onStateChange={(state) => {
        console.log('[Navigation] State changed:', state?.routes[state?.routes.length - 1]?.name);
        // Dismiss keyboard on navigation state change
        Keyboard.dismiss();
      }}
    >
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
              options={{ 
                title: 'Preferences',
                headerBackTitle: 'Settings'
              }}
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
