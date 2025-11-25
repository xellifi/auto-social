# AutoSocial AI Setup Guide

## Prerequisites

1. Node.js installed
2. Supabase account
3. Facebook Developer Account

## Step 1: Configure Environment Variables

Create a `.env.local` file in the project root with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Database Setup

The database schema has been created with the following tables:

- `user_profiles` - User account information
- `facebook_accounts` - Connected Facebook accounts
- `facebook_pages` - Facebook pages with automation settings
- `scheduled_posts` - Posts scheduled for publishing
- `api_configurations` - AI provider API keys
- `app_settings` - Facebook App credentials and SMTP settings

All tables have Row Level Security enabled.

## Step 4: Facebook App Setup

1. Go to https://developers.facebook.com/
2. Create a new app or use an existing one
3. Add "Facebook Login" product
4. Configure OAuth redirect URIs to include your app URL
5. Request the following permissions:
   - pages_show_list
   - pages_read_engagement
   - pages_manage_posts
   - pages_manage_metadata
   - pages_messaging
   - instagram_basic
   - instagram_manage_insights

6. Note your App ID and App Secret

## Step 5: Run the Application

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## Step 6: First Time Setup

1. Sign up for an account in the application
2. Go to Settings and enter your Facebook App ID and App Secret
3. Save the credentials
4. Return to Dashboard
5. Click "Connect with Facebook" button
6. Authorize the app to access your Facebook pages
7. Your pages will be automatically imported

## Features

- Facebook OAuth integration
- Multiple page management
- AI-powered comment replies (configure in API Manager)
- Automated post scheduling
- Instagram integration for connected pages
- Activity monitoring
- Per-page automation settings
- AI personality training per page

## Security Notes

- All sensitive data (tokens, API keys) is stored securely in Supabase
- Row Level Security ensures users can only access their own data
- Facebook tokens are long-lived and automatically exchanged during OAuth
- API keys are encrypted in the database

## Troubleshooting

### "Missing Facebook App ID" error
- Make sure you've configured your Facebook App credentials in Settings first

### Pages not appearing after connection
- Check browser console for errors
- Verify your Facebook App has the correct permissions
- Ensure your pages are accessible from your Facebook account

### OAuth redirect issues
- Verify your Facebook App's redirect URIs include your app URL
- Check that the URL matches exactly (including https://)
