# Clerk Authentication Setup Guide

## Overview

This application uses **Clerk** for secure user authentication and session management. Clerk provides:
- ✅ Automatic session persistence (users stay logged in)
- ✅ Secure user data isolation
- ✅ OAuth support (Google, GitHub, etc.)
- ✅ Email/password and magic link authentication
- ✅ No need for manual token management

## Quick Setup

### 1. Create a Clerk Account

1. Go to https://clerk.com and sign up for a free account
2. Create a new application in the Clerk Dashboard
3. Choose your authentication methods (Email, Google, GitHub, etc.)

### 2. Get Your API Keys

In the Clerk Dashboard:
1. Go to **API Keys** in the sidebar
2. Copy your keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### 3. Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# Clerk Routes (Optional - these are the defaults)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### 4. Development vs Production

#### Development Mode (Default)
- Authentication is **optional**
- Fallback to browser session IDs
- Set `NODE_ENV=development` (default)

#### Production Mode
- Authentication is **required**
- All routes protected except public ones
- Set `NODE_ENV=production`

## How Session Persistence Works

### Clerk Handles Everything Automatically!

Clerk uses **HTTP-only cookies** to manage sessions:

1. **Login**: User signs in → Clerk creates secure session cookie
2. **Stay Logged In**: Cookie persists across:
   - Page refreshes
   - Browser restarts (if "Remember me" is checked)
   - Multiple tabs/windows
3. **Auto-Refresh**: Clerk automatically refreshes sessions before expiry
4. **Logout**: User signs out → Clerk clears the session cookie

**You don't need to do anything!** Clerk manages all of this automatically.

### Session Duration
By default, for new Clerk instances:
- **Maximum session lifetime**: 7 days
- **Inactivity timeout**: Disabled by default (can be enabled and adjusted up to 30 days)
- **Configurable**: Manage both in Clerk Dashboard → Sessions settings

## Data Privacy & Security

### Before (WITHOUT Clerk):
- ❌ All users shared the same hardcoded `userId = "temp-user-id"`
- ❌ Everyone could see everyone else's email deals
- ❌ No data isolation
- ❌ **CRITICAL SECURITY RISK**

### After (WITH Clerk):
- ✅ Each user gets a unique Clerk userId
- ✅ Data is isolated per user
- ✅ Users can only see their own email deals
- ✅ Convex queries filtered by userId
- ✅ **SECURE & PRIVATE**

## API Integration

The API routes automatically get the user ID:

```typescript
// app/api/email-deals/route.ts
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  // Clerk userId used to fetch only this user's data
  const emailDeals = await storage.getEmailDeals(userId);
  return NextResponse.json(emailDeals);
}
```

## Testing Authentication

### 1. Start Development Server
```bash
npm run dev
```

### 2. Sign Up
1. Go to http://localhost:3000
2. Click "Sign In" or "Sign Up"
3. Create an account (email or OAuth)

### 3. Verify Session Persistence
1. Sign in
2. Close browser
3. Reopen browser → You're still logged in! ✅

### 4. Test Data Isolation
1. Sign in with Account A
2. Create some email deals
3. Sign out
4. Sign in with Account B
5. You should see ZERO deals from Account A ✅

## Customization

### Change Session Duration

In Clerk Dashboard:
1. Go to **Sessions** settings
2. Adjust **Inactive** and **Maximum** lifetimes
3. Enable "Multi-session" for multiple devices

### Add OAuth Providers

In Clerk Dashboard:
1. Go to **User & Authentication** → **Social Connections**
2. Enable Google, GitHub, Microsoft, etc.
3. Configure OAuth credentials
4. Users can now sign in with those providers!

### Customize Sign-In/Sign-Up Pages

Create custom pages:

```typescript
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return <SignIn />;
}
```

## Troubleshooting

### Users Getting Logged Out
- Check Clerk session settings (increase duration)
- Verify `CLERK_SECRET_KEY` is set correctly
- Check browser cookie settings (should allow cookies)

### "Unauthorized" Errors
- Verify environment variables are set
- Check middleware.ts configuration
- Ensure route is not in public routes list

### Session Not Persisting
- Clear browser cookies and re-login
- Check for conflicting middleware
- Verify Clerk API keys are correct

## Production Deployment

### 1. Update Environment Variables

On Vercel/Netlify/etc.:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_production_key
CLERK_SECRET_KEY=sk_live_your_production_key
NODE_ENV=production
```

### 2. Configure Production Instance

In Clerk Dashboard:
1. Create a **Production** instance (separate from Development)
2. Copy production API keys
3. Configure allowed domains
4. Set up production OAuth redirect URIs

### 3. Deploy!

Authentication will be **required** in production mode.

## Need Help?

- Clerk Docs: https://clerk.com/docs
- Next.js Integration: https://clerk.com/docs/quickstarts/nextjs
- Session Management: https://clerk.com/docs/authentication/configuration/session-options

---

**Note**: The previous browser-based session system (`getUserSessionId()`) is kept as a fallback for development environments without Clerk configured. In production with Clerk enabled, it's completely replaced by Clerk's authentication system.
