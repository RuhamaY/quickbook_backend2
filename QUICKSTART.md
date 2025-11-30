# Quick Start Guide

## Step 1: Install Dependencies

```bash
npm install
```

This will install Next.js, React, TypeScript, and all required dependencies.

## Step 2: Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Or create it manually with:

```
CLIENT_ID=your_intuit_client_id
CLIENT_SECRET=your_intuit_client_secret
SMYTHOS_API_KEY=your_smythos_api_key
AP_ACCOUNT_ID=your_ap_account_id
EXPENSE_ACCOUNT_ID=your_expense_account_id
NEXT_PUBLIC_REDIRECT_URI=https://localhost:3000/auth/callback
```

**Important**: Replace the placeholder values with your actual credentials from:
- Intuit Developer Dashboard (for CLIENT_ID and CLIENT_SECRET)
- Your QuickBooks account (for AP_ACCOUNT_ID and EXPENSE_ACCOUNT_ID)

## Step 3: Update Intuit Developer Dashboard

1. Go to https://developer.intuit.com/
2. Navigate to your app → Keys & OAuth
3. Add `https://localhost:3000/auth/callback` to the **Redirect URIs** list
4. Save the changes

## Step 4: Run the Application

### Development with HTTPS (Recommended)

```bash
npm run dev:https
```

This will:
- Start the Next.js development server
- Enable HTTPS on `https://localhost:3000`
- Generate a self-signed certificate automatically

### First Time HTTPS Setup

When you first visit `https://localhost:3000`, your browser will show a security warning because the certificate is self-signed. This is normal for local development:

1. Click **"Advanced"** or **"Show Details"**
2. Click **"Proceed to localhost"** or **"Accept the Risk and Continue"**
3. The browser will remember this choice for future visits

### Development without HTTPS (Not Recommended)

If you need to run without HTTPS (not recommended for OAuth):

```bash
npm run dev
```

**Note**: OAuth callbacks require HTTPS, so you'll need to use `dev:https` for the authentication flow to work.

## Step 5: Test the Application

1. **View API Documentation**:
   - Open `https://localhost:3000/api-docs` in your browser
   - This is an interactive Swagger UI where you can explore and test all endpoints
   - Accept the security warning for the self-signed certificate

2. **Health Check**:
   - Go to: `https://localhost:3000/api/health`
   - You should see: `{"status":"ok","time":...}`

3. **Start OAuth flow**: `https://localhost:3000/api/auth/start`
   - This will redirect you to Intuit's OAuth page
   - After authorization, you'll be redirected back
   - Tokens will be saved to `tokens.json`

3. Test other endpoints:
   - `https://localhost:3000/api/companyinfo` - Get company info
   - `https://localhost:3000/api/customers` - List customers
   - `https://localhost:3000/api/vendors` - List vendors

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev:https
```

### Certificate Issues

If you have certificate problems, the `--experimental-https` flag should generate certificates automatically. If not:

1. Delete `.next` folder: `rm -rf .next`
2. Run again: `npm run dev:https`

### Missing Environment Variables

Make sure all required environment variables are set in `.env.local`:
- `CLIENT_ID` and `CLIENT_SECRET` are required
- `NEXT_PUBLIC_REDIRECT_URI` must match your Intuit dashboard settings

### OAuth Redirect Mismatch

The redirect URI in your `.env.local` must **exactly match** what's configured in Intuit Developer Dashboard:
- ✅ `https://localhost:3000/auth/callback`
- ❌ `http://localhost:3000/auth/callback` (wrong protocol)
- ❌ `https://localhost:3000/auth/callback/` (trailing slash)

## Production Deployment

For production, use a hosting platform that handles HTTPS automatically:
- **Vercel** (recommended for Next.js): `vercel deploy`
- **Netlify**: Connect your Git repository
- **Railway**: `railway up`

Or use a reverse proxy (nginx, Caddy) to handle HTTPS.

