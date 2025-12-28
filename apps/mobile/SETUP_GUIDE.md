# Mobile App Setup Guide

This guide will help you complete the mobile app setup and port all features from the web application.

## ✅ Completed Setup

1. **Project Structure** - React Native Expo project initialized
2. **Dependencies** - Latest versions of all required packages installed
3. **Navigation** - Navigation structure with tabs and stack navigators
4. **Authentication** - Clerk integration configured
5. **API Client** - Axios-based API client with auth support
6. **Type Definitions** - TypeScript types matching web app schema
7. **Providers** - React Query, Convex, and Clerk providers set up

## 📋 Next Steps

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment Variables

Update `app.json` extra section or create `.env` file:

```json
{
  "extra": {
    "clerkPublishableKey": "pk_test_...",
    "convexUrl": "https://your-deployment.convex.cloud",
    "apiUrl": "https://your-api-url.com"
  }
}
```

### 3. Port Screens

The following screens need to be fully implemented:

#### HomeScreen (`src/screens/HomeScreen.tsx`)
- Port the analyzer form component
- Add property analysis functionality
- Implement recent analyses display
- Add quick compare feature

#### DealsScreen (`src/screens/DealsScreen.tsx`)
- List email deals from API
- Implement filtering and search
- Add deal status management
- Connect to email forwarding setup

#### AnalyzeScreen (`src/screens/AnalyzeScreen.tsx`)
- Port analyzer form with all input fields
- Add file upload (PDF, images)
- Implement analysis results display
- Add mortgage calculator integration

#### MarketScreen (`src/screens/MarketScreen.tsx`)
- Port market intelligence component
- Add market data visualization
- Implement comparable sales
- Add neighborhood trends

#### SearchScreen (`src/screens/SearchScreen.tsx`)
- Port advanced search component
- Add natural language search
- Implement search history
- Add filters and criteria

#### ComparisonScreen (`src/screens/ComparisonScreen.tsx`)
- Port comparison dashboard
- Add property selection
- Implement side-by-side comparison
- Add export functionality

#### AccountScreen (`src/screens/AccountScreen.tsx`)
- Port account settings
- Add criteria configuration
- Implement user preferences
- Add email forwarding setup

### 4. Create UI Components

Create mobile-optimized versions of web components in `src/components/`:

- **Button** - Touch-friendly button component
- **Card** - Container component for content
- **Input** - Text input with validation
- **Select** - Dropdown/picker component
- **Modal** - Full-screen and bottom sheet modals
- **Toast** - Notification system
- **Loading** - Loading states and skeletons
- **Charts** - Data visualization (use react-native-chart-kit or victory-native)

### 5. Port Business Logic

Copy and adapt from web app:

- **Property Analyzer** (`src/services/propertyAnalyzer.ts`)
- **File Parser** (`src/services/fileParser.ts`)
- **PDF Extractor** (`src/services/pdfExtractor.ts`)
- **API Services** (`src/services/`)

### 6. Add Mobile-Specific Features

- **File Picker** - Use `expo-document-picker` for PDFs
- **Image Picker** - Use `expo-image-picker` for photos
- **Push Notifications** - For deal alerts
- **Offline Support** - Cache data with AsyncStorage
- **Deep Linking** - Handle app links and universal links

## 🔧 Key Files to Update

### Screens
- `src/screens/HomeScreen.tsx` - Main analyzer screen
- `src/screens/DealsScreen.tsx` - Email deals list
- `src/screens/AnalyzeScreen.tsx` - Property analysis form
- `src/screens/MarketScreen.tsx` - Market intelligence
- `src/screens/SearchScreen.tsx` - Property search
- `src/screens/ComparisonScreen.tsx` - Property comparison
- `src/screens/AccountScreen.tsx` - User account
- `src/screens/SignInScreen.tsx` - Authentication
- `src/screens/SignUpScreen.tsx` - Registration

### Services
- `src/services/api.ts` - API client (✅ Done)
- `src/services/propertyAnalyzer.ts` - Analysis logic
- `src/services/fileParser.ts` - File parsing
- `src/services/storage.ts` - Local storage utilities

### Components
- `src/components/ui/` - Reusable UI components
- `src/components/forms/` - Form components
- `src/components/charts/` - Data visualization

## 📱 Mobile Optimizations

1. **Touch Targets** - Minimum 44x44 points
2. **Swipe Gestures** - Add swipe actions where appropriate
3. **Pull to Refresh** - For lists and data
4. **Infinite Scroll** - For long lists
5. **Keyboard Handling** - Proper keyboard avoidance
6. **Safe Areas** - Handle notches and status bars
7. **Performance** - Optimize images and lazy load

## 🧪 Testing

1. **iOS Simulator** - Test on different iPhone sizes
2. **Android Emulator** - Test on different Android devices
3. **Physical Devices** - Test on real devices
4. **Network Conditions** - Test offline and slow connections

## 🚀 Building

### Development Build
```bash
expo start --dev-client
```

### Production Build
```bash
eas build --platform ios
eas build --platform android
```

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Clerk React Native](https://clerk.com/docs/quickstarts/expo)
- [Convex React Native](https://docs.convex.dev/client/react-native)
- [React Query](https://tanstack.com/query/latest)

## 🔄 Porting Checklist

- [ ] All screens implemented
- [ ] UI components created
- [ ] Business logic ported
- [ ] API integration complete
- [ ] Authentication working
- [ ] File upload working
- [ ] Charts and visualizations
- [ ] Offline support
- [ ] Push notifications
- [ ] Deep linking
- [ ] Error handling
- [ ] Loading states
- [ ] Testing complete

## 💡 Tips

1. **Start Small** - Port one screen at a time
2. **Reuse Logic** - Share business logic between web and mobile
3. **Test Early** - Test on devices early and often
4. **Performance** - Monitor bundle size and performance
5. **User Experience** - Optimize for mobile interactions

