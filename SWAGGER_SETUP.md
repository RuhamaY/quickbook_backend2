# Swagger/OpenAPI Documentation Setup

## Overview

Interactive Swagger UI documentation has been added to the application. You can view and test all API endpoints directly from your browser.

## Access

Once the application is running, access the Swagger documentation at:

**https://localhost:3000/api-docs**

## Features

- ✅ Complete OpenAPI 3.0 specification
- ✅ Interactive endpoint testing
- ✅ Request/response schemas
- ✅ Parameter descriptions and examples
- ✅ All endpoints documented:
  - Health check
  - OAuth authentication
  - Company information
  - Entity management (customers, vendors, invoices, bills, etc.)
  - Search endpoints
  - Bill creation from OCR
  - Custom SQL queries

## Installation

The Swagger UI dependencies are included in `package.json`:

```json
{
  "dependencies": {
    "swagger-ui-react": "^5.10.5",
    "swagger-jsdoc": "^6.2.8"
  }
}
```

After running `npm install`, the Swagger UI will be available.

## Documentation Structure

The OpenAPI specification is defined in `lib/swagger.ts` and includes:

- **Info**: API title, version, description
- **Servers**: Development server URLs (HTTPS and HTTP)
- **Tags**: Organized endpoint groups
- **Paths**: All API endpoints with:
  - HTTP methods (GET, POST)
  - Parameters (query, path, body)
  - Request/response schemas
  - Examples
  - Error responses

## Customization

To modify the Swagger documentation:

1. Edit `lib/swagger.ts` to update the OpenAPI specification
2. The Swagger UI page is at `app/api-docs/page.tsx`
3. Restart the development server to see changes

## Example Usage

1. Start the server: `npm run dev:https`
2. Open `https://localhost:3000/api-docs`
3. Click on any endpoint to expand it
4. Click "Try it out" to test the endpoint
5. Fill in parameters and click "Execute"
6. View the response

## Notes

- The Swagger UI is a client-side component (uses `"use client"`)
- CSS is loaded dynamically to avoid SSR issues
- All endpoints are documented with their actual request/response formats
- The specification matches the actual API implementation

