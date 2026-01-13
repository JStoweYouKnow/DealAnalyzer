import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

// Import actual screens
import HomeScreen from '../screens/HomeScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import AnalyzeScreen from '../screens/AnalyzeScreen';
import DealsScreen from '../screens/DealsScreen';
import MarketScreen from '../screens/MarketScreen';
import AccountScreen from '../screens/AccountScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Analyze') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Deals') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Market') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Analyze" component={AnalyzeScreen} />
      <Tab.Screen name="Deals" component={DealsScreen} />
      <Tab.Screen name="Market" component={MarketScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    console.log('[AppNavigator] MOUNTED');
    return () => console.log('[AppNavigator] UNMOUNTED');
  }, []);

  useEffect(() => {
    console.log('[AppNavigator] Auth state changed:', { isSignedIn, isLoaded });
  }, [isSignedIn, isLoaded]);

  console.log('[AppNavigator] Rendering...', { isSignedIn, isLoaded });

  // Show loading state while auth is loading
  if (!isLoaded) {
    console.log('[AppNavigator] Showing loading screen');
    return (
      <View style={[styles.container, { backgroundColor: '#FFF3CD' }]}>
        <Text style={[styles.text, { fontSize: 24 }]}>⏳ Loading Auth...</Text>
      </View>
    );
  }

  console.log('[AppNavigator] Auth loaded, rendering NavigationContainer');

  return (
    <NavigationContainer
      onReady={() => console.log('[NavigationContainer] Ready')}
      onStateChange={(state) => console.log('[NavigationContainer] State changed:', state?.routes?.[0]?.name)}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isSignedIn ? (
          // Authenticated: Show main app with bottom tabs
          <Stack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          // Not authenticated: Show sign-in/sign-up
          <>
            <Stack.Screen
              name="SignIn"
              component={SignInScreen}
              options={{ title: 'Sign In' }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ title: 'Sign Up' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  text: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
});
