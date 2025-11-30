# Migration Summary: FastAPI to Next.js

This document summarizes the conversion from FastAPI to Next.js.

## Key Changes

### Technology Stack
- **Backend**: FastAPI (Python) → Next.js API Routes (TypeScript/Node.js)
- **Runtime**: Python 3.12 → Node.js 18+
- **HTTP**: HTTP (localhost:8000) → HTTPS (localhost:3000)
- **Package Manager**: pip/requirements.txt → npm/package.json

### Project Structure

#### FastAPI Structure
```
app.py              # Main FastAPI application
models.py           # Pydantic models
help.py             # Helper utilities
tokens.json         # OAuth tokens storage
```

#### Next.js Structure
```
app/
  api/              # Next.js API routes (App Router)
    auth/           # OAuth endpoints
    bills/          # Bill creation
    customers/      # Customer search
    vendors/        # Vendor search
    [...entity]/    # Dynamic entity routes
lib/                # Utility functions
  config.ts         # Configuration
  tokens.ts         # Token management
  qbo.ts            # QuickBooks API helpers
  bills.ts          # Bill creation helpers
types/
  models.ts         # TypeScript type definitions
```

### API Endpoints Mapping

| FastAPI Route | Next.js Route | Status |
|--------------|---------------|--------|
| `GET /health` | `GET /api/health` | ✅ |
| `GET /auth/start` | `GET /api/auth/start` | ✅ |
| `GET /auth/callback` | `GET /api/auth/callback` | ✅ |
| `GET /auth/tokens` | `GET /api/auth/tokens` | ✅ |
| `GET /companyinfo` | `GET /api/companyinfo` | ✅ |
| `GET /query` | `GET /api/query` | ✅ |
| `GET /{entity}` | `GET /api/{entity}` | ✅ |
| `GET /{entity}/{id}` | `GET /api/{entity}/{id}` | ✅ |
| `GET /customers/search` | `GET /api/customers/search` | ✅ |
| `GET /vendors/search` | `GET /api/vendors/search` | ✅ |
| `POST /bills/from-ocr` | `POST /api/bills/from-ocr` | ✅ |

### Code Conversions

#### Models (Pydantic → TypeScript)
```python
# FastAPI (Pydantic)
class InvoiceIn(BaseModel):
    vendor_name: Optional[str]
    invoice_number: Optional[str]
    # ...
```

```typescript
// Next.js (TypeScript)
export interface InvoiceIn {
  vendor_name?: string | null;
  invoice_number?: string | null;
  // ...
}
```

#### HTTP Requests (requests → fetch)
```python
# FastAPI
r = requests.post(TOKEN_URL, headers=headers, data=data, timeout=30)
```

```typescript
// Next.js
const response = await fetch(TOKEN_URL, {
  method: "POST",
  headers,
  body: params.toString(),
});
```

#### File Operations
```python
# FastAPI
with TOKENS_FILE.open("w") as f:
    json.dump(tokens, f, indent=2)
```

```typescript
// Next.js
await fs.writeFile(filePath, JSON.stringify(tokens, null, 2), "utf-8");
```

### Configuration Changes

#### Environment Variables
- FastAPI: Used `python-dotenv` with `.env`
- Next.js: Uses `.env.local` or `.env` (built-in support)
- Added `NEXT_PUBLIC_REDIRECT_URI` for client-side redirect URI

#### Redirect URI
- FastAPI: `http://localhost:8000/auth/callback`
- Next.js: `https://localhost:3000/auth/callback` (HTTPS)

### HTTPS Setup

#### Development
- FastAPI: HTTP only (uvicorn default)
- Next.js: `npm run dev:https` uses `--experimental-https` flag

#### Production
- FastAPI: Typically behind reverse proxy (nginx)
- Next.js: Same approach recommended, or use hosting platforms (Vercel, Netlify, etc.)

### Dependencies

#### FastAPI
```
fastapi
uvicorn
pydantic
python-dotenv
requests
```

#### Next.js
```
next
react
react-dom
typescript
@types/node
@types/react
```

### Features Preserved

✅ OAuth 2.0 authentication flow
✅ Token refresh mechanism
✅ QuickBooks API integration
✅ Entity querying (customers, vendors, invoices, bills, etc.)
✅ Bill creation from OCR invoices
✅ Search functionality
✅ Error handling
✅ Token persistence (tokens.json)

### Breaking Changes

1. **Base URL**: Changed from `http://localhost:8000` to `https://localhost:3000`
2. **API Prefix**: All routes now prefixed with `/api`
3. **Environment Variables**: Must update redirect URI in Intuit Developer Dashboard
4. **Runtime**: Requires Node.js instead of Python

### Migration Checklist

- [x] Convert Pydantic models to TypeScript interfaces
- [x] Convert FastAPI routes to Next.js API routes
- [x] Convert Python helpers to TypeScript utilities
- [x] Update HTTP client from requests to fetch
- [x] Update file I/O operations
- [x] Configure HTTPS for development
- [x] Update environment variable configuration
- [x] Create documentation (README.md)
- [x] Update .gitignore for Next.js

### Next Steps

1. Install dependencies: `npm install`
2. Create `.env.local` with your credentials
3. Update Intuit Developer Dashboard redirect URI to `https://localhost:3000/auth/callback`
4. Run `npm run dev:https` to start development server
5. Test OAuth flow at `https://localhost:3000/api/auth/start`


