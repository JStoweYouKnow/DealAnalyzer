# API Network Error Fix

## Problem
Getting "Network Error" when trying to fetch email deals and market data. This happens because the API URL is set to `http://localhost:3002` which isn't accessible from your device.

## Solutions

### Option 1: Use Your Computer's IP Address (For Development)

If you're running the API server locally on your computer:

1. **Find your computer's IP address:**
   ```bash
   # On Mac/Linux:
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # On Windows:
   ipconfig
   ```
   Look for something like `192.168.1.100` or `10.0.0.5`

2. **Update `app.json`:**
   ```json
   {
     "extra": {
       "apiUrl": "http://192.168.1.100:3002"
     }
   }
   ```
   Replace `192.168.1.100` with your actual IP address.

3. **Make sure your API server is running:**
   ```bash
   cd /Users/v/Downloads/DealAnalyzer
   npm run dev:next
   ```

4. **Restart the mobile app:**
   ```bash
   cd mobile
   npx expo start --clear
   ```

### Option 2: Use Production API URL (If Deployed)

If your web app is deployed to Vercel or another hosting service:

1. **Update `app.json` with your production URL:**
   ```json
   {
     "extra": {
       "apiUrl": "https://your-app-name.vercel.app"
     }
   }
   ```

2. **Restart the mobile app**

### Option 3: Disable API Features Temporarily

If you don't need the API features right now, the app will work with empty data. The screens will just show empty states.

## Current Configuration

Your `app.json` currently has:
```json
"apiUrl": "http://localhost:3002"
```

This only works if:
- You're using an iOS Simulator or Android Emulator
- The API server is running on your computer
- You're on the same network

## For Physical Devices

Physical devices cannot access `localhost` - you must use your computer's IP address or a production URL.

## Testing

After updating the API URL:
1. Stop the Metro bundler (Ctrl+C)
2. Clear cache: `npx expo start --clear`
3. Restart the app

The network errors should be resolved once the API URL is correctly configured.

