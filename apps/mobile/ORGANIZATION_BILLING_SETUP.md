# Organization Billing Setup

## Current Status ✅

**Project Ownership**: Already correct!
- Project is under `@project-comfort-dev` organization
- `app.json` has `"owner": "project-comfort-dev"`

## Billing Issue

The billing message shows `pjcdev` because the organization doesn't have its own billing plan. The project uses the personal account's build quota.

## Solution: Set Up Organization Billing

### Step 1: Access Organization Settings

1. Go to [Expo Dashboard](https://expo.dev)
2. Switch to your organization: `project-comfort-dev`
3. Navigate to: `https://expo.dev/accounts/project-comfort-dev/settings/billing`

### Step 2: Set Up Billing

1. Click **"Set up billing"** or **"Add payment method"**
2. Add a payment method for the organization
3. Choose a plan (if upgrading from free tier)

### Step 3: Verify

After setting up billing:
- The organization will have its own build quota
- Builds will be billed to the organization, not your personal account
- The billing message should show `project-comfort-dev` instead of `pjcdev`

## Alternative: Keep Personal Billing

If you want to keep using your personal account's quota:
- No action needed - current setup works
- Project is owned by organization but uses personal billing
- This is fine for development/testing

## Verify Project Ownership

Run this to confirm:
```bash
cd mobile
eas project:info
```

Should show:
```
fullName  @project-comfort-dev/deal-analyzer-mobile
```

If it shows `@pjcdev`, then you need to transfer (see TRANSFER_PROJECT_STEPS.md).

## Summary

✅ **Project is already owned by organization** (`@project-comfort-dev`)
⚠️ **Billing is on personal account** (`pjcdev`) - optional to change
✅ **Configuration is correct** (`app.json` has correct owner)

The project ownership is correct! The billing message is just about which account's quota is being used.

