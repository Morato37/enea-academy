# Microsoft 365 Single Sign-On Setup Guide

This guide explains how to integrate Microsoft 365 (Azure AD) authentication into your Enea Academy application.

## Overview

Users will be able to sign in with their M365 company account using the "Sign in with Microsoft 365" button on the login page. The integration uses Azure AD OAuth 2.0 and is handled by Supabase.

## Step 1: Azure AD App Registration (M365 Admin)

Your M365 Administrator needs to complete these steps in the Azure Portal:

### 1.1 Create App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: `Enea Academy` (or your preferred name)
   - **Supported account types**: Select `Accounts in this organizational directory only (Single tenant)`
   - **Redirect URI**: Leave blank for now (you'll add this in Step 2)
5. Click **Register**

### 1.2 Note the Application Details

After registration, you'll see the app overview page. **Copy and save these values**:

- **Application (client) ID**: e.g., `12345678-1234-1234-1234-123456789abc`
- **Directory (tenant) ID**: e.g., `87654321-4321-4321-4321-cba987654321`

### 1.3 Create Client Secret

1. In your app registration, go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description (e.g., "Enea Academy Production")
4. Choose an expiration period (recommended: 24 months)
5. Click **Add**
6. **Immediately copy the secret value** (it won't be shown again!)
7. Store it securely

### 1.4 Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   - `email`
   - `openid`
   - `profile`
   - `User.Read`
6. Click **Add permissions**
7. Click **Grant admin consent** (requires admin privileges)

## Step 2: Supabase Configuration

### 2.1 Enable Azure Provider in Supabase

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** > **Providers**
4. Find **Azure** in the provider list
5. Toggle it to **Enabled**

### 2.2 Configure Azure Settings

Enter the values from Step 1.2 and 1.3:

- **Azure Client ID**: Paste the Application (client) ID
- **Azure Secret**: Paste the client secret value
- **Azure Tenant ID**: Paste the Directory (tenant) ID

### 2.3 Copy the Callback URL

Supabase will show you a **Callback URL** (redirect URI). It looks like:
```
https://[your-project-ref].supabase.co/auth/v1/callback
```

**Copy this URL** - you'll need it in the next step.

### 2.4 Optional: Restrict by Email Domain

To only allow users from your company domain:

1. In the Azure provider settings, find **Email Allowlist**
2. Add your company domain, e.g., `@your-company.com`
3. Click **Save**

## Step 3: Update Azure AD Redirect URI

Go back to Azure Portal:

1. Navigate to your app registration
2. Go to **Authentication**
3. Click **Add a platform**
4. Select **Web**
5. Paste the Callback URL from Step 2.3
6. Under **Implicit grant and hybrid flows**, check:
   - ✓ ID tokens (used for implicit and hybrid flows)
7. Click **Configure**

## Step 4: Test the Integration

### 4.1 Test Login Flow

1. Open your application's login page
2. Click **Sign in with Microsoft 365**
3. You should be redirected to Microsoft login
4. Enter your M365 credentials
5. Approve the permissions request
6. You should be redirected back to the application and logged in

### 4.2 Verify User Profile

After successful login:
- A user profile is automatically created in the database
- The user's name and email are populated from M365
- The default role is set to `user`
- No password change is required

### 4.3 Troubleshooting

**Error: "Invalid redirect URI"**
- Make sure the redirect URI in Azure exactly matches the Supabase callback URL
- Check for trailing slashes (they must match exactly)

**Error: "AADSTS50105: The signed in user is not assigned to a role"**
- This means the user needs to be assigned to the app in Azure AD
- Go to **Enterprise Applications** > Your app > **Users and groups**
- Click **Add user/group** and assign users

**Error: "Email domain not allowed"**
- Check the email allowlist in Supabase
- Make sure the user's email domain matches

**User can't see any data after login**
- Check that the user profile was created in the `user_profiles` table
- Verify RLS policies are working correctly

## Step 5: Optional Enhancements

### 5.1 Assign Admin Role to Specific Users

After a user logs in for the first time, you can promote them to admin:

1. Go to your Supabase project
2. Navigate to **Table Editor** > `user_profiles`
3. Find the user by email
4. Change their `role` from `user` to `admin`

### 5.2 Automatic Role Assignment

You can configure automatic role assignment based on Azure AD groups:

1. In Azure AD, add custom claims to the token
2. Update the `handle_new_user()` function to read these claims
3. Automatically assign roles based on group membership

### 5.3 Disable Email/Password Login

If you want to use ONLY M365 login:

1. Remove or comment out the email/password form in `LoginForm.tsx`
2. Keep only the Microsoft login button
3. Update the page design accordingly

## Security Notes

- **Client Secret Expiration**: Azure client secrets expire. Set a calendar reminder to rotate the secret before it expires
- **Principle of Least Privilege**: Only grant the minimum required API permissions
- **Regular Audits**: Periodically review who has access to the application
- **Conditional Access**: Consider using Azure AD Conditional Access policies for additional security
- **MFA**: Enforce Multi-Factor Authentication in M365 for all users

## Summary of Required Information

Send this to your M365 Administrator:

| Information Needed | Example | Where to Enter |
|-------------------|---------|----------------|
| Application (client) ID | `12345678-1234-...` | Supabase Dashboard |
| Directory (tenant) ID | `87654321-4321-...` | Supabase Dashboard |
| Client Secret | `abc123~xyz...` | Supabase Dashboard |
| Callback URL | `https://xyz.supabase.co/auth/v1/callback` | Azure App Registration |

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Review the Supabase Auth logs in the Dashboard
3. Verify all configuration values are correct
4. Ensure the Azure app has the correct permissions and consent

## Next Steps

Once M365 login is working:

- Test with multiple users from your organization
- Document the login process for your end users
- Consider implementing role-based access control
- Set up monitoring and logging for authentication events
