# Local API Server Setup

## Current Status

✅ **Next.js server is running** on port 3002
✅ **API is accessible** at `http://localhost:3002`

## Configuration

### For iOS Simulator / Android Emulator

Use `localhost` (already configured):
```bash
EXPO_PUBLIC_API_URL=http://localhost:3002
```

### For Physical Device

Use your computer's IP address:
```bash
EXPO_PUBLIC_API_URL=http://192.168.1.94:3002
```

**Your current IP**: `192.168.1.94`

## Quick Setup

1. **If using simulator/emulator** (current config):
   - Already set to `http://localhost:3002` ✅
   - Just restart Expo: `npx expo start --clear`

2. **If using physical device**:
   - Edit `.env.local` and change to:
     ```bash
     EXPO_PUBLIC_API_URL=http://192.168.1.94:3002
     ```
   - Restart Expo: `npx expo start --clear`
   - **Important**: Ensure device and computer are on the same WiFi network

## Verify Setup

After restarting, check logs for:
```
[API Config] ✅ Using configured API URL: http://localhost:3002
```

Or for physical device:
```
[API Config] ✅ Using configured API URL: http://192.168.1.94:3002
```

## Troubleshooting

### "Server can't be found" on Physical Device

1. **Check WiFi**: Device and computer must be on same network
2. **Check IP**: Your IP is `192.168.1.94` (may change if you reconnect to WiFi)
3. **Check Firewall**: macOS firewall might be blocking connections
   ```bash
   # Allow incoming connections on port 3002
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
   ```

### IP Address Changed?

If your IP changes, update `.env.local`:
```bash
# Find new IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Update .env.local
EXPO_PUBLIC_API_URL=http://YOUR_NEW_IP:3002
```

## Production

For production builds, the API URL is configured in `eas.json`:
- Preview/Production: `https://comfortfinder.projcomfort.com`
- This will work once the domain is properly configured

