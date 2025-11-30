# Debugging Guide - QuickBooks Connection

This guide explains the logging statements added to help debug QuickBooks connection issues.

## Log Icons

- 🔵 Blue circle - OAuth start flow
- 🟢 Green circle - OAuth callback
- 🟡 Yellow circle - Token exchange
- 🔄 Refresh icon - Token refresh
- 🔷 Diamond - Token validation
- 💾 Floppy disk - Token save
- 🔵 Blue circle - QuickBooks API query
- 🟣 Purple circle - API request with refresh
- 📊 Chart - Company info request
- 🔍 Magnifying glass - Custom query
- ⚙️ Gear - Configuration
- ✅ Checkmark - Success
- ❌ X - Error

## Debugging Flow

### 1. Starting OAuth Flow (`/api/auth/start`)

Look for:
```
🔵 [AUTH START] Initiating OAuth flow...
🔵 [AUTH START] CLIENT_ID: ABDjG9Z2tW...
🔵 [AUTH START] REDIRECT_URI: https://localhost:3000/auth/callback
🔵 [AUTH START] Redirecting to: [URL]
```

**Common Issues:**
- ❌ `CLIENT_ID: MISSING` - Check your `.env.local` file
- ❌ `ERROR: CLIENT_ID is missing!` - Environment variable not loaded

### 2. OAuth Callback (`/api/auth/callback`)

Look for:
```
🟢 [AUTH CALLBACK] OAuth callback received
🟢 [AUTH CALLBACK] Query params: { hasCode: true, realmId: '...', ... }
🟢 [AUTH CALLBACK] Exchanging code for tokens...
```

**Common Issues:**
- ❌ `error: 'access_denied'` - User denied authorization
- ❌ `Missing code or realmId` - Redirect URI mismatch or OAuth error
- Check the full callback URL in the logs

### 3. Token Exchange

Look for:
```
🟡 [TOKEN EXCHANGE] Starting token exchange...
🟡 [TOKEN EXCHANGE] TOKEN_URL: https://oauth.platform.intuit.com/...
🟡 [TOKEN EXCHANGE] CLIENT_ID: ABDjG9Z2tW...
🟡 [TOKEN EXCHANGE] CLIENT_SECRET: ***SET***
🟡 [TOKEN EXCHANGE] Response status: 200
✅ [TOKEN EXCHANGE] Success! Token keys: [...]
```

**Common Issues:**
- ❌ `CLIENT_SECRET: MISSING` - Check `.env.local`
- ❌ `Token exchange failed: 400` - Invalid code or redirect URI mismatch
- ❌ `Token exchange failed: 401` - Invalid client credentials
- Check the response body in error logs

### 4. Token Storage

Look for:
```
💾 [SAVE TOKENS] Saving tokens to: /path/to/tokens.json
💾 [SAVE TOKENS] Token keys: ['access_token', 'refresh_token', ...]
✅ [SAVE TOKENS] Tokens saved successfully
```

### 5. QuickBooks API Calls

Look for:
```
🔵 [QBO QUERY] Executing query...
🔵 [QBO QUERY] URL: https://sandbox-quickbooks.api.intuit.com/...
🔵 [QBO QUERY] SQL: select * from Customer
🔵 [QBO QUERY] Response status: 200
✅ [QBO QUERY] Success!
```

**Common Issues:**
- ❌ `Response status: 401` - Token expired, should trigger refresh
- ❌ `Response status: 400` - Invalid SQL query
- ❌ `Response status: 403` - Insufficient permissions
- Check the response body for detailed error messages

### 6. Token Refresh

Look for:
```
🟣 [WITH REFRESH] Got 401, attempting token refresh...
🔄 [TOKEN REFRESH] Starting token refresh...
🔄 [TOKEN REFRESH] Response status: 200
✅ [TOKEN REFRESH] Success!
🟣 [WITH REFRESH] Retry response status: 200
```

**Common Issues:**
- ❌ `Token refresh failed: 400` - Invalid refresh token
- ❌ `Token refresh failed: 401` - Refresh token expired

## Configuration Check

On server startup, you should see:
```
⚙️  [CONFIG] Configuration loaded:
⚙️  [CONFIG] CLIENT_ID: ABDjG9Z2tW... ✅
⚙️  [CONFIG] CLIENT_SECRET: ✅ SET
⚙️  [CONFIG] REDIRECT_URI: https://localhost:3000/auth/callback
⚙️  [CONFIG] API_HOST: https://sandbox-quickbooks.api.intuit.com
```

If you see ❌, check your `.env.local` file.

## Common Error Patterns

### 1. "Missing CLIENT_ID or CLIENT_SECRET"
- **Solution**: Check `.env.local` file exists and has correct values
- **Verify**: Restart the server after editing `.env.local`

### 2. "Token exchange failed: 400"
- **Possible causes**:
  - Redirect URI mismatch (check Intuit Developer Dashboard)
  - Authorization code already used or expired
  - Invalid code parameter
- **Solution**: Start OAuth flow again from `/api/auth/start`

### 3. "Response status: 401" on API calls
- **Expected behavior**: Should automatically refresh token
- **If refresh fails**: Re-authenticate at `/api/auth/start`

### 4. "tokens.json missing access_token or realm_id"
- **Solution**: Delete `tokens.json` and re-authenticate
- **Check**: File permissions on `tokens.json`

## Testing Steps

1. **Check Configuration**:
   ```bash
   npm run dev:https
   # Look for ⚙️ [CONFIG] logs
   ```

2. **Start OAuth**:
   - Visit `https://localhost:3000/api/auth/start`
   - Check logs for 🔵 [AUTH START]

3. **Complete OAuth**:
   - Authorize in browser
   - Check logs for 🟢 [AUTH CALLBACK] and 🟡 [TOKEN EXCHANGE]

4. **Test API**:
   - Visit `https://localhost:3000/api/companyinfo`
   - Check logs for 📊 [COMPANY INFO] and 🔵 [QBO QUERY]

## Viewing Logs

Logs appear in your terminal where you ran `npm run dev:https`. They are color-coded with emojis for easy scanning.

For production, consider using a logging service or file-based logging.

