# Mobile App Setup Guide

This guide will help you get the DealAnalyzer mobile app running on your development machine.

## Quick Start

```bash
# 1. Navigate to mobile directory
cd mobile

# 2. Install dependencies
npm install

# 3. Link shared types (optional but recommended)
./link-shared.sh

# 4. Start Expo dev server
npx expo start

# 5. Run on device/simulator
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Or scan QR code with Expo Go app
```

## Detailed Setup

### 1. System Requirements

**Required:**
- Node.js 18 or newer
- npm or yarn
- Git

**For iOS development (Mac only):**
- macOS
- Xcode 14 or newer
- iOS Simulator
- CocoaPods: `sudo gem install cocoapods`

**For Android development:**
- Android Studio
- Android SDK (API 33 or higher recommended)
- Android Emulator or physical device

### 2. Install Dependencies

```bash
cd mobile
npm install
```

This installs:
- Expo SDK
- React Navigation
- Axios (API client)
- TypeScript types
- UI components

### 3. Backend Configuration

#### Local Development

When developing locally, the app needs to connect to your backend server.

**Option A: Use Production Backend (Easiest)**

No configuration needed! The app will connect to `https://comfort-finder-analyzer.vercel.app` by default.

**Option B: Use Local Backend**

1. Start your local backend server:
   ```bash
   cd .. # Navigate to root directory
   npm run dev # Start Next.js dev server
   ```

2. Update the API URL in `src/services/api.ts`:
   ```typescript
   const API_URL = __DEV__
     ? 'http://localhost:3000'  // Local dev
     : 'https://comfort-finder-analyzer.vercel.app';
   ```

3. **For Android Emulator**, use `10.0.2.2` instead:
   ```typescript
   const API_URL = __DEV__
     ? 'http://10.0.2.2:3000'  // Android emulator
     : 'https://comfort-finder-analyzer.vercel.app';
   ```

4. **For Physical Device**, use your computer's local IP:
   ```typescript
   const API_URL = __DEV__
     ? 'http://192.168.1.XXX:3000'  // Replace with your IP
     : 'https://comfort-finder-analyzer.vercel.app';
   ```

   Find your IP:
   - Mac: System Preferences → Network
   - Windows: `ipconfig` in Command Prompt
   - Linux: `ip addr show`

### 4. Run the App

#### Using Expo Go (Easiest)

1. Install Expo Go on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Start the dev server:
   ```bash
   npx expo start
   ```

3. Scan the QR code:
   - iOS: Use Camera app
   - Android: Use Expo Go app

#### Using iOS Simulator (Mac only)

```bash
npm run ios
```

Or in the Expo terminal, press `i`.

First time setup:
1. Open Xcode
2. Preferences → Locations → Command Line Tools → Select Xcode version
3. Close Xcode
4. Run `npm run ios` again

#### Using Android Emulator

1. Open Android Studio
2. AVD Manager → Create Virtual Device
3. Select a device (Pixel 5 recommended)
4. Download system image (API 33+)
5. Start emulator

Then run:
```bash
npm run android
```

Or in the Expo terminal, press `a`.

### 5. Verify Connection

Once the app is running:

1. Check the home screen loads
2. Navigate to "Deals" tab
3. If you see an error, check:
   - Is your backend server running?
   - Is the API URL correct in `src/services/api.ts`?
   - Are you on the same network (for local dev)?

### 6. Enable Hot Reload

Expo automatically reloads when you save files. You can also:
- Shake device → Reload
- Press `r` in terminal → Reload
- Press `m` in terminal → Toggle menu

## Troubleshooting

### "Unable to resolve module"
```bash
# Clear cache and restart
npx expo start -c
```

### "Network request failed"
- Check backend is running
- Verify API URL in `src/services/api.ts`
- For Android, use `10.0.2.2` instead of `localhost`
- For physical device, use local IP and ensure same WiFi

### iOS build errors
```bash
cd ios
pod install
cd ..
npm run ios
```

### Android build errors
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### TypeScript errors
```bash
# Check types without building
npx tsc --noEmit

# Fix common issues
npm install --save-dev @types/react @types/react-native
```

### Expo Go not connecting
- Ensure phone and computer on same WiFi
- Disable VPN
- Check firewall settings
- Try mobile hotspot

## Development Workflow

### Daily Development

1. Start backend (if using local):
   ```bash
   cd .. && npm run dev
   ```

2. Start mobile app:
   ```bash
   cd mobile && npx expo start
   ```

3. Open on device/simulator

4. Make changes - app auto-reloads

### Adding New Screens

1. Create screen component in `src/screens/`
2. Add route to `src/navigation/AppNavigator.tsx`
3. Add navigation type to `RootStackParamList`

Example:
```typescript
// src/screens/NewScreen.tsx
export default function NewScreen() {
  return <View><Text>New Screen</Text></View>;
}

// src/navigation/AppNavigator.tsx
import NewScreen from '../screens/NewScreen';

// Add to type
export type RootStackParamList = {
  // ... existing
  NewScreen: undefined;
};

// Add to navigator
<Stack.Screen name="NewScreen" component={NewScreen} />
```

### Using Backend APIs

Import the API client:
```typescript
import api from '../services/api';

// In your component
const fetchDeals = async () => {
  try {
    const response = await api.getEmailDeals();
    setDeals(response.data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Testing

### Manual Testing Checklist

- [ ] Home screen loads
- [ ] Bottom navigation works
- [ ] API calls succeed
- [ ] Error handling displays properly
- [ ] Loading states show
- [ ] Pull to refresh works (Deals screen)
- [ ] Navigation between screens
- [ ] Back button works
- [ ] Test on both iOS and Android

### Automated Testing (Future)

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Building for Production

See the main [README.md](README.md#building-for-production) for production build instructions using EAS (Expo Application Services).

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Need Help?

- Check the [main README](./README.md)
- Review backend API docs
- Check Expo documentation
- Look for similar issues on GitHub

## Next Steps

1. ✅ Complete setup following this guide
2. Run the app and explore features
3. Review the codebase structure
4. Try making a small change
5. Start building new features!

Happy coding! 🚀
