# Fix for 401 Error on /api/criteria

## Problem
The `/api/criteria` endpoint was returning 401 Unauthorized errors because the middleware was requiring authentication for all API routes.

## Solution Implemented

### 1. Added `/api/criteria` to Public Routes
- Added `/api/criteria` to `safePublicRoutes` in `middleware.ts`
- This allows GET requests to work without authentication

### 2. Added Explicit Fallback Check
- Added explicit check for GET requests to `/api/criteria` as a fallback
- This ensures the route is accessible even if route matcher has issues

### 3. Protected PUT Requests
- PUT requests to `/api/criteria` require authentication (checked in route handler)
- GET requests are public (no auth required)

## Testing the Fix

### If you're still getting 401 errors:

1. **Restart your development server:**
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   # or
   yarn dev
   ```

2. **Clear browser cache:**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)
   - Or clear browser cache and cookies

3. **Check if you're in development mode:**
   ```bash
   echo $NODE_ENV
   # Should be 'development' or undefined
   ```

4. **Verify the middleware is working:**
   - Check browser console for middleware logs
   - Check server logs for any middleware errors

5. **Test the endpoint directly:**
   ```bash
   curl http://localhost:3000/api/criteria
   # Should return criteria data, not 401
   ```

## Environment Variables

Make sure these are set correctly:
- `NODE_ENV=development` (for development)
- `FEATURE_ALLOW_PUBLIC_ROUTES=true` (if you want to allow public routes in production - NOT RECOMMENDED)

## If Still Not Working

1. Check if the middleware file is being executed:
   - Add a console.log at the top of the middleware function
   - Check if it appears in server logs

2. Verify the route matcher:
   - The route `/api/criteria` should match the pattern `/api/criteria`
   - Test with: `createRouteMatcher(['/api/criteria'])`

3. Check for other middleware or authentication layers:
   - Check if there are other middleware files
   - Check if Clerk is configured correctly

4. Check if running in production mode:
   - If `NODE_ENV=production`, the middleware will enforce authentication
   - Make sure you're running in development mode locally

## Files Modified

- `middleware.ts` - Added `/api/criteria` to public routes and explicit fallback check
- `app/api/criteria/route.ts` - Added auth check for PUT requests only

## Deployment Notes

- In production, GET requests to `/api/criteria` are public (no auth required)
- PUT requests to `/api/criteria` require authentication
- This is safe because GET only returns default criteria (non-sensitive data)
- PUT updates are protected and use in-memory cache (resets on server restart)

