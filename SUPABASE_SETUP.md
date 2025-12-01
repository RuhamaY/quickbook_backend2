# Supabase Setup for Token Storage

This guide explains how to set up Supabase for persistent token storage in serverless environments.

## Why Supabase?

In serverless environments (like Vercel, AWS Lambda, etc.), temporary files are not accessible across function invocations. Supabase provides a persistent database solution for storing QuickBooks OAuth tokens.

## Setup Steps

### 1. Create a Supabase Project

1. Go to https://supabase.com and sign up/login
2. Create a new project
3. Wait for the project to be fully provisioned

### 2. Get Your Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **Service Role Key** (under "Project API keys" → "service_role" key)
   - ⚠️ **Important**: Use the `service_role` key, not the `anon` key. The service role key bypasses Row Level Security (RLS) which is needed for server-side token storage.

### 3. Run the Database Migration

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `supabase_migration.sql`
4. Click **Run** to execute the migration
5. Verify the table was created by checking **Table Editor** → `qb_tokens`

### 4. Configure Environment Variables

Add these to your `.env.local` file (or your deployment platform's environment variables):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**For Vercel:**
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add both variables
4. Redeploy your application

### 5. Verify Setup

1. Start your application
2. Navigate to `/api/auth/start` to begin OAuth flow
3. Complete the QuickBooks authorization
4. Check your Supabase dashboard → **Table Editor** → `qb_tokens`
5. You should see a row with `id = 1` containing your tokens

## How It Works

- **Automatic Detection**: The app automatically detects if Supabase is configured
- **Fallback**: If Supabase is not configured, it falls back to file-based storage (works locally but not in serverless)
- **Single Row**: The table uses a single row (id=1) to store tokens for a single QuickBooks connection
- **Automatic Updates**: Tokens are automatically saved when:
  - Initial OAuth authorization completes
  - Tokens are refreshed (when access token expires)

## Security Notes

- The `service_role` key has full access to your database
- **Never expose this key** in client-side code
- Keep it in server-side environment variables only
- Consider enabling Row Level Security (RLS) if you plan to access tokens from client-side code (though this is not recommended)

## Troubleshooting

### Tokens not saving to Supabase

1. Check that environment variables are set correctly
2. Verify the migration was run successfully
3. Check Supabase logs in the dashboard
4. Check application logs for Supabase connection errors

### "Supabase URL is not configured" error

- Make sure `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL` is set
- Restart your development server after adding environment variables

### "Supabase service role key is not configured" error

- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set
- Verify you're using the `service_role` key, not the `anon` key

