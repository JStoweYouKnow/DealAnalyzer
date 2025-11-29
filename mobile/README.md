# Deal Analyzer Mobile App

A React Native mobile application that provides a 1-to-1 copy of the web experience, optimized for mobile devices.

## Features

- ✅ Property Analysis - Upload PDFs, paste email content, or enter manually
- ✅ Email Deal Management - View and analyze deals from your inbox
- ✅ Market Intelligence - Get market trends and comparable sales
- ✅ Property Search - Advanced search with natural language queries
- ✅ Property Comparison - Side-by-side comparison of multiple properties
- ✅ Account Management - User settings and preferences
- ✅ Authentication - Clerk integration for secure login
- ✅ Real-time Data - Convex backend integration

## Tech Stack

- **React Native** 0.76.5
- **Expo SDK** 52
- **TypeScript** 5.6
- **React Navigation** 7.x
- **Clerk** - Authentication
- **Convex** - Backend/Real-time data
- **React Query** - Data fetching and caching
- **Axios** - HTTP client

## Setup Instructions

### Prerequisites

- Node.js 20.x or later
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Studio (for Android development)

### Installation

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Configure environment variables:**
   
   Create a `.env` file in the `mobile` directory:
   ```env
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   EXPO_PUBLIC_CONVEX_URL=your_convex_url
   EXPO_PUBLIC_API_URL=http://localhost:3002
   ```
   
   Or update `app.json` extra section with your values.

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on iOS:**
   ```bash
   npm run ios
   ```

5. **Run on Android:**
   ```bash
   npm run android
   ```

## Project Structure

```
mobile/
├── App.tsx                 # Main app entry point with providers
├── app.json                # Expo configuration
├── assets/                 # Images, icons, fonts
├── src/
│   ├── components/         # Reusable UI components
│   ├── navigation/         # Navigation configuration
│   ├── screens/            # Screen components
│   ├── services/           # API and business logic
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
└── package.json
```

## Key Features Implementation

### Authentication
- Uses Clerk Expo SDK for authentication
- Secure token storage with Expo SecureStore
- Automatic token refresh

### API Integration
- Centralized API client with axios
- Automatic authentication header injection
- Error handling and retry logic
- React Query for data fetching and caching

### Navigation
- Bottom tab navigation for main screens
- Stack navigation for detail screens
- Deep linking support

### Data Management
- React Query for server state
- AsyncStorage for local persistence
- Convex for real-time data

## Development

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Building for Production

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

## Environment Variables

Update `app.json` or use `.env` file:

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `EXPO_PUBLIC_CONVEX_URL` - Convex deployment URL
- `EXPO_PUBLIC_API_URL` - API base URL (defaults to localhost:3002 in dev)

## Notes

- The app is designed to be a 1-to-1 copy of the web experience
- All features from the web app are available in the mobile version
- UI is optimized for mobile with touch-friendly interactions
- Uses native mobile components where appropriate
