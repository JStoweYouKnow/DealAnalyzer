# API Setup Guide

## Configuration

To fix the "Provided address was not an absolute URL" error, you need to configure the API URL in `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:3002"
    }
  }
}
```

## Development Setup

### For iOS Simulator / Android Emulator
Use `localhost`:
```json
"apiUrl": "http://localhost:3002"
```

### For Physical Devices
Use your computer's IP address:
1. Find your computer's IP address:
   - Mac/Linux: `ifconfig | grep "inet "`
   - Windows: `ipconfig`
2. Update `app.json`:
```json
"apiUrl": "http://192.168.1.100:3002"
```
(Replace `192.168.1.100` with your actual IP)

### For Production
Use your production API URL:
```json
"apiUrl": "https://your-api-domain.com"
```

## Environment Variables Alternative

You can also set `EXPO_PUBLIC_API_URL` in a `.env` file:
```
EXPO_PUBLIC_API_URL=http://localhost:3002
```

## Testing

After updating the configuration:
1. Stop the Metro bundler (Ctrl+C)
2. Clear cache: `npx expo start --clear`
3. Restart the app

The error should be resolved once a valid API URL is configured.

