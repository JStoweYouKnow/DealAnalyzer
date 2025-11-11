# DealAnalyzer Mobile

Native mobile app for DealAnalyzer built with React Native and Expo.

## Overview

This mobile app shares the same backend API as the web application, allowing users to:
- Analyze real estate investment properties on the go
- View and manage email deals
- Access market intelligence and comparable sales data
- Search for properties
- Generate investment reports

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and build tools
- **TypeScript** - Type safety
- **React Navigation** - Screen navigation
- **Axios** - HTTP client for API calls

## Project Structure

```
mobile/
├── App.tsx                 # Root component
├── src/
│   ├── navigation/         # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── screens/            # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── DealsScreen.tsx
│   │   ├── DealDetailScreen.tsx
│   │   ├── MarketScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── AnalyzeScreen.tsx
│   ├── components/         # Reusable components
│   ├── services/           # API client
│   │   └── api.ts
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── assets/                 # Images, fonts, etc.
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- iOS: Xcode (Mac only) or iOS Simulator
- Android: Android Studio and Android SDK

### Installation

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

### Running on Devices

#### iOS (Mac only)
```bash
npm run ios
```

Or press `i` in the Expo terminal to open in iOS Simulator.

#### Android
```bash
npm run android
```

Or press `a` in the Expo terminal to open in Android Emulator.

#### Physical Device
1. Install the Expo Go app from App Store or Google Play
2. Scan the QR code shown in the terminal

## Backend Configuration

The app connects to the DealAnalyzer backend API. The API URL is configured in `src/services/api.ts`:

- **Development**: `http://localhost:3000` (your local server)
- **Production**: `https://comfort-finder-analyzer.vercel.app`

The app automatically uses the development URL when running with `__DEV__` flag.

### Testing with Local Backend

1. Start your local backend server:
   ```bash
   cd .. # Go to root directory
   npm run dev
   ```

2. Make sure your mobile device/simulator can reach your local machine:
   - iOS Simulator: Use `localhost`
   - Android Emulator: Use `10.0.2.2` instead of `localhost`
   - Physical device: Use your computer's local IP address

Update the development API URL in `src/services/api.ts` if needed.

## API Integration

All backend API endpoints are available through the `api` service:

```typescript
import api from '../services/api';

// Analyze property
const analysis = await api.analyzeProperty({
  emailContent: propertyDetails,
  fundingSource: 'cash',
});

// Get email deals
const deals = await api.getEmailDeals();

// Search properties
const results = await api.searchProperties(query);
```

See `src/services/api.ts` for all available methods.

## Authentication

The app will integrate with Clerk for authentication (same as web app):

1. Users sign in with the same credentials as the web app
2. Auth tokens are automatically added to API requests
3. Protected routes redirect to login when unauthenticated

## Building for Production

### iOS

1. Build for App Store:
   ```bash
   npx eas build --platform ios
   ```

2. Submit to App Store:
   ```bash
   npx eas submit --platform ios
   ```

### Android

1. Build for Google Play:
   ```bash
   npx eas build --platform android
   ```

2. Submit to Google Play:
   ```bash
   npx eas submit --platform android
   ```

## Development Roadmap

### Phase 1: Core Features (Current)
- [x] Project setup and navigation
- [x] API client integration
- [x] Home screen with feature cards
- [x] Email deals list
- [ ] Deal detail view with full analysis
- [ ] Property analysis form
- [ ] Market intelligence dashboard

### Phase 2: Enhanced Features
- [ ] Clerk authentication integration
- [ ] Push notifications for new deals
- [ ] Offline support with local caching
- [ ] Photo capture and analysis
- [ ] PDF report viewing
- [ ] Property comparison

### Phase 3: Advanced Features
- [ ] Dark mode support
- [ ] Customizable deal criteria
- [ ] Charts and data visualizations
- [ ] Map integration for property locations
- [ ] Saved searches and favorites
- [ ] Export capabilities

## Shared Code with Web App

The mobile and web apps share:
- **API Routes** - Same backend endpoints
- **Types/Schemas** - Can share TypeScript types (see `../shared/`)
- **Business Logic** - Property analysis calculations
- **Authentication** - Same Clerk setup

## Troubleshooting

### "Network request failed"
- Check that your backend server is running
- Verify the API URL in `src/services/api.ts`
- For Android emulator, use `10.0.2.2` instead of `localhost`

### Expo Go not connecting
- Ensure your mobile device and computer are on the same WiFi network
- Try scanning the QR code again
- Check firewall settings

### Build errors
- Clear the cache: `npx expo start -c`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npx tsc --noEmit`

## Contributing

1. Create a feature branch
2. Make your changes
3. Test on both iOS and Android
4. Submit a pull request

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [DealAnalyzer Web App](../)

## License

Same as the main DealAnalyzer project.
