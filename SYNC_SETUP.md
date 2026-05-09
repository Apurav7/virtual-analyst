# Environment Variables Setup for Data Sync

Add these environment variables to your Vercel project settings:

## Sync & Cron Configuration
```
SYNC_SECRET_KEY=your-secure-sync-secret-key
CRON_SECRET=your-secure-cron-secret-key
```

## Google API Tokens (Set these with valid OAuth tokens)
```
GOOGLE_ACCESS_TOKEN=your-google-access-token
GOOGLE_ADS_ACCESS_TOKEN=your-google-ads-access-token
GOOGLE_SC_ACCESS_TOKEN=your-google-search-console-access-token
```

## How to Get Google Access Tokens

1. **Google Analytics 4 Token:**
   - Use the OAuth 2.0 credentials you created
   - Exchange authorization code for access token
   - Token expires - implement refresh token flow

2. **Google Ads Token:**
   - Similar OAuth 2.0 flow
   - Requires Ads API access

3. **Google Search Console Token:**
   - OAuth 2.0 access token for Search Console API

## Instructions to Deploy

1. Get a new authorization code by visiting:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000&response_type=code&scope=https://www.googleapis.com/auth/analytics.readonly%20https://www.googleadwords.com/api/adwords%20https://www.googleapis.com/auth/webmasters.readonly
   ```

2. Exchange it for an access token using Node.js:
   ```javascript
   const { google } = require('googleapis');
   const oauth2Client = new google.auth.OAuth2(
     CLIENT_ID,
     CLIENT_SECRET,
     'http://localhost:3000'
   );
   
   const { tokens } = await oauth2Client.getToken(code);
   console.log('Access Token:', tokens.access_token);
   ```

3. Set these tokens in Vercel Environment Variables

4. Deploy again:
   ```bash
   vercel --prod
   ```

## Daily Sync Schedule

The cron job runs daily at 2 AM UTC (configured in vercel.json).
You can manually trigger syncs using the "🔄 Refresh Data" button in the dashboard.

## Testing the Sync

1. Click "🔄 Refresh Data" button on dashboard to test manual sync
2. Check Vercel logs for sync status
3. Data will be fetched and stored in Supabase database
4. Dashboard will automatically fetch from database when real data is available
