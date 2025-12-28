# 🔄 Transfer EAS Project to Organization

## Current Situation
- **Current Owner**: `pjcdev` (personal account)
- **Desired Owner**: `project-comfort-dev` (organization)
- **Project ID**: `256e912e-3a30-479d-8524-c2c92a08f80a`

## Step 1: Transfer Project via Expo Dashboard

### Option A: Transfer via Web Dashboard (Recommended)

1. Go to [Expo Dashboard](https://expo.dev)
2. Sign in with your `pjcdev` account
3. Navigate to your project: `deal-analyzer-mobile`
4. Go to **Settings** → **General**
5. Find **Transfer Project** or **Change Owner** section
6. Select **Transfer to Organization**
7. Choose `project-comfort-dev` from the list
8. Confirm the transfer

### Option B: Transfer via EAS CLI

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas project:transfer --to project-comfort-dev
```

**Note**: You may need to be logged in as the current owner (`pjcdev`) and have admin access to the `project-comfort-dev` organization.

## Step 2: Verify Transfer

After transferring, verify the project is under the organization:

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas project:info
```

Should show:
- **Owner**: `project-comfort-dev`
- **Project ID**: `256e912e-3a30-479d-8524-c2c92a08f80a` (same ID)

## Step 3: Update Permissions

After transfer, make sure:
1. Your account has access to the `project-comfort-dev` organization
2. You have the necessary permissions (Admin or Member with build permissions)
3. All team members who need access are added to the organization

## Alternative: Create New Project Under Organization

If transfer is not possible, you can create a new project:

### Step 1: Remove Old Project ID

Edit `app.json` and remove the `projectId`:

```json
"extra": {
  "eas": {
    // Remove projectId temporarily
  },
  "clerkPublishableKey": "..."
}
```

### Step 2: Create New Project

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas build:configure
```

When prompted:
- Select **iOS** (or both platforms)
- It will create a new project under `project-comfort-dev` organization
- This will update `app.json` with the new project ID

### Step 3: Update EAS Secrets

After creating the new project, you'll need to:
1. Re-add environment variables/secrets for the new project
2. Or they might transfer automatically if you use the transfer method

## Important Notes

⚠️ **Before Transferring:**
- Make sure you have admin access to `project-comfort-dev` organization
- Verify all team members who need access are in the organization
- Note that build history and secrets may need to be reconfigured

⚠️ **After Transferring:**
- The project ID stays the same
- Build history should be preserved
- Environment variables/secrets may need to be re-added
- You may need to re-authenticate with EAS

## Current Configuration

Your `app.json` is now set to:
- **Owner**: `project-comfort-dev` ✅

Once you transfer the project, the warning will disappear and everything will work correctly.

## Quick Transfer Command

Try this first:

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas project:transfer --to project-comfort-dev
```

If that doesn't work, use the web dashboard method.

