# Bookkeeping - QuickBooks Online Integration

A Next.js application for integrating with QuickBooks Online API, converted from FastAPI.

## Features

- OAuth 2.0 authentication with Intuit/QuickBooks
- Query QuickBooks entities (customers, vendors, invoices, bills, etc.)
- Create bills from OCR-processed invoices
- Automatic token refresh
- HTTPS support

## Setup

### Prerequisites

- Node.js 18+ and npm
- QuickBooks Developer account with OAuth credentials
- Environment variables configured

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file (or `.env`) with your credentials:
```
CLIENT_ID=your_intuit_client_id
CLIENT_SECRET=your_intuit_client_secret
SMYTHOS_API_KEY=your_smythos_api_key
AP_ACCOUNT_ID=your_ap_account_id
EXPENSE_ACCOUNT_ID=your_expense_account_id
NEXT_PUBLIC_REDIRECT_URI=https://localhost:3000/auth/callback
```

3. Make sure to add `https://localhost:3000/auth/callback` to your QuickBooks OAuth redirect URIs in the Intuit Developer Dashboard.

## Running with HTTPS

### Development with HTTPS

Next.js supports HTTPS in development mode using the `--experimental-https` flag:

```bash
npm run dev:https
```

This will start the development server at `https://localhost:3000` with a self-signed certificate. Your browser will show a security warning - this is normal for local development. Click "Advanced" and proceed to accept the certificate.

### Production with HTTPS

For production, you have several options:

#### Option 1: Using a Reverse Proxy (Recommended)

Use nginx, Caddy, or another reverse proxy to handle HTTPS:

**nginx example:**
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Option 2: Using a Hosting Platform

Deploy to platforms that handle HTTPS automatically:
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Railway
- Render

#### Option 3: Using Next.js with Custom Server

You can create a custom HTTPS server, but this is not recommended for production. Use a reverse proxy instead.

## API Documentation

Interactive Swagger/OpenAPI documentation is available at:
- **Swagger UI**: `https://localhost:3000/api-docs` (when running with HTTPS)

The Swagger UI provides:
- Complete API endpoint documentation
- Request/response schemas
- Interactive testing of endpoints
- Parameter descriptions and examples

## API Endpoints

All endpoints are prefixed with `/api`:

### Authentication
- `GET /api/auth/start` - Start OAuth flow
- `GET /api/auth/callback` - OAuth callback
- `GET /api/auth/tokens` - Inspect tokens (redacted)

### QuickBooks Entities
- `GET /api/{entity}` - List entities (customers, vendors, invoices, bills, etc.)
  - Query params: `where`, `orderby`, `start`, `max`
- `GET /api/{entity}/{id}` - Get entity by ID
- `GET /api/customers/search` - Search customers
- `GET /api/vendors/search` - Search vendors
- `GET /api/query?sql=...` - Execute custom SQL query
- `GET /api/companyinfo` - Get company information

### Bills
- `POST /api/bills/from-ocr` - Create bill from OCR-processed invoice

### Health
- `GET /api/health` - Health check

## Usage

1. Start the server:
```bash
npm run dev:https
```

2. View API documentation:
   - Open `https://localhost:3000/api-docs` in your browser
   - Accept the security warning (self-signed certificate)
   - Explore and test all API endpoints interactively

3. Navigate to `https://localhost:3000/api/auth/start` to begin OAuth flow

3. After authorization, tokens will be saved to `tokens.json`

4. Use the API endpoints to interact with QuickBooks

## Project Structure

```
├── app/
│   └── api/              # Next.js API routes
├── lib/                  # Utility functions
│   ├── config.ts         # Configuration constants
│   ├── tokens.ts         # Token management
│   ├── qbo.ts            # QuickBooks API helpers
│   └── bills.ts          # Bill creation helpers
├── types/
│   └── models.ts         # TypeScript type definitions
└── tokens.json           # Stored OAuth tokens (gitignored)
```

## Notes

- The application uses QuickBooks Sandbox API by default
- Tokens are stored in `tokens.json` (make sure this is in `.gitignore`)
- The redirect URI must match exactly what's configured in Intuit Developer Dashboard
- HTTPS is required for OAuth callbacks in production

## Migration from FastAPI

This application was converted from FastAPI. Key changes:
- Python/Pydantic models → TypeScript interfaces
- FastAPI routes → Next.js API routes (App Router)
- Python `requests` → JavaScript `fetch`
- File-based token storage remains the same
- All API endpoints maintain the same functionality


