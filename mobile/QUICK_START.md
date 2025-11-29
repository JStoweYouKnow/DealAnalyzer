# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Configure Environment

Edit `app.json` and add your credentials:

```json
{
  "extra": {
    "clerkPublishableKey": "pk_test_...",
    "convexUrl": "https://your-deployment.convex.cloud",
    "apiUrl": "http://localhost:3002"
  }
}
```

### 3. Start Development Server
```bash
npm start
```

### 4. Run on Device
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## 📱 What's Ready

✅ **Authentication** - Sign in/Sign up screens  
✅ **Navigation** - Bottom tabs + stack navigation  
✅ **API Client** - Configured with auth  
✅ **Account Screen** - User settings  
✅ **Project Structure** - All folders and files organized  

## 🔨 What Needs Work

⚠️ **Screens** - Need to port full functionality from web app  
⚠️ **Components** - Need to create mobile UI components  
⚠️ **Business Logic** - Need to port analysis and data processing  

## 📚 Next Steps

1. Read `SETUP_GUIDE.md` for detailed instructions
2. Read `MOBILE_APP_SUMMARY.md` for implementation status
3. Start porting screens one at a time
4. Test on devices frequently

## 💡 Tips

- Start with `HomeScreen.tsx` - it's the main feature
- Use the web app (`/app/`) as reference
- Test on real devices early
- Keep mobile UX in mind (touch targets, gestures)

## 🆘 Need Help?

- Check `SETUP_GUIDE.md` for detailed setup
- Check `MOBILE_APP_SUMMARY.md` for status
- Review web app code in `/app/` directory
- Expo docs: https://docs.expo.dev/

